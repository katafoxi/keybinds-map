# Keybinds Map (browser-first SPA)

Визуальный редактор keymap для PyCharm. Файлы обрабатываются **локально в браузере** — на сервер ничего не отправляется.

## Development (SPA)

```bash
cd web
npm install
npm run dev
```

Откройте http://127.0.0.1:5173

### Тесты и сборка

```bash
cd web
npm test
npm run build
npm run preview
```

### Каталог команд и иконки

После клонирования или изменения fixtures:

```bash
node scripts/sync-assets.mjs
node scripts/export-catalog.mjs
```

## Legacy Django app

Старый серверный прототип в [`keymap/`](keymap/) и [`conf/`](conf/) сохранён для справки. Для основного сценария он **больше не нужен**.

Запуск legacy-версии (опционально):

```bash
python3.12 -m venv .venv
.venv/bin/pip install Django Pillow
.venv/bin/python manage.py runserver
```

## Workflow

1. Выберите PyCharm
2. Загрузите `.xml` keymap (drag & drop или выбор файла)
3. Перетащите команды по клавиатуре
4. Скачайте обновлённый XML или сохраните профиль в IndexedDB
5. Распечатайте шпаргалку (кнопка «Печать»)

## Deploy

GitHub Actions (`.github/workflows/web.yml`) запускает тесты и сборку SPA. Static deploy — GitHub Pages из `web/dist`.

## Структура

```
web/           — новое client-only приложение (Vite + Svelte + TypeScript)
keymap/        — legacy Django app
scripts/       — утилиты миграции (export-catalog.mjs)
```
