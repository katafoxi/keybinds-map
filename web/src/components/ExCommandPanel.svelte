<script lang="ts">
  import { keymap } from '../lib/state/keymapStore';
  import { pickLocalized, uiLocale } from '../lib/i18n/locale';

  $: commands = ($keymap.vimExCommands ?? []).filter((command) => {
    const sectors = $keymap.activeSectors;
    if (!sectors.length) {
      return true;
    }
    return command.sector ? sectors.includes(command.sector) : true;
  });
</script>

{#if $keymap.selectedProgram === 'vim' && $keymap.vimMode === 'cmdline'}
  <aside class="ex-panel no-print" aria-label="Ex-команды">
    <h3>Ex</h3>
    <ul>
      {#each commands as command (command.id)}
        <li>
          <strong>{command.shortName}</strong>
          {#if pickLocalized(command.descriptions, $uiLocale)}
            <span>{pickLocalized(command.descriptions, $uiLocale)}</span>
          {/if}
        </li>
      {/each}
    </ul>
  </aside>
{/if}

<style>
  .ex-panel {
    margin: 0.5rem 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid #c8d8c8;
    border-radius: 6px;
    background: #f7fff7;
  }

  h3 {
    margin: 0 0 0.35rem;
    font-size: 12px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: 0.25rem;
  }

  li {
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.2rem 0.35rem;
    border-radius: 3px;
    background: #fff;
  }

  li span {
    color: #666;
    font-size: 10px;
  }
</style>
