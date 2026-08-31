<script lang="ts">
  import type { VimMode } from '../lib/types/keymap';
  import { keymap } from '../lib/state/keymapStore';
  import { vimViewBreadcrumb } from '../lib/vim/vimView';

  const MODES: { id: VimMode; label: string }[] = [
    { id: 'normal', label: 'Normal' },
    { id: 'insert', label: 'Insert' },
    { id: 'visual', label: 'Visual' },
    { id: 'cmdline', label: 'Cmdline' },
  ];

  $: modeLabel = MODES.find((mode) => mode.id === $keymap.vimMode)?.label ?? 'Normal';
  $: breadcrumb = vimViewBreadcrumb($keymap.vimView, modeLabel);

  function selectMode(mode: VimMode) {
    keymap.getState().setVimMode(mode);
  }
</script>

{#if $keymap.selectedProgram === 'vim'}
  <div class="vim-mode-switch no-print" role="group" aria-label="Режим Vim">
    {#each MODES as mode}
      <button
        type="button"
        class:active={$keymap.vimMode === mode.id}
        on:click={() => selectMode(mode.id)}
      >
        {mode.label}
      </button>
    {/each}
    <span class="vim-breadcrumb" title={breadcrumb}>{breadcrumb}</span>
    {#if $keymap.vimView.kind !== 'idle'}
      <button type="button" class="vim-reset" on:click={() => keymap.getState().resetVimView()}>
        Esc
      </button>
    {/if}
    {#if $keymap.vimFlash}
      <span class="vim-flash">{$keymap.vimFlash}</span>
    {/if}
  </div>
{/if}

<style>
  .vim-mode-switch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    margin: 0.35rem 0;
  }

  .vim-mode-switch button {
    font-size: 11px;
    padding: 0.25rem 0.55rem;
    cursor: pointer;
    border: 1px solid #c8d8c8;
    border-radius: 4px;
    background: #f7fff7;
  }

  .vim-mode-switch button.active {
    background: #2f6b2f;
    color: #fff;
    border-color: #2f6b2f;
  }

  .vim-breadcrumb {
    font-size: 11px;
    color: #a65400;
    margin-left: 0.5rem;
  }

  .vim-flash {
    font-size: 11px;
    font-weight: 600;
    color: #0b5;
    margin-left: 0.35rem;
  }

  .vim-reset {
    background: #fff3e0 !important;
  }
</style>
