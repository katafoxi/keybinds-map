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

  onMount(async () => {
    const response = await fetch(assetUrl('programs.json'));
    catalog = (await response.json()) as ProgramCatalog;
    keymap.getState().setCatalog(catalog);
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
    <section class="guide no-print">
      <div>
        <p>
          Сайт предназначен для составления расположений команд приложения на клавиатуре с последующей установкой
          в выбранную программу.
        </p>
        <p>
          Перетаскивайте команды по сетке клавиатуры. Все файлы обрабатываются только в вашем браузере.
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
        <span class="dirty-flag">Есть несохранённые изменения</span>
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
</style>
