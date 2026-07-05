<script lang="ts">
  import type { ProgramInfo } from '../lib/types/keymap';
  import { assetUrl } from '../lib/assets';
  import { keymap } from '../lib/state/keymapStore';

  export let programs: ProgramInfo[] = [];

  function selectProgram(slug: string, supported: boolean) {
    if (!supported) {
      return;
    }
    keymap.getState().selectProgram(slug);
  }
</script>

<div class="header_block software_pool no-print">
  <p><span style="text-decoration: underline;">Шаг 1</span> Выберите программу:</p>
  {#each programs as program}
    <button
      type="button"
      class="program-button"
      class:selected={$keymap.selectedProgram === program.slug}
      disabled={!program.supported}
      title={program.supported ? program.title : `${program.title} — скоро`}
      on:click={() => selectProgram(program.slug, program.supported)}
    >
      <img class="progIcon" src={assetUrl(program.icon)} alt={program.title} />
      {#if !program.supported}
        <span class="soon">скоро</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .program-button {
    background: transparent;
    border: none;
    padding: 0;
    margin-right: 0.35rem;
    position: relative;
    cursor: pointer;
  }

  .program-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .program-button.selected .progIcon {
    border: 3px solid #14a421;
    border-radius: 3px;
  }

  .program-button .progIcon {
    height: 25px;
    width: auto;
    display: inline-block;
    vertical-align: middle;
  }

  .soon {
    position: absolute;
    bottom: -0.6rem;
    left: 0;
    font-size: 8px;
    color: #666;
  }
</style>
