<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { ProgramCatalog } from './lib/types/keymap';
  import { assetUrl } from './lib/assets';
  import { keymap } from './lib/state/keymapStore';
  import ProgramPicker from './components/ProgramPicker.svelte';
  import FileDropZone from './components/FileDropZone.svelte';
  import CommandPool from './components/CommandPool.svelte';
  import KeyboardGrid from './components/KeyboardGrid.svelte';
  import ProfileManager from './components/ProfileManager.svelte';

  let catalog: ProgramCatalog | null = null;
  let draftRestored = false;

  $: hasBindings = Object.keys($keymap.bindings).length > 0;
  $: showEmptyHint = !hasBindings && !draftRestored;

  onMount(async () => {
    const response = await fetch(assetUrl('programs.json'));
    catalog = (await response.json()) as ProgramCatalog;
    keymap.getState().setCatalog(catalog);
    draftRestored = await keymap.getState().restoreDraft();
  });

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if ($keymap.dirty) {
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

    <div class="header_block">
      <ul class="mainmenu">
        <li><a href="/">Главная</a></li>
      </ul>
    </div>

    {#if catalog}
      <ProgramPicker programs={catalog.programs} />
    {/if}
  </header>

  <main class="content">
    {#if showEmptyHint}
      <section class="empty-hint no-print">
        <strong>Шаг 2:</strong> загрузите .xml keymap (PyCharm) или .json (VS Code), чтобы увидеть команды на клавиатуре.
      </section>
    {/if}

    {#if draftRestored && $keymap.dirty}
      <section class="draft-banner no-print">
        Восстановлен автосохранённый черновик.
      </section>
    {/if}

    {#if $keymap.importWarnings.length > 0}
      <section class="import-warnings no-print">
        <h3>Примечания при импорте</h3>
        <ul>
          {#each $keymap.importWarnings as warning}
            <li>{warning}</li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="guide no-print">
      <div>
        <p>
          Редактор для визуализации и правки keymap. Все файлы обрабатываются только в вашем браузере.
        </p>
      </div>
    </section>

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
      {#if $keymap.dirty}
        <span class="dirty-flag">Есть несохранённые изменения (автосохранение в браузере)</span>
      {/if}
    </div>

    <CommandPool commands={$keymap.unassigned} />
    <KeyboardGrid />
    <ProfileManager />
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

  .empty-hint,
  .draft-banner {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    font-size: 13px;
  }

  .empty-hint {
    background: #fff8e6;
    border: 1px solid #fdc073;
  }

  .draft-banner {
    background: #efffed;
    border: 1px solid #14a421;
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
