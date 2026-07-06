# LLM Agent Cache — keybinds-map

> Навигационный индекс для агентов. Читай **только** секции, релевантные задаче.  
> Полный README: [`README.md`](README.md)

## Суть проекта (30 сек)

Browser-first SPA (Vite + Svelte 4 + TypeScript): визуальный редактор keymap для **PyCharm** (XML) и **VS Code** (JSON). Всё выполняется **локально в браузере** — сервера нет. Состояние — Zustand + Immer, персистенс — IndexedDB (`idb-keyval`).

**Prod:** https://katafoxi.github.io/keybinds-map/

---

## Маршрутизация по задаче

| Задача | Читать в первую очередь | Тесты | Не читать |
|--------|-------------------------|-------|-----------|
| Импорт/парсинг PyCharm XML | `web/src/lib/parsers/pycharm.ts` | `pycharm.test.ts`, `windows-default.test.ts` | `media/`, `fixture_all.json` |
| Импорт VS Code JSON | `web/src/lib/parsers/vscode.ts` | `vscode.test.ts` | — |
| Новый парсер / IR-контракт | `docs/PARSER_CONTRACT.md` | эталон: `pycharm.test.ts`, `vscode.test.ts` | — |
| Экспорт XML | `web/src/lib/parsers/pycharm-serialize.ts` | `pycharm.test.ts` (round-trip) | — |
| Раскладка клавиш, слоты модификаторов | `web/src/lib/keyboard/layout.ts`, `bindingPolicy.ts`, `keymap.ts` | `layout.test.ts`, `bindingPolicy.test.ts` | — |
| Состояние, профили, undo, автосохранение | `web/src/lib/state/keymapStore.ts` (~717 строк) | `keymapStore.*.test.ts` | весь файл целиком — ищи по action name |
| UI / drag-and-drop | `KeyCell.svelte`, `CommandPool.svelte`, `CommandChip.svelte` | — | `@dnd-kit` в package.json **не используется** (нативный HTML5 DnD) |
| Выбор программы | `ProgramPicker.svelte` + `selectProgram` в store | — | — |
| Загрузка файлов | `FileDropZone.svelte` + `loadFromXml` / `loadFromVsCode` | — | — |
| Профили Standard/Custom1/Custom2 | `ProfileSwitcher.svelte` + `switchProfile`, `copyCurrentProfile` в store | `keymapStore.boot.test.ts` | `ProfileManager.svelte` — **не подключён** в App |
| Печать keymap | `KeyboardGrid.svelte`, `app.css` (`.print-only`, `.no-print`) | — | — |
| Каталог команд / иконки программ | `scripts/export-catalog.mjs`, `fixtures/fixture_all.json` | — | `media/pycharm_command_icons/` (сотни PNG) |
| Синхронизация ассетов | `scripts/sync-assets.mjs` | CI workflow | `web/public/icons/pycharm/` |
| CI / деплой | `.github/workflows/web.yml` | — | — |
| Стили, шапка, layout страницы | `App.svelte`, `app.css` | — | — |

---

## Архитектура (поток данных)

```mermaid
flowchart LR
  subgraph input
    XML[PyCharm .xml]
    JSON[VS Code .json]
    DEF[defaults/pycharm-windows.xml]
  end

  subgraph parsers
    P[pycharm.ts]
    V[vscode.ts]
  end

  subgraph core
    L[layout.ts]
    S[keymapStore.ts]
    T[keymap.ts types]
  end

  subgraph ui
    A[App.svelte]
    KG[KeyboardGrid]
    CP[CommandPool]
  end

  subgraph output
    SER[pycharm-serialize.ts]
    IDB[(IndexedDB)]
  end

  XML --> P
  JSON --> V
  DEF --> P
  P --> L
  V --> L
  L --> S
  T --> S
  S --> KG
  S --> CP
  A --> S
  S --> SER
  S --> IDB
```

**Каталог команд:** `fixtures/fixture_all.json` → `scripts/export-catalog.mjs` → `web/public/programs.json` + `web/src/lib/catalog/programs.json` (bundled fallback через `bundledPrograms.ts`).

**IR парсеров:** `ParsedCommands` (`commandId → keyName → modifierSlot`). Спека и чеклист новой программы — [`docs/PARSER_CONTRACT.md`](docs/PARSER_CONTRACT.md).

---

## Карта директорий

