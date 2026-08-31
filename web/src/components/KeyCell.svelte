<script lang="ts">
  import type { CommandRef } from '../lib/types/keymap';
  import { MODIFIER_SLOTS, type ModifierSlot } from '../lib/types/keymap';
  import CommandChip from './CommandChip.svelte';
  import { keymap } from '../lib/state/keymapStore';
  import {
    canDragBinding,
    canDropOnSlot,
    isBoundedSlot,
    isBindingLocked,
  } from '../lib/keyboard/bindingPolicy';
  import { isModifierSlotVisibleOnScreen } from '../lib/keyboard/modifierVisibility';
  import { clearSlotPreview, showSlotPreview } from '../lib/drag/slotPreview';

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
    clearSlotPreview();
    if (!slotAcceptsDrop(slot)) {
      return;
    }
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
    keymap.getState().clearDrag();
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

  function allowDrop(event: DragEvent, slot: ModifierSlot) {
    if (!slotAcceptsDrop(slot)) {
      return;
    }
    const drag = keymap.getState().drag;
    if (drag?.sourceKey === backName && drag?.sourceSlot === slot) {
      event.preventDefault();
      keymap.getState().clearDragTarget();
      clearSlotPreview();
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    keymap.getState().setDragTarget(backName, slot);
    if (drag) {
      showSlotPreview(event.currentTarget as HTMLElement, drag.command);
    }
  }

  function slotAcceptsDrop(slot: ModifierSlot): boolean {
    const state = $keymap;
    return canDropOnSlot(
      state.catalog,
      state.selectedProgram,
      backName,
      slot,
      bindings[slot],
    );
  }

  function slotClassNames(slot: ModifierSlot): string {
    const state = $keymap;
    const classes = [slotClass[slot], 'brdr'];
    const command = bindings[slot];
    const bounded = isBoundedSlot(state.catalog, state.selectedProgram, backName, slot);
    const locked = command && isBindingLocked(state.selectedProgram, backName, slot, command);

    if (bounded || locked) {
      classes.push('bounded-slot');
    } else {
      classes.push('droppable');
    }
    return classes.join(' ');
  }

  function chipDraggable(slot: ModifierSlot): boolean {
    const state = $keymap;
    const command = bindings[slot];
    return canDragBinding(state.catalog, state.selectedProgram, backName, slot, command);
  }
</script>

<div class="char key_{backName}">
  <div class="key brdr">{frontName}</div>

  {#each MODIFIER_SLOTS as slot}
    {#if slot !== 'push'}
      <div
        class="{slot}_mod brdr abbr"
        class:layer-hidden={!isModifierSlotVisibleOnScreen(slot, $keymap.modifierVisibility)}
      >
        {slotLabels[slot]}
      </div>
    {/if}
  {/each}

  {#each MODIFIER_SLOTS as slot}
    <div
      class={slotClassNames(slot)}
      class:layer-hidden={!isModifierSlotVisibleOnScreen(slot, $keymap.modifierVisibility)}
      role="button"
      tabindex="0"
      on:dragover={(event) => allowDrop(event, slot)}
      on:drop={(event) => handleDrop(event, slot)}
    >
      {#if bindings[slot]}
        <CommandChip
          command={bindings[slot]}
          sourceKey={backName}
          sourceSlot={slot}
          draggable={chipDraggable(slot)}
        />
      {/if}
    </div>
  {/each}
</div>

<style>
  :global(.drop-target) {
    outline: 2px solid #14a421;
    background: rgba(20, 164, 33, 0.15) !important;
  }
</style>
