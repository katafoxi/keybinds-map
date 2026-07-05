<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { ProgramCatalog } from './lib/types/keymap';
  import { assetUrl } from './lib/assets';
  import { keymap } from './lib/state/keymapStore';
  import { bundledCatalog } from './lib/catalog/bundledPrograms';
  import ProgramPicker from './components/ProgramPicker.svelte';
  import FileDropZone from './components/FileDropZone.svelte';
  import CommandPool from './components/CommandPool.svelte';
  import KeyboardGrid from './components/KeyboardGrid.svelte';
  import ProfileSwitcher from './components/ProfileSwitcher.svelte';

  let catalog: ProgramCatalog = bundledCatalog;
  let ready = false;

  $: programs = catalog.programs;

  $: hasBindings = Object.keys($keymap?.bindings ?? {}).length > 0;
  $: showEmptyHint = ready && !hasBindings;
  $: showDirtyFlag =
    $keymap.dirty && $keymap.activeProfileId !== 'standard';

  onMount(async () => {
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
  });

  onDestroy(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  function exportXml() {
    const filename = `${$keymap.metadata.name || 'keymap'}.xml`;
    keymap.getState().exportXml(filename);
  }

  function printKeymap() {
    window.print();
  }
</script>

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

    <div class="header_block menu-block">
      <ul class="mainmenu">
        <li><a href="/">Главная</a></li>
      </ul>
    </div>
  </header>

  <main class="content">
    <section class="guide no-print">
      <p>
        Редактор для визуализации и правки keymap. Все файлы обрабатываются только в вашем браузере.
      </p>
    </section>

    <ProgramPicker programs={programs} disabled={!ready} />

    {#if showEmptyHint}
      <section class="empty-hint no-print">
        <strong>Шаг 2:</strong> загрузите .xml keymap (PyCharm) или .json (VS Code), либо нажмите «Скопировать профиль» для редактирования на базе стандартной раскладки.
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

    <FileDropZone />

    <div class="toolbar no-print">
      <button type="button" on:click={() => keymap.getState().undo()} disabled={$keymap.historyPast.length === 0}>
        Undo
      </button>
      <button type="button" on:click={() => keymap.getState().redo()} disabled={$keymap.historyFuture.length === 0}>
        Redo
      </button>
      <button type="button" on:click={exportXml}>Скачать XML</button>
      <button type="button" on:click={printKeymap}>Печать</button>
      <ProfileSwitcher />
      {#if showDirtyFlag}
        <span class="dirty-flag">Есть несохранённые изменения (автосохранение в Custom-слот)</span>
      {/if}
    </div>

    <CommandPool commands={$keymap.unassigned} />
    <KeyboardGrid />
  </main>
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin: 0.75rem 0;
  }

  .toolbar button {
    font-size: 12px;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
  }

  .toolbar button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dirty-flag {
    color: #a65400;
    font-size: 12px;
  }

  .guide p {
    margin: 0 0 0.5rem;
    font-size: 13px;
  }

  .empty-hint {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    font-size: 13px;
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