```
keybinds/
├── docs/PARSER_CONTRACT.md       # IR-контракт парсеров, чеклист новой программы
├── web/                          # SPA (вся runtime-логика)
│   ├── src/
│   │   ├── App.svelte            # Корневой layout, toolbar, boot
│   │   ├── main.ts               # Точка входа
│   │   ├── app.css               # Глобальные стили + print
│   │   ├── components/           # Svelte UI (7 компонентов)
│   │   └── lib/
│   │       ├── types/keymap.ts   # Все доменные типы
│   │       ├── state/keymapStore.ts  # Единый стор + actions
│   │       ├── parsers/          # parse + serialize
│   │       ├── keyboard/layout.ts    # Физическая раскладка клавиатуры
│   │       ├── catalog/          # bundled programs.json
│   │       └── assets.ts         # assetUrl() для GitHub Pages base
│   └── public/                   # Статика (генерируется scripts/)
├── fixtures/fixture_all.json     # Источник каталога (~5k строк) — только для catalog-задач
├── test-fixtures/                # XML/JSON для vitest + alias @fixtures
├── scripts/                      # sync-assets.mjs, export-catalog.mjs
├── media/                        # Исходники иконок PyCharm — НЕ читать агенту
├── assets/ui/                    # logo, favicon
└── .github/workflows/web.yml     # CI: test → build → GitHub Pages
```

---

## Ключевые файлы (индекс)

### Типы — `web/src/lib/types/keymap.ts` (~91)

| Тип / константа | Назначение |
|-----------------|------------|
| `ModifierSlot` | `push`, `a`, `c`, `s`, `ac`, `as`, `cs`, `acs` — слои на клавише |
| `KeyBindings` | `Record<keyName, SlotBindings>` — основная модель раскладки |
| `CommandRef` | `{ id, shortName, icon? }` — команда на клавише или в пуле |
| `ParsedCommands` | Промежуточный формат парсера: `commandId → { keyName → modifierCode }` |
| `ProgramCatalog` | Список программ + каталог команд по slug |
| `ProfileSlotId` | `standard` \| `custom1` \| `custom2` |

### Store — `web/src/lib/state/keymapStore.ts` (~717)

Экспорт: `keymap` (Svelte-подписка), `getSavedProfiles()`.

| Action | Что делает |
|--------|------------|
| `boot(catalog)` | Инициализация при старте App, загрузка IndexedDB |
| `selectProgram(slug)` | Смена программы |
| `loadFromXml` / `loadFromVsCode` | Импорт файла |
| `loadDefaultKeymap` | Дефолтный PyCharm Windows XML |
| `switchProfile` / `copyCurrentProfile` | Слоты Standard / Custom1 / Custom2 |
| `assignCommand`, `moveCommand`, `moveToPool`, `assignFromPool` | DnD-операции |
| `undo` / `redo` | История до 20 шагов |
| `exportXml` | Скачивание XML |
| `saveProfile` / `loadProfile` / `deleteProfile` | Именованные профили в IndexedDB |
| `toggleModifier`, `setPrintLayerMode` | Видимость слоёв / режим печати |

**IndexedDB ключи:** `keybinds-profiles`, `keybinds-profile-slots`, `keybinds-active-profile`. Автосохранение custom-слота: debounce 1500 ms.

**Дефолтный keymap:** импорт `test-fixtures/Windows.xml` через Vite alias `@fixtures` (см. `vite.config.mts`).

### Парсеры

| Файл | Вход | Выход |
|------|------|-------|
| `pycharm.ts` | PyCharm XML | `ParsedCommands` + warnings (chords, mouse skipped) |
| `vscode.ts` | VS Code keybindings JSON | `ParsedCommands` (через `modifiersToCode`) |
| `pycharm-serialize.ts` | `KeyBindings` + metadata | XML string + `downloadXml()` |

Общая логика модификаторов: `modifiersToCode()` в `pycharm.ts` — ключи сортируются, код = первая буква каждого модификатора (`ctrl alt` → `ca` → slot `ac`).

### Раскладка — `web/src/lib/keyboard/layout.ts` (~88)

- `BUTTONS_BACK` / `BUTTONS_FRONT` — 4 ряда клавиш (включая F-ряд, numpad)
- `getCleanKeyboardKeys()` — пустая клавиатура
- `buildBindingsFromParsed()` — parsed → KeyBindings
- `mergeKeyboardWithBindings()` — для отрисовки grid
- `bindingPolicy.ts` — `isBounded` программы, запрет push/s на символьных клавишах (IDE), locked Ctrl+C и т.п.

