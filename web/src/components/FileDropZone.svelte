<script lang="ts">
  import { keymap } from '../lib/state/keymapStore';

  let errorMessage = '';

  function handleFiles(files: FileList | null) {
    errorMessage = '';
    if (!files?.length) {
      return;
    }

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.xml')) {
      errorMessage = 'Нужен XML-файл keymap.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === 'string') {
        keymap.getState().loadFromXml(text);
      }
    };
    reader.readAsText(file);
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
    Перетащите XML keymap сюда или выберите файл
  </div>
  <input id="fileselect" type="file" accept=".xml,text/xml" on:change={onInputChange} />
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
