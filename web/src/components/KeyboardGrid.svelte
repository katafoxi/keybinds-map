<script lang="ts">
  import { mergeKeyboardWithBindings } from '../lib/keyboard/layout';
  import { keymap } from '../lib/state/keymapStore';
  import KeyCell from './KeyCell.svelte';

  $: keys = mergeKeyboardWithBindings($keymap.bindings);
  function onModifierToggle(slot: string, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    keymap.getState().toggleModifier(slot, input.checked);
  }
</script>

<div id="keyboardGrid" class="keyboardGrid">
  {#each keys as key (key.backName)}
    <KeyCell
      backName={key.backName}
      frontName={key.frontName}
      bindings={key.bindings}
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
</section>

<style>
  .modifier-controls {
    margin-top: 1rem;
  }

  .modifier-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .flipswitch {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 12px;
  }
</style>
