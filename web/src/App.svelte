<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { ProgramCatalog } from './lib/types/keymap';
  import { assetUrl } from './lib/assets';
  import { keymap } from './lib/state/keymapStore';
  import { clearSlotPreview } from './lib/drag/slotPreview';
  import { uiLocale } from './lib/i18n/locale';
  import { bundledCatalog } from './lib/catalog/bundledPrograms';
  import ProgramPicker from './components/ProgramPicker.svelte';
  import FileDropZone from './components/FileDropZone.svelte';
  import CommandPool from './components/CommandPool.svelte';
  import KeyboardGrid from './components/KeyboardGrid.svelte';
  import ProfileSwitcher from './components/ProfileSwitcher.svelte';
  import LocaleSwitcher from './components/LocaleSwitcher.svelte';
  import ModifierLegend from './components/ModifierLegend.svelte';
  import VimModeSwitcher from './components/VimModeSwitcher.svelte';
  import SectorLegend from './components/SectorLegend.svelte';
  import RecipePanel from './components/RecipePanel.svelte';
  import ExCommandPanel from './components/ExCommandPanel.svelte';

  let catalog: ProgramCatalog = bundledCatalog;
  let ready = false;

  $: programs = catalog.programs;

  $: hasBindings = Object.keys($keymap?.bindings ?? {}).length > 0;
  $: showEmptyHint = ready && !hasBindings;
  $: showDirtyFlag =
    $keymap.dirty && $keymap.activeProfileId !== 'standard';

  onMount(async () => {
    uiLocale.start();
    let resolved: ProgramCatalog = bundledCatalog;
    try {
      const response = await fetch(assetUrl('programs.json'));
      if (response.ok) {
        const fetched = (await response.json()) as ProgramCatalog;
        if (fetched.commands?.pycharm?.length) {
          resolved = fetched;
          catalog = fetched;
        }
      }
    } catch {
      // bundled catalog
    }
    await keymap.getState().boot(resolved);
    ready = true;
  });

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if ($keymap.dirty && $keymap.activeProfileId !== 'standard') {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  onMount(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('dragend', handleDragEnd);
  });

  onDestroy(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('dragend', handleDragEnd);
  });

  function handleDragEnd() {
    clearSlotPreview();
    keymap.getState().endDrag();
  }

  function exportKeymap() {
    const program = $keymap.selectedProgram;
    if (program === 'bash') {
      keymap.getState().exportKeymap('inputrc');
      return;
    }
    if (program === 'vim') {
      keymap.getState().exportKeymap('keybinds.vim');
      return;
    }
    const filename = `${$keymap.metadata.name || 'keymap'}.xml`;
    keymap.getState().exportKeymap(filename);
  }

  function printKeymap() {
    window.print();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && $keymap.selectedProgram === 'vim') {
      keymap.getState().resetVimView();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="mainPage">
  <header class="header no-print">
    <div class="logo">
      <div class="top-head">
        <a href="/">онлайн редактор комбинаций</a>
      </div>
      <a href="/">
        <img id="logo" class="logo" src={assetUrl('i/logo.png')} title="Редактор комбинаций" alt="Редактор комбинаций" />
      </a>
    </div>

    <ProgramPicker programs={programs} disabled={!ready} />
    <ModifierLegend />
  </header>

  <main class="content">
    <div class="control-bar no-print">
      <FileDropZone />
      <div class="toolbar">
        <button type="button" on:click={() => keymap.getState().undo()} disabled={$keymap.historyPast.length === 0}>
          Undo
        </button>
        <button type="button" on:click={() => keymap.getState().redo()} disabled={$keymap.historyFuture.length === 0}>
          Redo
        </button>
        <button type="button" on:click={exportKeymap}>
          {#if $keymap.selectedProgram === 'bash'}
            Скачать inputrc
          {:else if $keymap.selectedProgram === 'vim'}
            Скачать vimrc
          {:else}
            Скачать XML
          {/if}
        </button>
        <button type="button" on:click={printKeymap}>Печать</button>
        <ProfileSwitcher />
        <LocaleSwitcher />
        {#if showDirtyFlag}
          <span class="dirty-flag">Несохранённые изменения</span>
        {/if}
      </div>
    </div>

    <section class="guide no-print">
      <p>Редактор keymap · файлы обрабатываются только в браузере.</p>
    </section>

    <VimModeSwitcher />
    <SectorLegend />

    {#if showEmptyHint}
      <section class="empty-hint no-print">
        <strong>Шаг 2:</strong> загрузите .xml (PyCharm), .json (VS Code / Vim), .inputrc (Bash) или .vim (map dump), либо «Скопировать профиль» для редактирования стандартной раскладки.
      </section>
    {/if}

    {#if ($keymap?.importWarnings ?? []).length > 0}
      <section class="import-warnings no-print">
        <h3>Примечания при импорте</h3>
        <ul>
          {#each $keymap.importWarnings as warning}
            <li>{warning}</li>
          {/each}
        </ul>
      </section>
    {/if}

    <RecipePanel />
    <ExCommandPanel />
    <CommandPool commands={$keymap.unassigned} />
    <KeyboardGrid />
  </main>
</div>

<style>
  .control-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin: 0.5rem 0;
    min-width: 0;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
    min-width: 0;
  }

  .toolbar button {
    font-size: 12px;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .toolbar button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dirty-flag {
    color: #a65400;
    font-size: 11px;
    flex-shrink: 0;
  }

  .guide p {
    margin: 0 0 0.35rem;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty-hint {
    padding: 0.45rem 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    font-size: 12px;
    background: #fff8e6;
    border: 1px solid #fdc073;
  }

  .import-warnings {
    background: #fff3f3;
    border: 1px solid #e0a0a0;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 12px;
  }

  .import-warnings h3 {
    margin: 0 0 0.35rem;
    font-size: 12px;
  }

  .import-warnings ul {
    margin: 0;
    padding-left: 1.2rem;
  }
</style>
