<script lang="ts">
  import { keymap } from '../lib/state/keymapStore';

  let errorMessage = '';

  function handleFiles(files: FileList | null) {
    errorMessage = '';
    if (!files?.length) {
      return;
    }

    const file = files[0];
    const lower = file.name.toLowerCase();
    const selected = $keymap.selectedProgram;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text !== 'string') {
        return;
      }
      if (lower.endsWith('.inputrc') || lower === 'inputrc') {
        keymap.getState().loadFromBash(text);
        return;
      }
      if (lower.endsWith('.vim') || lower.endsWith('.vimrc') || lower === 'vimrc') {
        keymap.getState().loadFromVimrc(text);
        return;
      }
      if (lower.endsWith('.json')) {
        if (
          selected === 'vim' ||
          (text.includes('"bindings"') && text.includes('"vim-'))
        ) {
          keymap.getState().loadFromVim(text);
          return;
        }
        keymap.getState().loadFromVsCode(text);
        return;
      }
      if (lower.endsWith('.xml')) {
        keymap.getState().loadFromXml(text);
        return;
      }
      if (selected === 'bash') {
        keymap.getState().loadFromBash(text);
        return;
      }
      if (selected === 'vim') {
        keymap.getState().loadFromVimrc(text);
        return;
      }
      errorMessage =
        'Поддерживаются .xml (PyCharm), .json (VS Code/Vim), .inputrc (Bash) и .vim (map).';
    };

    if (
      lower.endsWith('.json') ||
      lower.endsWith('.xml') ||
      lower.endsWith('.inputrc') ||
      lower === 'inputrc' ||
      lower.endsWith('.vim') ||
      lower.endsWith('.vimrc') ||
      lower === 'vimrc' ||
      selected === 'bash' ||
      selected === 'vim'
    ) {
      reader.readAsText(file);
    } else {
      errorMessage =
        'Поддерживаются .xml (PyCharm), .json (VS Code/Vim), .inputrc (Bash) и .vim (map).';
    }
  }

  function onInputChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    handleFiles(input.files);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    handleFiles(event.dataTransfer?.files ?? null);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
  }
</script>

<section class="file-drop no-print" on:drop={onDrop} on:dragover={onDragOver}>
  <span class="privacy-note">
    Локально в браузере · перетащите .xml / .json / .inputrc / .vim или
  </span>
  <input
    id="fileselect"
    type="file"
    accept=".xml,.json,.inputrc,.vim,.vimrc,text/xml,application/json,text/plain"
    on:change={onInputChange}
  />
  {#if errorMessage}
    <span class="error">{errorMessage}</span>
  {/if}
</section>

<style>
  .file-drop {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: 1 1 auto;
  }

  .privacy-note {
    font-size: 12px;
    color: #2f6b2f;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .error {
    color: #b00020;
    font-size: 12px;
    white-space: nowrap;
  }

  input[type='file'] {
    font-size: 12px;
    max-width: 14rem;
    flex-shrink: 1;
    min-width: 0;
  }
</style>
