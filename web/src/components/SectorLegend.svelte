<script lang="ts">
  import { VIM_SECTORS, type VimSector } from '../lib/types/keymap';
  import { keymap } from '../lib/state/keymapStore';

  const LABELS: Record<VimSector, string> = {
    motion: 'Перемещение',
    delete: 'Удаление',
    edit: 'Редактирование',
    file: 'Файлы',
    marks: 'Закладки',
    search: 'Поиск',
    windows: 'Окна',
  };

  function onToggle(sector: VimSector, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const state = keymap.getState();
    const current = new Set(state.activeSectors);
    if (input.checked) {
      current.add(sector);
    } else {
      current.delete(sector);
    }
    // empty = show all; when user checks one, filter to checked only
    state.setActiveSectors([...current]);
  }

  function clearAll() {
    keymap.getState().setActiveSectors([]);
  }

  $: filtering = $keymap.activeSectors.length > 0;
</script>

{#if $keymap.selectedProgram === 'vim'}
  <div class="sector-legend no-print" aria-label="Секторы Vim">
    <span class="caption">Секторы</span>
    {#each VIM_SECTORS as sector}
      <label class="sector-chip sector-{sector}">
        <input
          type="checkbox"
          checked={$keymap.activeSectors.includes(sector)}
          on:change={(event) => onToggle(sector, event)}
        />
        {LABELS[sector]}
      </label>
    {/each}
    {#if filtering}
      <button type="button" class="clear" on:click={clearAll}>Все</button>
    {/if}
    <span class="hint">Цифра = повтор · f/t + символ</span>
  </div>
{/if}

<style>
  .sector-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    margin: 0.35rem 0 0.5rem;
    font-size: 11px;
  }

  .caption {
    font-weight: 600;
    color: #a65400;
    margin-right: 0.25rem;
  }

  .sector-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    border: 1px solid #ddd;
    cursor: pointer;
    user-select: none;
  }

  .sector-chip input {
    margin: 0;
  }

  .sector-motion { background: #e8f4ff; border-color: #9ec5e8; }
  .sector-delete { background: #ffe8e8; border-color: #e89e9e; }
  .sector-edit { background: #fff6e0; border-color: #e8c89e; }
  .sector-file { background: #e8ffe8; border-color: #9ee89e; }
  .sector-marks { background: #f3e8ff; border-color: #c09ee8; }
  .sector-search { background: #e8ffff; border-color: #9ee8e8; }
  .sector-windows { background: #ffe8f6; border-color: #e89ec8; }

  .clear {
    font-size: 11px;
    padding: 0.15rem 0.4rem;
    cursor: pointer;
  }

  .hint {
    color: #888;
    margin-left: 0.5rem;
  }
</style>
