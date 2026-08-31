<script lang="ts">
  import type { CommandRef } from '../lib/types/keymap';
  import CommandChip from './CommandChip.svelte';
  import { keymap } from '../lib/state/keymapStore';
  import { clearSlotPreview } from '../lib/drag/slotPreview';

  export let commands: CommandRef[] = [];

  $: visibleCommands = commands.filter((command) => {
    if ($keymap.selectedProgram !== 'vim') {
      return true;
    }
    const sectors = $keymap.activeSectors ?? [];
    if (!sectors.length) {
      return true;
    }
    return command.sector ? sectors.includes(command.sector) : false;
  });

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    clearSlotPreview();
    const raw = event.dataTransfer?.getData('application/json');
    if (!raw) {
      return;
    }
    try {
      const payload = JSON.parse(raw) as {
        sourceKey?: string;
        sourceSlot?: string;
      };
      if (payload.sourceKey && payload.sourceSlot) {
        keymap.getState().moveToPool(payload.sourceKey, payload.sourceSlot);
      }
    } catch {
      // ignore invalid payload
    }
    keymap.getState().clearDrag();
  }

  function allowDrop(event: DragEvent) {
    event.preventDefault();
    clearSlotPreview();
    keymap.getState().clearDragTarget();
  }
</script>

<div
  class="commandIcons droppable"
  on:dragover={allowDrop}
  on:drop={handleDrop}
  role="list"
  aria-label="Пул команд без комбинаций"
>
  {#each visibleCommands as command (command.id)}
    <CommandChip {command} sourceKey="" sourceSlot="" />
  {/each}
</div>
