<script lang="ts">
  import type { CommandRef } from '../lib/types/keymap';
  import { MODIFIER_SLOTS, type ModifierSlot } from '../lib/types/keymap';
  import CommandChip from './CommandChip.svelte';
  import { keymap } from '../lib/state/keymapStore';

  export let backName: string;
  export let frontName: string;
  export let bindings: Partial<Record<ModifierSlot, CommandRef>> = {};

  const slotLabels: Record<ModifierSlot, string> = {
    push: '',
    a: 'a',
    c: 'c',
    s: 's',
    ac: 'ca',
    as: 'as',
    cs: 'cs',
    acs: 'cas',
  };

  const slotClass: Record<ModifierSlot, string> = {
    push: 'Simple-push',
    a: 'a',
    c: 'c',
    s: 's',
    ac: 'ac',
    as: 'as',
    cs: 'cs',
    acs: 'acs',
  };

  function handleDrop(event: DragEvent, slot: ModifierSlot) {
    event.preventDefault();
    const payload = readPayload(event);
    if (!payload) {
      return;
    }

    if (payload.sourceKey && payload.sourceSlot) {
      keymap.getState().moveCommand(
        payload.sourceKey,
        payload.sourceSlot as ModifierSlot,
        backName,
        slot,
      );
      return;
    }

    keymap.getState().assignFromPool(payload.command, backName, slot);
  }

  function readPayload(event: DragEvent) {
    const raw = event.dataTransfer?.getData('application/json');
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as {
        command: CommandRef;
        sourceKey?: string;
        sourceSlot?: string;
      };
    } catch {
      return null;
    }
  }

  function allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  function hiddenStyle(slot: ModifierSlot): string {
    return $keymap.modifierVisibility[slot] ? '' : 'display:none';
  }
</script>

<div class="char key_{backName}">
  <div class="key brdr">{frontName}</div>

  {#each MODIFIER_SLOTS as slot}
    {#if slot !== 'push'}
      <div class="{slot}_mod brdr abbr" style={hiddenStyle(slot)}>{slotLabels[slot]}</div>
    {/if}
  {/each}

  {#each MODIFIER_SLOTS as slot}
    <div
      class="{slotClass[slot]} brdr droppable"
      style={hiddenStyle(slot)}
      role="button"
      tabindex="0"
      on:dragover={allowDrop}
      on:drop={(event) => handleDrop(event, slot)}
    >
      {#if bindings[slot]}
        <CommandChip
          command={bindings[slot]}
          sourceKey={backName}
          sourceSlot={slot}
        />
      {/if}
    </div>
  {/each}
</div>
