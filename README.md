# Keybinds Map (browser-first SPA)

Визуальный редактор keymap для PyCharm и VS Code. Файлы обрабатываются **локально в браузере** — на сервер ничего не отправляется.

## Development (SPA)

```bash
node scripts/sync-assets.mjs
node scripts/export-catalog.mjs
cd web
npm install
npm run dev
```

Откройте http://127.0.0.1:5173 (Node **20+**, см. [`.nvmrc`](.nvmrc))

### Тесты и сборка

```bash
cd web
npm test
npm run build
npm run preview
```

Или одной командой подготовки ассетов:

```bash
cd web && npm run prepare:assets
```

### Каталог команд и иконки

После клонирования или изменения [`fixtures/fixture_all.json`](fixtures/fixture_all.json):

```bash
node scripts/sync-assets.mjs
node scripts/export-catalog.mjs
```

## Workflow

1. Выберите программу (PyCharm или VS Code)
2. Загрузите `.xml` (PyCharm) или `.json` (VS Code keybindings)
3. Перетащите команды по клавиатуре
4. Скачайте XML или сохраните профиль в IndexedDB (есть автосохранение черновика)
5. Распечатайте шпаргалку (кнопка «Печать», режим слоёв)

## Deploy

GitHub Actions ([`.github/workflows/web.yml`](.github/workflows/web.yml)) синхронизирует ассеты, запускает тесты и деплоит `web/dist` на GitHub Pages.

## Структура

```
web/              — client-only SPA (Vite + Svelte + TypeScript)
fixtures/         — каталог программ и команд (источник для export-catalog)
test-fixtures/    — XML/JSON для vitest
assets/ui/        — logo, favicon (источник для sync-assets)
media/            — иконки команд PyCharm (источник для sync-assets)
scripts/          — export-catalog.mjs, sync-assets.mjs
```
