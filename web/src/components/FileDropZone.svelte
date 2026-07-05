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

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text !== 'string') {
        return;
      }
      if (lower.endsWith('.json')) {
        keymap.getState().loadFromVsCode(text);
        return;
      }
      if (lower.endsWith('.xml')) {
        keymap.getState().loadFromXml(text);
        return;
      }
      errorMessage = 'Поддерживаются .xml (PyCharm) и .json (VS Code).';
    };

    if (lower.endsWith('.json') || lower.endsWith('.xml')) {
      reader.readAsText(file);
    } else {
      errorMessage = 'Поддерживаются .xml (PyCharm) и .json (VS Code).';
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

<section class="file-drop no-print">
  <p class="privacy-note">
    Файлы обрабатываются локально в браузере и не отправляются на сервер.
  </p>
  <div
    id="filedrag"
    class="filedrag"
    role="button"
    tabindex="0"
    on:drop={onDrop}
    on:dragover={onDragOver}
  >
    Перетащите keymap (.xml PyCharm или .json VS Code) или выберите файл
  </div>
  <input
    id="fileselect"
    type="file"
    accept=".xml,.json,text/xml,application/json"
    on:change={onInputChange}
  />
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
</section>

<style>
  .privacy-note {
    font-size: 12px;
    color: #2f6b2f;
    margin-bottom: 0.5rem;
  }

  .filedrag {
    border-radius: 7px;
    border: 2px dashed #3da8ba;
    color: #555555;
    cursor: default;
    padding: 1rem;
    text-align: center;
    background: #f9f9f9;
    margin-bottom: 0.5rem;
  }

  .error {
    color: #b00020;
    font-size: 12px;
  }

  input[type='file'] {
    font-size: 12px;
  }
</style>
