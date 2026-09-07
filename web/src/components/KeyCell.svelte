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

  // Explicit reactive deps so slot chrome updates on program/mode change.
  $: program = $keymap.selectedProgram;
  $: catalog = $keymap.catalog;
  $: vimMode = program === 'vim' ? $keymap.vimMode : undefined;
  $: viewKind = $keymap.vimView?.kind ?? 'idle';
  $: highlightRoles = $keymap.vimHighlightRoles ?? [];

  $: slotUi = Object.fromEntries(
    MODIFIER_SLOTS.map((slot) => {
      const command = bindings[slot];
      const bounded = isBoundedSlot(catalog, program, backName, slot, vimMode);
      const locked = Boolean(command && isBindingLocked(program, backName, slot, command));
      const roles = command?.roles ?? [];
      const pendingTarget =
        program === 'vim' &&
        (viewKind === 'operator' || viewKind === 'textobject') &&
        Boolean(command) &&
        highlightRoles.some((role) => roles.includes(role as never));
      return [
        slot,
        {
          bounded,
          locked,
          pendingTarget,
          droppable: !bounded && !locked,
          draggable: canDragBinding(catalog, program, backName, slot, command),
        },
      ];
    }),
  ) as Record<
    ModifierSlot,
    {
      bounded: boolean;
      locked: boolean;
      pendingTarget: boolean;
      droppable: boolean;
      draggable: boolean;
    }
  >;

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
    return canDropOnSlot(catalog, program, backName, slot, bindings[slot], vimMode);
  }
</script>

<div class="char key_{backName}" data-program={program} data-vim-mode={vimMode ?? ''}>
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
      class="{slotClass[slot]} brdr"
      class:bounded-slot={slotUi[slot].bounded || slotUi[slot].locked}
      class:droppable={slotUi[slot].droppable}
      class:vim-pending-target={slotUi[slot].pendingTarget}
      class:layer-hidden={!isModifierSlotVisibleOnScreen(slot, $keymap.modifierVisibility)}
      data-slot={slot}
      data-bounded={slotUi[slot].bounded ? '1' : '0'}
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
          draggable={slotUi[slot].draggable}
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

  :global(.vim-pending-target) {
    outline: 2px dashed #c27a00;
    background: rgba(255, 200, 80, 0.2) !important;
  }
</style>
