<script lang="ts">
  import { VIM_SECTORS, type VimRecipe, type VimSector } from '../lib/types/keymap';
  import { keymap } from '../lib/state/keymapStore';
  import { pickLocalized, uiLocale } from '../lib/i18n/locale';

  const SECTOR_LABELS: Record<VimSector, string> = {
    motion: 'Перемещение',
    delete: 'Удаление',
    edit: 'Редактирование',
    file: 'Файлы',
    marks: 'Закладки',
    search: 'Поиск',
    windows: 'Окна',
  };

  const SECTOR_ORDER: Array<VimSector | 'other'> = [...VIM_SECTORS, 'other'];

  $: filtered = ($keymap.vimRecipes ?? []).filter((recipe) => {
    const sectors = $keymap.activeSectors;
    if (!sectors.length) {
      return true;
    }
    return recipe.sector ? sectors.includes(recipe.sector) : true;
  });

  $: groups = SECTOR_ORDER.map((sector) => {
    const items =
      sector === 'other'
        ? filtered.filter((recipe) => !recipe.sector)
        : filtered.filter((recipe) => recipe.sector === sector);
    return { sector, items };
  }).filter((group) => group.items.length > 0);

  function select(recipe: VimRecipe) {
    keymap.getState().playVimRecipe(recipe.id);
  }

  function recipeKeys(title: string): string {
    const cut = title.split('—')[0]?.trim();
    return cut || title;
  }

  function recipeLabel(title: string): string {
    const parts = title.split('—');
    return (parts[1] ?? parts[0] ?? title).trim();
  }
</script>

{#if $keymap.selectedProgram === 'vim'}
  <section class="recipe-panel no-print" aria-label="Типовые последовательности Vim">
    <div class="recipe-head">
      <h3>Рецепты</h3>
      <span class="hint">клик — подсветить на клавиатуре · ещё раз — сбросить</span>
    </div>

    {#each groups as group (group.sector)}
      <div class="recipe-group sector-{group.sector}">
        <h4>
          {group.sector === 'other' ? 'Прочее' : SECTOR_LABELS[group.sector]}
        </h4>
        <ul>
          {#each group.items as recipe (recipe.id)}
            <li class:active={$keymap.vimRecipeActiveId === recipe.id}>
              <button type="button" on:click={() => select(recipe)} title={pickLocalized(recipe.descriptions, $uiLocale) ?? ''}>
                <code>{recipeKeys(recipe.title)}</code>
                <span class="label">{recipeLabel(recipe.title)}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </section>
{/if}

<style>
  .recipe-panel {
    margin: 0.5rem 0;
    padding: 0.55rem 0.75rem 0.65rem;
    border: 1px solid #e7c8a8;
    border-radius: 6px;
    background: #fffdf8;
    max-height: 220px;
    overflow: auto;
  }

  .recipe-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.45rem;
  }

  h3 {
    margin: 0;
    font-size: 12px;
  }

  .hint {
    font-size: 10px;
    color: #888;
  }

  .recipe-group {
    margin-bottom: 0.45rem;
  }

  .recipe-group:last-child {
    margin-bottom: 0;
  }

  h4 {
    margin: 0 0 0.25rem;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #666;
  }

  .sector-motion h4 { color: #3a6d9a; }
  .sector-delete h4 { color: #a04545; }
  .sector-edit h4 { color: #8a6a2a; }
  .sector-file h4 { color: #3a7a3a; }
  .sector-marks h4 { color: #6a4a9a; }
  .sector-search h4 { color: #2a7a7a; }
  .sector-windows h4 { color: #9a4a7a; }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  li button {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    font-size: 11px;
    padding: 0.22rem 0.45rem;
    cursor: pointer;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    text-align: left;
  }

  li button code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 600;
    color: #222;
  }

  li button .label {
    color: #666;
    font-size: 10px;
  }

  li.active button {
    border-color: #2f6b2f;
    background: #efffed;
  }

  .sector-motion li.active button { border-color: #3a6d9a; background: #e8f4ff; }
  .sector-delete li.active button { border-color: #a04545; background: #ffe8e8; }
  .sector-edit li.active button { border-color: #8a6a2a; background: #fff6e0; }
  .sector-file li.active button { border-color: #3a7a3a; background: #e8ffe8; }
  .sector-marks li.active button { border-color: #6a4a9a; background: #f3e8ff; }
  .sector-search li.active button { border-color: #2a7a7a; background: #e8ffff; }
  .sector-windows li.active button { border-color: #9a4a7a; background: #ffe8f6; }
</style>
