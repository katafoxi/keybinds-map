<script lang="ts">
  import type { ModifierSlot } from '../lib/types/keymap';
  import { keymap } from '../lib/state/keymapStore';

  const TOGGLEABLE_SLOTS: ModifierSlot[] = ['push', 's', 'ac', 'as', 'cs', 'acs'];

  const modLabels: Record<string, string> = {
    a_mod: '+Alt',
    c_mod: '+Ctrl',
    s_mod: '+Shift',
    ac_mod: '+Ctrl+Alt',
    as_mod: '+Alt+Shift',
    cs_mod: '+Ctrl+Shift',
    acs_mod: '+Ctrl+Alt+Shift',
  };

  function onToggle(slot: ModifierSlot, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    keymap.getState().toggleModifier(slot, input.checked);
  }
</script>

<div class="modifier-legend-panel no-print" aria-label="Настройте отображаемые модификаторы">
  <span class="legend-caption">Настройте отображаемые модификаторы</span>
  <div class="subtableSheme">
    <div class="key Cell">key</div>
    <div class="a_mod Cell abbr">{modLabels.a_mod}</div>
    <div class="c_mod Cell abbr">{modLabels.c_mod}</div>
    <div class="s_mod Cell abbr">{modLabels.s_mod}</div>
    <div class="ac_mod Cell abbr">{modLabels.ac_mod}</div>
    <div class="as_mod Cell abbr">{modLabels.as_mod}</div>
    <div class="cs_mod Cell abbr">{modLabels.cs_mod}</div>
    <div class="acs_mod Cell abbr">{modLabels.acs_mod}</div>

    <div class="Simple-push Cell schemeSwitchCell">
      <div class="flipswitch">
        <input
          type="checkbox"
          class="flipswitch-cb"
          id="mod-toggle-push"
          checked={$keymap.modifierVisibility.push}
          on:change={(event) => onToggle('push', event)}
        />
        <label class="flipswitch-label" for="mod-toggle-push">
          <div class="flipswitch-inner"></div>
          <div class="flipswitch-switch"></div>
        </label>
      </div>
    </div>
    <div class="a Cell"></div>
    <div class="c Cell"></div>
  {#each TOGGLEABLE_SLOTS.filter((slot) => slot !== 'push') as slot}
    <div class="{slot} Cell schemeSwitchCell">
      <div class="flipswitch">
        <input
          type="checkbox"
          class="flipswitch-cb"
          id="mod-toggle-{slot}"
          checked={$keymap.modifierVisibility[slot]}
          on:change={(event) => onToggle(slot, event)}
        />
        <label class="flipswitch-label" for="mod-toggle-{slot}">
          <div class="flipswitch-inner"></div>
          <div class="flipswitch-switch"></div>
        </label>
      </div>
    </div>
  {/each}
  </div>
</div>

<style>
  .modifier-legend-panel {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #a65400;
    transform: skew(-8deg);
    border-radius: 5px;
    padding: 3px 6px;
    background-color: #efffed;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }

  .legend-caption {
    width: 75px;
    font-size: 10px;
    line-height: 1.2;
    flex-shrink: 0;
  }

  .schemeSwitchCell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 12px;
  }
</style>
