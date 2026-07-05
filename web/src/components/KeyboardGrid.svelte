<script lang="ts">
  import { mergeKeyboardWithBindings } from '../lib/keyboard/layout';
  import type { ModifierSlot, PrintLayerMode } from '../lib/types/keymap';
  import { MODIFIER_SLOTS } from '../lib/types/keymap';
  import { keymap } from '../lib/state/keymapStore';
  import KeyCell from './KeyCell.svelte';

  $: keys = mergeKeyboardWithBindings($keymap?.bindings ?? {});

  function onModifierToggle(slot: string, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    keymap.getState().toggleModifier(slot, input.checked);
  }

  function slotVisible(slot: ModifierSlot): boolean {
    if ($keymap.printLayerMode === 'all') {
      return true;
    }
    if ($keymap.printLayerMode === 'push') {
      return slot === 'push';
    }
    return $keymap.modifierVisibility[slot];
  }

  function setPrintMode(mode: PrintLayerMode) {
    keymap.getState().setPrintLayerMode(mode);
  }
</script>

<div class="print-header print-only">
  <h1>Keymap: {$keymap.metadata.name}</h1>
  <p>{new Date().toLocaleDateString('ru-RU')}</p>
</div>

<div id="keyboardGrid" class="keyboardGrid print-layer-{$keymap.printLayerMode}">
  {#each keys as key (key.backName)}
    <KeyCell
      backName={key.backName}
      frontName={key.frontName}
      bindings={key.bindings}
      {slotVisible}
    />
  {/each}
</div>

<section class="modifier-controls no-print">
  <h3>Слои модификаторов</h3>
  <div class="modifier-toggles">
    {#each Object.entries($keymap.modifierVisibility) as [slot, visible]}
      <label class="flipswitch">
        <input
          type="checkbox"
          checked={visible}
          on:change={(event) => onModifierToggle(slot, event)}
        />
        <span>{slot}</span>
      </label>
    {/each}
  </div>

  <h3>Печать</h3>
  <div class="print-mode">
    <label><input type="radio" name="printMode" checked={$keymap.printLayerMode === 'visible'} on:change={() => setPrintMode('visible')} /> Видимые слои</label>
    <label><input type="radio" name="printMode" checked={$keymap.printLayerMode === 'push'} on:change={() => setPrintMode('push')} /> Только push</label>
    <label><input type="radio" name="printMode" checked={$keymap.printLayerMode === 'all'} on:change={() => setPrintMode('all')} /> Все слои</label>
  </div>
</section>

<style>
  .modifier-controls {
    margin-top: 1rem;
  }

  .modifier-toggles,
  .print-mode {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .flipswitch,
  .print-mode label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 12px;
  }

  .print-only {
    display: none;
  }

  @media print {
    .print-only {
      display: block;
      margin-bottom: 0.5rem;
    }

    .print-only h1 {
      font-size: 14px;
      margin: 0 0 0.25rem;
    }

    .print-only p {
      margin: 0;
      font-size: 10px;
      color: #666;
    }
  }
</style>
