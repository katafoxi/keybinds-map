<script lang="ts">
  import { UI_LOCALES, type UiLocale } from '../lib/types/keymap';
  import { uiLocale } from '../lib/i18n/locale';

  const labels: Record<UiLocale, string> = {
    ru: 'RU',
    en: 'EN',
  };
</script>

<div class="locale-switch no-print" role="group" aria-label="Язык пояснений">
  {#each UI_LOCALES as locale}
    <button
      type="button"
      class:selected={$uiLocale === locale}
      on:click={() => uiLocale.set(locale)}
    >
      {labels[locale]}
    </button>
  {/each}
</div>

<style>
  .locale-switch {
    display: inline-flex;
    gap: 0;
    flex-shrink: 0;
  }

  .locale-switch button {
    font-size: 11px;
    padding: 0.3rem 0.45rem;
    cursor: pointer;
    border: 1px solid #ccc;
    background: #fff;
  }

  .locale-switch button:first-child {
    border-radius: 4px 0 0 4px;
  }

  .locale-switch button:last-child {
    border-radius: 0 4px 4px 0;
    margin-left: -1px;
  }

  .locale-switch button.selected {
    border-color: #14a421;
    background: #efffed;
    font-weight: 600;
  }
</style>
