<script lang="ts">
  import { keymap } from '../lib/state/keymapStore';
  import { pickLocalized, uiLocale } from '../lib/i18n/locale';

  $: recipes = ($keymap.vimRecipes ?? []).filter((recipe) => {
    const sectors = $keymap.activeSectors;
    if (!sectors.length) {
      return true;
    }
    return recipe.sector ? sectors.includes(recipe.sector) : true;
  });

  function play(id: string) {
    keymap.getState().playVimRecipe(id);
  }
</script>

{#if $keymap.selectedProgram === 'vim'}
  <section class="recipe-panel no-print" aria-label="Типовые последовательности Vim">
    <h3>Рецепты</h3>
    <ul>
      {#each recipes as recipe (recipe.id)}
        <li class:active={$keymap.vimRecipeActiveId === recipe.id}>
          <button type="button" on:click={() => play(recipe.id)}>
            <strong>{recipe.title}</strong>
            {#if pickLocalized(recipe.descriptions, $uiLocale)}
              <span>{pickLocalized(recipe.descriptions, $uiLocale)}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .recipe-panel {
    margin: 0.5rem 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e7c8a8;
    border-radius: 6px;
    background: #fffdf8;
    max-height: 180px;
    overflow: auto;
  }

  h3 {
    margin: 0 0 0.35rem;
    font-size: 12px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  li button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    font-size: 11px;
    padding: 0.3rem 0.5rem;
    cursor: pointer;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    text-align: left;
    max-width: 14rem;
  }

  li.active button {
    border-color: #2f6b2f;
    background: #efffed;
  }

  li button span {
    color: #666;
    font-size: 10px;
  }
</style>
