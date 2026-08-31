<script lang="ts">
  import type { CommandRef } from '../lib/types/keymap';
  import { assetUrl } from '../lib/assets';
  import { keymap } from '../lib/state/keymapStore';

  export let command: CommandRef;
  export let draggable = true;
  export let preview = false;
  export let sourceKey = '';
  export let sourceSlot = '';

  let tipVisible = false;
  let tipLeft = 0;
  let tipTop = 0;

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
    if (tipTop > window.innerHeight - 72) {
      tipTop = Math.max(8, rect.top - 40);
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
    {#if command.icon}
      <img class="icons" src={assetUrl(command.icon)} alt="" />
    {/if}
    <span class="chip-popover-title">{command.shortName}</span>
  </div>
{/if}

<style>
  .chip-popover {
    position: fixed;
    z-index: 4000;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    max-width: 240px;
    padding: 0.35rem 0.5rem;
    border: 1px solid #c8c8c8;
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    color: #111;
    font-size: 13px;
    line-height: 1.25;
    white-space: nowrap;
    pointer-events: none;
  }
</style>
