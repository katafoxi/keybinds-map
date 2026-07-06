<script lang="ts">
  import type { CommandRef } from '../lib/types/keymap';
  import { assetUrl } from '../lib/assets';

  export let command: CommandRef;
  export let draggable = true;
  export let sourceKey = '';
  export let sourceSlot = '';

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
  }
</script>

<div
  class="command_description"
  class:locked-binding={!draggable}
  {draggable}
  on:dragstart={handleDragStart}
  role="listitem"
>
  <div class="descr">
    {#if command.icon}
      <img class="icons" src={assetUrl(command.icon)} alt="" />
    {/if}
    {command.shortName}
  </div>
</div>
