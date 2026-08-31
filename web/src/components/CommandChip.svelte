<script lang="ts">
  import type { CommandRef } from '../lib/types/keymap';
  import { assetUrl } from '../lib/assets';
  import { keymap } from '../lib/state/keymapStore';

  export let command: CommandRef;
  export let draggable = true;
  export let preview = false;
  export let sourceKey = '';
  export let sourceSlot = '';

  $: isDragSource =
    !preview &&
    draggable &&
    $keymap.drag?.command.id === command.id &&
    ($keymap.drag?.sourceKey ?? '') === sourceKey &&
    ($keymap.drag?.sourceSlot ?? '') === sourceSlot;

  function handleDragStart(event: DragEvent) {
    if (!draggable || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
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
</script>

<div
  class="command_description"
  class:locked-binding={!draggable && !preview}
  class:drag-preview={preview}
  class:drag-source={isDragSource}
  draggable={draggable && !preview}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  role="listitem"
>
  <div class="descr">
    {#if command.icon}
      <img class="icons" src={assetUrl(command.icon)} alt="" />
    {/if}
    {command.shortName}
  </div>
</div>