Имена клавиш (`backName`) — внутренний ID; алиасы PyCharm → layout в `PYCHARM_KEY_ALIASES` (`pycharm.ts`) и `KEY_TO_PYCHARM` (`pycharm-serialize.ts`).

### UI компоненты

| Компонент | Роль |
|-----------|------|
| `ProgramPicker` | Шаг 1: выбор PyCharm / VS Code |
| `FileDropZone` | Drag & drop / file input `.xml` / `.json` |
| `ProfileSwitcher` | Standard / Custom1 / Custom2 + «Скопировать профиль» |
| `CommandPool` | Неназначенные команды (drop target) |
| `KeyboardGrid` | Сетка клавиш + print header |
| `KeyCell` | Одна клавиша, 8 modifier-слотов, DnD |
| `CommandChip` | Иконка команды, drag source |
| `ProfileManager` | **Legacy:** save/load именованных профилей — не в App |

DnD payload: `application/json` с `{ sourceKey, sourceSlot, command? }`.

---

## Тесты

Запуск: `cd web && npm test` (Vitest + jsdom).

| Файл | Покрывает |
|------|-----------|
| `pycharm.test.ts` | Парсинг XML, modifiersToCode |
| `vscode.test.ts` | Парсинг JSON keybindings |
| `windows-default.test.ts` | Дефолтный Windows.xml |
| `layout.test.ts` | Раскладка, merge |
| `keymapStore.boot.test.ts` | Boot + профили |
| `keymapStore.subscribe.test.ts` | Подписка, assign/move |

Фикстуры: `test-fixtures/Windows.xml`, примеры в тестах.

---

## Сборка и скрипты

```bash
# Dev (из корня)
node scripts/sync-assets.mjs && node scripts/export-catalog.mjs
cd web && npm install && npm run dev    # http://127.0.0.1:5173

# Или
npm run dev          # из корня
cd web && npm test
cd web && npm run build
```

| Скрипт | Действие |
|--------|----------|
| `scripts/sync-assets.mjs` | media/icons → web/public; Windows.xml → test-fixtures + defaults |
| `scripts/export-catalog.mjs` | fixture_all.json → programs.json; скрывает testprog* |
| `web/vite.config.mts` | `base: './'`, alias `@fixtures` → test-fixtures |

**Поддерживаемые программы** (флаг `supported` в export-catalog): `pycharm`, `vscode`. Остальные в каталоге — «скоро».

---

## Не загружать в контекст

| Путь | Причина |
|------|---------|
| `media/pycharm_command_icons/` | ~300+ PNG, копируются в public |
| `web/public/icons/pycharm/` | Сгенерированные иконки |
| `fixtures/fixture_all.json` | ~5500 строк; нужен только для catalog/export |
| `web/public/programs.json` | Генерируется; читай `export-catalog.mjs` |
| `web/src/lib/catalog/programs.json` | Bundled-копия каталога |
| `node_modules/`, `web/dist/` | Артефакты |
| `ProfileManager.svelte` | Не используется в текущем UI |

---

## Быстрые якоря для grep

```
PARSER_CONTRACT       # docs/PARSER_CONTRACT.md — IR, слоты, чеклист парсера
bindingPolicy         # keyboard/bindingPolicy.ts — IDE bounded slots, locked shortcuts
modifiersToCode       # pycharm.ts — ядро маппинга модификаторов
PYCHARM_KEY_ALIASES   # XML key → layout backName
applyXmlToState       # keymapStore — импорт XML в state
rehydrateCommands     # keymapStore — обновление CommandRef из catalog
MODIFIER_SLOTS        # keymap.ts — порядок слоёв
PROFILES_KEY          # IndexedDB именованные профили
PROFILE_SLOTS_KEY     # custom1/custom2 XML
assetUrl              # пути для GitHub Pages
```

---

## Зависимости (зачем)

| Пакет | Где |
|-------|-----|
| `zustand` + `immer` | keymapStore |
| `fast-xml-parser` | pycharm.ts |
| `idb-keyval` | персистенс профилей |
| `svelte` 4 | UI |
| `vitest` + `@testing-library/svelte` | тесты |

---

*Обновляй этот файл при добавлении модулей, смене архитектуры или появлении новых supported-программ.*
