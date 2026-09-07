<script lang="ts">
  import type { CommandRef } from '../lib/types/keymap';
  import { assetUrl } from '../lib/assets';
  import { keymap } from '../lib/state/keymapStore';
  import { pickLocalized, uiLocale } from '../lib/i18n/locale';
  import { portal } from '../lib/dom/portal';

  export let command: CommandRef;
  export let draggable = true;
  export let preview = false;
  export let sourceKey = '';
  export let sourceSlot = '';

  let tipVisible = false;
  let tipLeft = 0;
  let tipTop = 0;

  $: description = pickLocalized(command.descriptions, $uiLocale);

  $: isDragSource =
    !preview &&
    draggable &&
    $keymap.drag?.command.id === command.id &&
    ($keymap.drag?.sourceKey ?? '') === sourceKey &&
    ($keymap.drag?.sourceSlot ?? '') === sourceSlot;

  $: sectorClass = command.sector ? `sector-${command.sector}` : '';
  $: sectorDimmed =
    $keymap.selectedProgram === 'vim' &&
    ($keymap.activeSectors?.length ?? 0) > 0 &&
    (!command.sector || !$keymap.activeSectors.includes(command.sector));
  $: vimHighlighted =
    $keymap.selectedProgram === 'vim' &&
    ($keymap.vimHighlightCommandIds ?? []).includes(command.id);

  $: if ($keymap.drag || preview) {
    tipVisible = false;
  }

  function handleDragStart(event: DragEvent) {
    if (!draggable || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    tipVisible = false;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        command,
        sourceKey,
        sourceSlot,
      }),
    );
    keymap.getState().startDrag(command, sourceKey, sourceSlot);
  }

  function handleDragEnd() {
    keymap.getState().endDrag();
  }

  function handleActivate() {
    if (preview || $keymap.selectedProgram !== 'vim' || !sourceKey) {
      return;
    }
    keymap.getState().activateVimCommand(command, sourceKey, sourceSlot);
  }

  function showTip(event: MouseEvent) {
    if (preview || $keymap.drag) {
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    tipLeft = Math.min(Math.max(8, rect.left), window.innerWidth - 268);
    tipTop = rect.bottom + 6;
    if (tipTop > window.innerHeight - 120) {
      tipTop = Math.max(8, rect.top - 88);
    }
    tipVisible = true;
  }

  function hideTip() {
    tipVisible = false;
  }
</script>

<div
  class="command_description {sectorClass}"
  class:locked-binding={!draggable && !preview}
  class:drag-preview={preview}
  class:drag-source={isDragSource}
  class:sector-dimmed={sectorDimmed}
  class:vim-highlighted={vimHighlighted}
  draggable={draggable && !preview}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  on:click={handleActivate}
  on:keydown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  }}
  on:mouseenter={showTip}
  on:mouseleave={hideTip}
  role={$keymap.selectedProgram === 'vim' && sourceKey && !preview ? 'button' : 'listitem'}
>
  <div class="descr">
    {#if command.icon}
      <img class="icons" src={assetUrl(command.icon)} alt="" />
    {/if}
    {command.shortName}
  </div>
  {#if tipVisible}
    <div
      class="chip-popover"
      style="position: fixed; left: {tipLeft}px; top: {tipTop}px"
      role="tooltip"
      use:portal
    >
      <div class="chip-popover-title">
        {#if command.icon}
          <img class="icons" src={assetUrl(command.icon)} alt="" />
        {/if}
        <span>{command.shortName}</span>
      </div>
      {#if description}
        <p class="chip-popover-body">{description}</p>
      {/if}
    </div>
  {/if}
</div>
