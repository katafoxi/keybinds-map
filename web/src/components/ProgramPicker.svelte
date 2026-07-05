<script lang="ts">
  import type { ProgramInfo } from '../lib/types/keymap';
  import { assetUrl } from '../lib/assets';
  import { keymap } from '../lib/state/keymapStore';

  export let programs: ProgramInfo[] = [];
  export let disabled = false;

  async function selectProgram(slug: string, supported: boolean) {
    if (!supported || disabled) {
      return;
    }
    await keymap.getState().selectProgram(slug);
  }
</script>

<section class="program-panel no-print" aria-label="Выбор программы">
  <p class="step-label"><span class="underline">Шаг 1</span> Выберите программу:</p>
  <div class="program-list">
    {#each programs as program (program.slug)}
      <button
        type="button"
        class="program-button"
        class:selected={$keymap.selectedProgram === program.slug}
        disabled={!program.supported || disabled}
        title={program.supported ? program.title : `${program.title} — скоро`}
        on:click={() => selectProgram(program.slug, program.supported)}
      >
        <img class="progIcon" src={assetUrl(program.icon)} alt={program.title} />
        <span class="program-title">{program.title}</span>
        {#if !program.supported}
          <span class="soon">скоро</span>
        {/if}
      </button>
    {/each}
  </div>
</section>

<style>
  .program-panel {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem 1rem;
    margin: 0.75rem 0;
    padding: 0.65rem 0.85rem;
    border: 1px solid #44d450;
    border-radius: 6px;
    background: #efffed;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .step-label {
    margin: 0;
    font-size: 13px;
    color: #a65400;
    white-space: nowrap;
  }

  .underline {
    text-decoration: underline;
  }

  .program-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .program-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    position: relative;
  }

  .program-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    background: #f5f5f5;
  }

  .program-button.selected {
    border-color: #14a421;
    box-shadow: 0 0 0 2px rgba(20, 164, 33, 0.25);
  }

  .progIcon {
    height: 24px;
    width: auto;
    display: block;
  }

  .program-title {
    font-size: 12px;
    color: #333;
  }

  .soon {
    position: absolute;
    bottom: -0.55rem;
    left: 0.35rem;
    font-size: 8px;
    color: #666;
  }
</style>
