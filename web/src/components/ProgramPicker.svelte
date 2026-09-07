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
  <div class="program-list" role="group" aria-label="Список программ">
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
        <span class="program-title">
          {program.title}
          {#if !program.supported}
            <span class="soon">скоро</span>
          {/if}
        </span>
      </button>
    {/each}
  </div>
</section>

<style>
  .program-panel {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0;
    padding: 0.45rem 0.75rem;
    border: 1px solid #44d450;
    border-radius: 6px;
    background: #efffed;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .program-list {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0.5rem;
    min-width: 0;
    flex: 1 1 auto;
    overflow-x: auto;
  }

  .program-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.2rem 0.45rem;
    cursor: pointer;
    flex-shrink: 0;
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
    white-space: nowrap;
  }

  .soon {
    margin-left: 0.2rem;
    font-size: 9px;
    color: #888;
    font-style: italic;
  }
</style>
