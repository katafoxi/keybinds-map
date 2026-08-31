<script lang="ts">
  import type { CommandRef } from '../lib/types/keymap';
  import { assetUrl } from '../lib/assets';
  import { keymap } from '../lib/state/keymapStore';
  import { pickLocalized, uiLocale } from '../lib/i18n/locale';

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

  function showTip(event: MouseEvent) {
    if (preview || $keymap.drag) {
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    tipLeft = Math.min(rect.left, window.innerWidth - 260);
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
  class="command_description"
  class:locked-binding={!draggable && !preview}
  class:drag-preview={preview}
  class:drag-source={isDragSource}
  draggable={draggable && !preview}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  on:mouseenter={showTip}
  on:mouseleave={hideTip}
  role="listitem"
>
  <div class="descr">
    {#if command.icon}
      <img class="icons" src={assetUrl(command.icon)} alt="" />
    {/if}
    {command.shortName}
  </div>
</div>

{#if tipVisible}
  <div class="chip-popover" style="left: {tipLeft}px; top: {tipTop}px" role="tooltip">
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

<style>
  .chip-popover {
    position: fixed;
    z-index: 4000;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
    max-width: 260px;
    padding: 0.4rem 0.55rem;
    border: 1px solid #c8c8c8;
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    color: #111;
    font-size: 13px;
    line-height: 1.3;
    pointer-events: none;
  }

  .chip-popover-title {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .chip-popover-body {
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    color: #444;
    white-space: normal;
  }
</style>
