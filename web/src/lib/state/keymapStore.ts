import { createStore } from 'zustand/vanilla';
import type {
  CommandCatalogEntry,
  CommandRef,
  KeyBindings,
  KeymapMetadata,
  ParsedCommands,
  PrintLayerMode,
  ProfileSlotId,
  ProfileSlotsStore,
  ProgramCatalog,
  SavedProfile,
  DragState,
  VimBinding,
  VimExCommand,
  VimLayerDef,
  VimMode,
  VimOperatorDef,
  VimRecipe,
  VimSector,
  VimViewState,
} from '../types/keymap';
import {
  buildBindingsFromParsed,
  buildUnassignedCommands,
} from '../keyboard/layout';
import {
  parsePycharmKeymapDetailed,
  parsePycharmMetadata,
} from '../parsers/pycharm';
import { parseVsCodeKeymap } from '../parsers/vscode';
import { parseBashKeymap } from '../parsers/bash';
import {
  assignedCommandIds,
  parseVimKeymap,
  vimBindingsToKeyBindings,
} from '../parsers/vim';
import {
  downloadVimrc,
  parseVimrcMaps,
  serializeVimKeymap,
} from '../parsers/vim-serialize';
import { serializePycharmKeymap, downloadXml } from '../parsers/pycharm-serialize';
import { serializeBashInputrc, downloadInputrc } from '../parsers/bash-serialize';
import { reduceVimView, type VimViewTransition } from '../vim/vimView';
import defaultPycharmXml from '@fixtures/Windows.xml?raw';
import defaultBashInputrc from '@fixtures/bash-emacs.inputrc?raw';
import defaultVimJson from '@fixtures/vim-default.json?raw';
import defaultVimRecipes from '@fixtures/vim-recipes.json?raw';
import { bundledCatalog } from '../catalog/bundledPrograms';
import { canMutateBinding } from '../keyboard/bindingPolicy';
import { get, set as idbSet } from 'idb-keyval';

const PROFILES_KEY = 'keybinds-profiles';
const PROFILE_SLOTS_KEY = 'keybinds-profile-slots';
const ACTIVE_PROFILE_KEY = 'keybinds-active-profile';
const MAX_HISTORY = 20;
const AUTOSAVE_MS = 1500;

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let bootPromise: Promise<void> | null = null;

function catalogFor(state: KeymapState): ProgramCatalog {
  return state.catalog ?? bundledCatalog;
}

function bindingKeyCount(bindings: KeyBindings): number {
  return Object.keys(bindings).length;
}

function isCatalogValid(catalog: ProgramCatalog | null | undefined): catalog is ProgramCatalog {
  return Boolean(catalog?.commands?.pycharm?.length);
}

export type KeymapState = {
  selectedProgram: string;
  catalog: ProgramCatalog | null;
  bindings: KeyBindings;
  unassigned: CommandRef[];
  metadata: KeymapMetadata;
  sourceXml: string;
  dirty: boolean;
  activeProfileId: ProfileSlotId;
  importWarnings: string[];
  modifierVisibility: Record<string, boolean>;
  printLayerMode: PrintLayerMode;
  drag: DragState | null;
  historyPast: KeymapStateSnapshot[];
  historyFuture: KeymapStateSnapshot[];
  /** Vim-specific (ignored for other programs). */
  vimMode: VimMode;
  vimBindings: VimBinding[];
  vimLayers: VimLayerDef[];
  vimOperators: VimOperatorDef[];
  vimExCommands: VimExCommand[];
  vimRecipes: VimRecipe[];
  vimView: VimViewState;
  activeSectors: VimSector[];
  vimFlash: string | null;
  vimHighlightRoles: string[];
  vimHighlightCommandIds: string[];
  vimRecipeActiveId: string | null;
  vimRecipeStepIndex: number;
};

type KeymapStateSnapshot = Pick<
  KeymapState,
  'bindings' | 'unassigned' | 'metadata' | 'sourceXml' | 'dirty' | 'importWarnings'
>;

type AssignArgs = {
  key: string;
  slot: keyof KeyBindings[string];
  command: CommandRef;
  replaceExisting?: boolean;
};

function cloneBindings(bindings: KeyBindings): KeyBindings {
  return structuredClone(bindings);
}

function snapshotState(state: KeymapState): KeymapStateSnapshot {
  return {
    bindings: cloneBindings(state.bindings),
    unassigned: structuredClone(state.unassigned),
    metadata: structuredClone(state.metadata),
    sourceXml: state.sourceXml,
    dirty: state.dirty,
    importWarnings: [...state.importWarnings],
  };
}

function pushHistory(state: KeymapState): Pick<KeymapState, 'historyPast' | 'historyFuture'> {
  return {
    historyPast: [...state.historyPast, snapshotState(state)].slice(-MAX_HISTORY),
    historyFuture: [],
  };
}

function resolveCommand(
  commandId: string,
  catalog: ProgramCatalog | null,
  program: string,
): CommandRef {
  const fromCatalog = catalog?.commands[program]?.find((entry) => entry.id === commandId);
  if (fromCatalog) {
    return {
      id: fromCatalog.id,
      shortName: fromCatalog.shortName,
      icon: fromCatalog.iconPath,
      descriptions: fromCatalog.descriptions,
      sector: fromCatalog.sector,
      roles: fromCatalog.roles,
      modes: fromCatalog.modes,
    };
  }
  return { id: commandId, shortName: commandId };
}

function catalogToRefs(entries: CommandCatalogEntry[] | undefined): CommandRef[] {
  return (entries ?? []).map((entry) => ({
    id: entry.id,
    shortName: entry.shortName,
    icon: entry.iconPath,
    descriptions: entry.descriptions,
    sector: entry.sector,
    roles: entry.roles,
    modes: entry.modes,
  }));
}

const EMPTY_VIM = {
  vimMode: 'normal' as VimMode,
  vimBindings: [] as VimBinding[],
  vimLayers: [] as VimLayerDef[],
  vimOperators: [] as VimOperatorDef[],
  vimExCommands: [] as VimExCommand[],
  vimRecipes: [] as VimRecipe[],
  vimView: { kind: 'idle' } as VimViewState,
  activeSectors: [] as VimSector[],
  vimFlash: null as string | null,
  vimHighlightRoles: [] as string[],
  vimHighlightCommandIds: [] as string[],
  vimRecipeActiveId: null as string | null,
  vimRecipeStepIndex: 0,
};

function vimDisplayLayer(view: VimViewState): string | null {
  return view.kind === 'prefix' ? view.layerId : null;
}

function patchVimBinding(
  vimBindings: VimBinding[],
  mode: VimMode,
  layer: string | null,
  keyName: string,
  slot: string,
  commandId: string | null,
): VimBinding[] {
  const next = vimBindings.filter(
    (binding) =>
      !(
        binding.mode === mode &&
        (binding.layer ?? null) === layer &&
        binding.keyName === keyName &&
        binding.slot === slot
      ),
  );
  if (commandId) {
    next.push({
      commandId,
      mode,
      keyName,
      slot: slot as VimBinding['slot'],
      layer,
    });
  }
  return next;
}

function buildVimDisplayState(
  state: KeymapState,
  overrides: Partial<KeymapState> = {},
): Partial<KeymapState> {
  const merged = { ...state, ...overrides };
  const catalog = catalogFor(merged);
  const resolver = (commandId: string) => resolveCommand(commandId, catalog, 'vim');
  const layer = vimDisplayLayer(merged.vimView);
  const bindings = vimBindingsToKeyBindings(
    merged.vimBindings,
    merged.vimMode,
    layer,
    resolver,
  );
  const assigned = assignedCommandIds(merged.vimBindings);
  const unassigned = catalogToRefs(catalog.commands.vim).filter(
    (command) => !assigned.has(command.id),
  );
  return { bindings, unassigned };
}

async function getProfileSlots(): Promise<ProfileSlotsStore> {
  return (await get<ProfileSlotsStore>(PROFILE_SLOTS_KEY)) ?? {};
}

async function setProfileSlots(slots: ProfileSlotsStore): Promise<void> {
  await idbSet(PROFILE_SLOTS_KEY, slots);
}

function scheduleSlotAutosave(): void {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  autosaveTimer = setTimeout(() => {
    void keymapStore.getState().persistActiveCustomSlot();
  }, AUTOSAVE_MS);
}

function rehydrateCommands(
  state: KeymapState,
  program: string,
): Pick<KeymapState, 'bindings' | 'unassigned'> {
  const resolver = (commandId: string) =>
    resolveCommand(commandId, state.catalog, program);
  const bindings = cloneBindings(state.bindings ?? {});

  for (const [key, slots] of Object.entries(bindings)) {
    if (!slots || typeof slots !== 'object') {
      continue;
    }
    for (const [slot, command] of Object.entries(slots)) {
      if (command) {
        bindings[key][slot as keyof KeyBindings[string]] = resolver(command.id);
      }
    }
  }

  return {
    bindings,
    unassigned: (state.unassigned ?? []).map((command) => resolver(command.id)),
  };
}

function applyParsedToState(
  state: KeymapState,
  program: string,
  source: string,
  parsed: { commands: ParsedCommands; warnings: string[] },
  metadata: KeymapMetadata,
): Partial<KeymapState> {
  const catalog = catalogFor(state);
  const catalogRefs = catalogToRefs(catalog.commands[program]);
  const resolver = (commandId: string) => resolveCommand(commandId, catalog, program);

  return {
    selectedProgram: program,
    catalog,
    bindings: buildBindingsFromParsed(parsed.commands, resolver),
    unassigned: buildUnassignedCommands(parsed.commands, catalogRefs),
    metadata,
    sourceXml: source,
    dirty: false,
    importWarnings: parsed.warnings,
    historyPast: [],
    historyFuture: [],
  };
}

function applyXmlToState(
  state: KeymapState,
  xml: string,
  program: string,
): Partial<KeymapState> {
  const parsed = parsePycharmKeymapDetailed(xml);
  const metadata = parsePycharmMetadata(xml);
  return applyParsedToState(state, program, xml, parsed, metadata);
}

function applySourceToState(
  state: KeymapState,
  source: string,
  program: string,
): Partial<KeymapState> {
  if (program === 'bash') {
    return {
      ...EMPTY_VIM,
      ...applyParsedToState(state, 'bash', source, parseBashKeymap(source), {
        version: '1',
        name: 'Bash Emacs',
      }),
    };
  }
  if (program === 'vscode') {
    return {
      ...EMPTY_VIM,
      ...applyParsedToState(state, 'vscode', source, parseVsCodeKeymap(source), {
        version: '1',
        name: 'VS Code',
      }),
    };
  }
  if (program === 'vim') {
    return applyVimToState(state, source);
  }
  return {
    ...EMPTY_VIM,
    ...applyXmlToState(state, source, program),
  };
}

function applyVimToState(state: KeymapState, source: string): Partial<KeymapState> {
  const parsed = parseVimKeymap(source, defaultVimRecipes);
  const catalog = catalogFor(state);
  const next: Partial<KeymapState> = {
    selectedProgram: 'vim',
    catalog,
    metadata: { version: '1', name: 'Vim Default' },
    sourceXml: source,
    dirty: false,
    importWarnings: parsed.warnings,
    historyPast: [],
    historyFuture: [],
    vimMode: 'normal',
    vimBindings: parsed.vimBindings,
    vimLayers: parsed.layers,
    vimOperators: parsed.operators,
    vimExCommands: parsed.exCommands,
    vimRecipes: parsed.recipes,
    vimView: { kind: 'idle' },
    activeSectors: [],
    vimFlash: null,
    vimHighlightRoles: [],
    vimHighlightCommandIds: [],
    vimRecipeActiveId: null,
    vimRecipeStepIndex: 0,
  };
  return {
    ...next,
    ...buildVimDisplayState({ ...state, ...next } as KeymapState),
  };
}

function serializeSource(state: KeymapState): string {
  if (state.selectedProgram === 'bash') {
    return serializeBashInputrc(state.bindings);
  }
  if (state.selectedProgram === 'vscode') {
    return state.sourceXml;
  }
  if (state.selectedProgram === 'vim') {
    return state.sourceXml || defaultVimJson;
  }
  return serializePycharmKeymap(state.bindings, state.metadata);
}

const MODIFIER_VISIBILITY_DEFAULT = {
  push: true,
  a: true,
  c: true,
  s: true,
  ac: true,
  as: true,
  cs: true,
  acs: true,
} as const;

function emptyKeymapState(catalog: ProgramCatalog): KeymapState {
  return {
    selectedProgram: 'pycharm',
    catalog,
    bindings: {},
    unassigned: [],
    metadata: { version: '1', name: 'Custom' },
    sourceXml: '',
    dirty: false,
    activeProfileId: 'standard',
    importWarnings: [],
    modifierVisibility: { ...MODIFIER_VISIBILITY_DEFAULT },
    printLayerMode: 'visible',
    drag: null,
    historyPast: [],
    historyFuture: [],
    ...EMPTY_VIM,
  };
}

function buildStandardProfileState(catalog: ProgramCatalog): Partial<KeymapState> {
  return applyXmlToState(emptyKeymapState(catalog), defaultPycharmXml, 'pycharm');
}

const initialStandardState = buildStandardProfileState(bundledCatalog);

export type KeymapActions = {
  setCatalog: (catalog: ProgramCatalog) => void;
  boot: (catalog: ProgramCatalog) => Promise<void>;
  initialize: () => Promise<void>;
  selectProgram: (slug: string) => Promise<void>;
  loadFromXml: (xml: string) => void;
  loadFromVsCode: (json: string) => void;
  loadFromBash: (source: string) => void;
  loadFromVim: (source: string) => void;
  loadFromVimrc: (source: string) => void;
  loadDefaultKeymap: () => boolean;
  switchProfile: (slotId: ProfileSlotId) => Promise<boolean>;
  copyCurrentProfile: () => Promise<ProfileSlotId | null>;
  getCustomSlotsFilled: () => Promise<Record<'custom1' | 'custom2', boolean>>;
  persistActiveCustomSlot: () => Promise<void>;
  assignCommand: (args: AssignArgs) => void;
  unassignCommand: (key: string, slot: keyof KeyBindings[string]) => void;
  moveCommand: (
    fromKey: string,
    fromSlot: keyof KeyBindings[string],
    toKey: string,
    toSlot: keyof KeyBindings[string],
  ) => void;
  moveToPool: (key: string, slot: keyof KeyBindings[string]) => void;
  assignFromPool: (
    command: CommandRef,
    key: string,
    slot: keyof KeyBindings[string],
  ) => void;
  setDragTarget: (targetKey: string, targetSlot: keyof KeyBindings[string]) => void;
  clearDragTarget: () => void;
  startDrag: (command: CommandRef, sourceKey?: string, sourceSlot?: string) => void;
  clearDrag: () => void;
  endDrag: () => void;
  toggleModifier: (slot: string, visible: boolean) => void;
  setPrintLayerMode: (mode: PrintLayerMode) => void;
  setVimMode: (mode: VimMode) => void;
  setActiveSectors: (sectors: VimSector[]) => void;
  toggleActiveSector: (sector: VimSector) => void;
  activateVimCommand: (command: CommandRef, keyName: string, slot: string) => void;
  resetVimView: () => void;
  playVimRecipe: (recipeId: string) => void;
  clearVimRecipe: () => void;
  undo: () => void;
  redo: () => void;
  exportXml: (filename?: string) => void;
  exportKeymap: (filename?: string) => void;
  saveProfile: (name: string) => Promise<SavedProfile>;
  loadProfile: (profile: SavedProfile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
};

export const keymapStore = createStore<KeymapState & KeymapActions>((set, get) => {
  const loadStandardProfile = async () => {
    set({
      activeProfileId: 'standard',
      ...applyXmlToState(get(), defaultPycharmXml, 'pycharm'),
    });
    await idbSet(ACTIVE_PROFILE_KEY, 'standard');
  };

  return {
  selectedProgram: 'pycharm',
  catalog: bundledCatalog,
  bindings: initialStandardState.bindings ?? {},
  unassigned: initialStandardState.unassigned ?? [],
  metadata: initialStandardState.metadata ?? { version: '1', name: 'Custom' },
  sourceXml: initialStandardState.sourceXml ?? '',
  dirty: false,
  activeProfileId: 'standard',
  importWarnings: initialStandardState.importWarnings ?? [],
  modifierVisibility: { ...MODIFIER_VISIBILITY_DEFAULT },
  printLayerMode: 'visible',
  drag: null,
  historyPast: [],
  historyFuture: [],
  ...EMPTY_VIM,

  setCatalog(catalog) {
    if (!isCatalogValid(catalog)) {
      return;
    }
    const state = get();
    if (bindingKeyCount(state.bindings) > 0) {
      set({
        catalog,
        ...rehydrateCommands({ ...state, catalog }, state.selectedProgram),
      });
      return;
    }
    set({
      catalog,
      unassigned: catalogToRefs(catalog.commands[state.selectedProgram]),
    });
  },

  async boot(catalog) {
    if (bootPromise) {
      return bootPromise;
    }
    bootPromise = (async () => {
      const resolved = isCatalogValid(catalog) ? catalog : bundledCatalog;
      const state = get();
      if (state.activeProfileId === 'standard') {
        set({
          catalog: resolved,
          ...applyXmlToState({ ...state, catalog: resolved }, defaultPycharmXml, 'pycharm'),
        });
      } else {
        set({
          catalog: resolved,
          ...rehydrateCommands({ ...state, catalog: resolved }, state.selectedProgram),
        });
      }
      await get().initialize();
    })();
    return bootPromise;
  },

  async initialize() {
    await idbSet('keybinds-draft', undefined);

    const slots = await getProfileSlots();
    const savedActive = await get<ProfileSlotId>(ACTIVE_PROFILE_KEY);
    let active: ProfileSlotId = savedActive ?? 'standard';

    if (active !== 'standard' && !slots[active]) {
      active = 'standard';
    }

    if (active === 'standard') {
      await loadStandardProfile();
      return;
    }

    const loaded = await get().switchProfile(active);
    if (!loaded || bindingKeyCount(get().bindings) === 0) {
      await loadStandardProfile();
    }
  },

  async selectProgram(slug) {
    if (bootPromise) {
      await bootPromise;
    }
    const state = get();
    const catalog = catalogFor(state);

    if (slug === 'pycharm') {
      await get().switchProfile(state.activeProfileId);
      return;
    }

    if (slug === 'vscode') {
      if (state.selectedProgram === 'vscode') {
        return;
      }
      set({
        selectedProgram: 'vscode',
        catalog,
        bindings: {},
        unassigned: catalogToRefs(catalog.commands.vscode),
        metadata: { version: '1', name: 'VS Code' },
        sourceXml: '',
        dirty: false,
        importWarnings: [],
        historyPast: [],
        historyFuture: [],
      });
      return;
    }

    if (slug === 'bash') {
      if (state.selectedProgram === 'bash' && bindingKeyCount(state.bindings) > 0) {
        return;
      }
      get().loadFromBash(defaultBashInputrc);
      return;
    }

    if (slug === 'vim') {
      if (state.selectedProgram === 'vim' && bindingKeyCount(state.bindings) > 0) {
        return;
      }
      get().loadFromVim(defaultVimJson);
    }
  },

  loadFromXml(xml) {
    set({
      ...applyXmlToState(get(), xml, 'pycharm'),
      ...EMPTY_VIM,
    });
  },

  loadFromVsCode(json) {
    set({
      ...applySourceToState(get(), json, 'vscode'),
    });
  },

  loadFromBash(source) {
    set({
      ...applySourceToState(get(), source, 'bash'),
    });
  },

  loadFromVim(source) {
    set({
      ...applyVimToState(get(), source),
    });
  },

  loadFromVimrc(source) {
    const state = get();
    const base = parseVimKeymap(
      state.sourceXml || defaultVimJson,
      defaultVimRecipes,
    );
    const imported = parseVimrcMaps(source);
    const merged = [...base.vimBindings];
    for (const binding of imported.bindings) {
      const idx = merged.findIndex(
        (item) =>
          item.mode === binding.mode &&
          item.keyName === binding.keyName &&
          item.slot === binding.slot &&
          (item.layer ?? null) === (binding.layer ?? null),
      );
      if (idx >= 0) {
        merged[idx] = binding;
      } else {
        merged.push(binding);
      }
    }
    const nextSource = JSON.stringify(
      {
        ...JSON.parse(state.sourceXml || defaultVimJson),
        bindings: merged.map((binding) => ({
          commandId: binding.commandId,
          mode: binding.mode,
          key: binding.keyName,
          slot: binding.slot,
          layer: binding.layer ?? undefined,
        })),
      },
      null,
      2,
    );
    const applied = applyVimToState(state, nextSource);
    set({
      ...applied,
      importWarnings: [...(applied.importWarnings ?? []), ...imported.warnings],
      dirty: true,
    });
  },

  loadDefaultKeymap() {
    const program = get().selectedProgram;
    if (program === 'bash') {
      get().loadFromBash(defaultBashInputrc);
      return true;
    }
    if (program === 'vim') {
      get().loadFromVim(defaultVimJson);
      return true;
    }
    if (program !== 'pycharm') {
      return false;
    }
    get().loadFromXml(defaultPycharmXml);
    return true;
  },

  async switchProfile(slotId) {
    const state = get();

    if (state.dirty && state.activeProfileId !== 'standard') {
      await get().persistActiveCustomSlot();
    }

    if (slotId !== 'standard') {
      const slots = await getProfileSlots();
      const slot = slots[slotId];
      if (!slot) {
        return false;
      }
      const next = applySourceToState(state, slot.xml, slot.program);
      if (bindingKeyCount(next.bindings ?? {}) === 0) {
        return false;
      }
      set({
        activeProfileId: slotId,
        ...next,
      });
      await idbSet(ACTIVE_PROFILE_KEY, slotId);
      return true;
    }

    await loadStandardProfile();
    return true;
  },

  async copyCurrentProfile() {
    const state = get();
    const slots = await getProfileSlots();
    const target: 'custom1' | 'custom2' = !slots.custom1
      ? 'custom1'
      : !slots.custom2
        ? 'custom2'
        : 'custom1';

    if (slots.custom1 && slots.custom2) {
      const overwrite = window.confirm(
        'Custom1 и Custom2 заняты. Перезаписать Custom1 текущей раскладкой?',
      );
      if (!overwrite) {
        return null;
      }
    }

    const xml = serializeSource(state);
    slots[target] = {
      program: state.selectedProgram,
      xml,
      updatedAt: Date.now(),
    };
    await setProfileSlots(slots);
    await get().switchProfile(target);
    return target;
  },

  async getCustomSlotsFilled() {
    const slots = await getProfileSlots();
    return {
      custom1: Boolean(slots.custom1),
      custom2: Boolean(slots.custom2),
    };
  },

  async persistActiveCustomSlot() {
    const state = get();
    const slotId = state.activeProfileId;
    if (slotId === 'standard' || !state.dirty) {
      return;
    }

    const xml = serializeSource(state);
    const slots = await getProfileSlots();
    slots[slotId] = {
      program: state.selectedProgram,
      xml,
      updatedAt: Date.now(),
    };
    await setProfileSlots(slots);
    set({ dirty: false, sourceXml: xml });
  },

  assignCommand({ key, slot, command, replaceExisting = true }) {
    const state = get();
    const existing = state.bindings[key]?.[slot];
    if (!canMutateBinding(state.catalog, state.selectedProgram, key, slot, existing, state.vimMode)) {
      return;
    }

    const bindings = cloneBindings(state.bindings);
    bindings[key] ??= {};

    const previous = bindings[key][slot];
    if (previous && !replaceExisting) {
      return;
    }

    let unassigned = [...state.unassigned];
    if (previous && previous.id !== command.id) {
      if (!unassigned.some((item) => item.id === previous.id)) {
        unassigned.push(previous);
      }
    }

    bindings[key][slot] = command;
    unassigned = unassigned.filter((item) => item.id !== command.id);

    if (state.selectedProgram === 'vim') {
      const layer = vimDisplayLayer(state.vimView);
      const vimBindings = patchVimBinding(
        state.vimBindings,
        state.vimMode,
        layer,
        key,
        slot,
        command.id,
      );
      set({
        ...pushHistory(state),
        vimBindings,
        ...buildVimDisplayState(state, { vimBindings }),
        dirty: true,
        drag: null,
      });
      scheduleSlotAutosave();
      return;
    }

    set({
      ...pushHistory(state),
      bindings,
      unassigned,
      dirty: true,
      drag: null,
    });
    scheduleSlotAutosave();
  },

  unassignCommand(key, slot) {
    const state = get();
    const bindings = cloneBindings(state.bindings);
    const command = bindings[key]?.[slot];
    if (!command) {
      return;
    }
    if (!canMutateBinding(state.catalog, state.selectedProgram, key, slot, command, state.vimMode)) {
      return;
    }

    if (state.selectedProgram === 'vim') {
      const layer = vimDisplayLayer(state.vimView);
      const vimBindings = patchVimBinding(
        state.vimBindings,
        state.vimMode,
        layer,
        key,
        slot,
        null,
      );
      set({
        ...pushHistory(state),
        vimBindings,
        ...buildVimDisplayState(state, { vimBindings }),
        dirty: true,
      });
      scheduleSlotAutosave();
      return;
    }

    delete bindings[key][slot];
    const unassigned = state.unassigned.some((item) => item.id === command.id)
      ? state.unassigned
      : [...state.unassigned, command];

    set({
      ...pushHistory(state),
      bindings,
      unassigned,
      dirty: true,
    });
    scheduleSlotAutosave();
  },

  moveCommand(fromKey, fromSlot, toKey, toSlot) {
    const state = get();
    const command = state.bindings[fromKey]?.[fromSlot];
    if (!command) {
      return;
    }
    if (!canMutateBinding(state.catalog, state.selectedProgram, fromKey, fromSlot, command, state.vimMode)) {
      return;
    }

    const target = state.bindings[toKey]?.[toSlot];
    if (!canMutateBinding(state.catalog, state.selectedProgram, toKey, toSlot, target, state.vimMode)) {
      return;
    }

    const bindings = cloneBindings(state.bindings);
    bindings[fromKey] ??= {};
    bindings[toKey] ??= {};

    const targetOccupant = bindings[toKey][toSlot];
    delete bindings[fromKey][fromSlot];

    if (targetOccupant) {
      bindings[fromKey][fromSlot] = targetOccupant;
    }

    bindings[toKey][toSlot] = command;

    if (state.selectedProgram === 'vim') {
      const layer = vimDisplayLayer(state.vimView);
      let vimBindings = patchVimBinding(
        state.vimBindings,
        state.vimMode,
        layer,
        fromKey,
        fromSlot,
        targetOccupant?.id ?? null,
      );
      vimBindings = patchVimBinding(
        vimBindings,
        state.vimMode,
        layer,
        toKey,
        toSlot,
        command.id,
      );
      set({
        ...pushHistory(state),
        vimBindings,
        ...buildVimDisplayState(state, { vimBindings }),
        dirty: true,
        drag: null,
      });
      scheduleSlotAutosave();
      return;
    }

    set({
      ...pushHistory(state),
      bindings,
      dirty: true,
      drag: null,
    });
    scheduleSlotAutosave();
  },

  moveToPool(key, slot) {
    get().unassignCommand(key, slot);
  },

  assignFromPool(command, key, slot) {
    get().assignCommand({ key, slot, command, replaceExisting: true });
  },

  startDrag(command, sourceKey = '', sourceSlot = '') {
    set({
      drag: {
        command,
        sourceKey: sourceKey || undefined,
        sourceSlot: sourceSlot || undefined,
      },
    });
  },

  setDragTarget(targetKey, targetSlot) {
    const drag = get().drag;
    if (!drag) {
      return;
    }
    set({
      drag: { ...drag, targetKey, targetSlot },
    });
  },

  clearDragTarget() {
    const drag = get().drag;
    if (!drag?.targetKey) {
      return;
    }
    set({
      drag: { ...drag, targetKey: undefined, targetSlot: undefined },
    });
  },

  clearDrag() {
    set({ drag: null });
  },

  endDrag() {
    setTimeout(() => {
      if (get().drag) {
        set({ drag: null });
      }
    }, 0);
  },

  toggleModifier(slot, visible) {
    set((state) => ({
      modifierVisibility: { ...state.modifierVisibility, [slot]: visible },
    }));
  },

  setPrintLayerMode(mode) {
    set({ printLayerMode: mode });
  },

  setVimMode(mode) {
    const state = get();
    if (state.selectedProgram !== 'vim') {
      return;
    }
    const overrides = {
      vimMode: mode,
      vimView: { kind: 'idle' } as VimViewState,
      vimFlash: null,
      vimHighlightRoles: [],
      vimHighlightCommandIds: [],
      vimRecipeActiveId: null,
    };
    set({
      ...overrides,
      ...buildVimDisplayState(state, overrides),
    });
  },

  setActiveSectors(sectors) {
    set({ activeSectors: sectors });
  },

  toggleActiveSector(sector) {
    const state = get();
    const has = state.activeSectors.includes(sector);
    set({
      activeSectors: has
        ? state.activeSectors.filter((item) => item !== sector)
        : [...state.activeSectors, sector],
    });
  },

  activateVimCommand(command, keyName, slot) {
    const state = get();
    if (state.selectedProgram !== 'vim') {
      return;
    }
    const transition: VimViewTransition = reduceVimView(
      state.vimView,
      { type: 'activateCommand', command, keyName, slot },
      {
        layers: state.vimLayers,
        operators: state.vimOperators,
        mode: state.vimMode,
      },
    );
    const overrides: Partial<KeymapState> = {
      vimView: transition.view,
      vimFlash: transition.flash ?? null,
      vimHighlightRoles: transition.highlightRoles ?? [],
      vimHighlightCommandIds: transition.highlightCommandIds ?? [],
    };
    set({
      ...overrides,
      ...buildVimDisplayState(state, overrides),
    });
  },

  resetVimView() {
    const state = get();
    const overrides: Partial<KeymapState> = {
      vimView: { kind: 'idle' },
      vimFlash: null,
      vimHighlightRoles: [],
      vimHighlightCommandIds: [],
    };
    set({
      ...overrides,
      ...buildVimDisplayState(state, overrides),
    });
  },

  playVimRecipe(recipeId) {
    const state = get();
    const recipe = state.vimRecipes.find((item) => item.id === recipeId);
    if (!recipe?.steps.length) {
      return;
    }
    const first = recipe.steps[0];
    const overrides: Partial<KeymapState> = {
      vimRecipeActiveId: recipeId,
      vimRecipeStepIndex: 0,
      vimMode: first.mode,
      vimView: first.layer
        ? { kind: 'prefix', layerId: first.layer }
        : { kind: 'idle' },
      vimFlash: recipe.title,
      vimHighlightCommandIds: [],
      vimHighlightRoles: [],
    };
    set({
      ...overrides,
      ...buildVimDisplayState(state, overrides),
    });

    recipe.steps.forEach((step, index) => {
      window.setTimeout(() => {
        const current = get();
        if (current.vimRecipeActiveId !== recipeId) {
          return;
        }
        const stepOverrides: Partial<KeymapState> = {
          vimRecipeStepIndex: index,
          vimMode: step.mode,
          vimView: step.layer
            ? { kind: 'prefix', layerId: step.layer }
            : { kind: 'idle' },
          vimHighlightCommandIds: [],
        };
        // Highlight the key by temporarily marking via flash of short name
        const display = buildVimDisplayState(current, stepOverrides);
        const chip = display.bindings?.[step.keyName]?.[step.slot];
        set({
          ...stepOverrides,
          ...display,
          vimFlash: chip?.shortName ?? step.keyName,
          vimHighlightCommandIds: chip ? [chip.id] : [],
        });
        if (index === recipe.steps.length - 1) {
          window.setTimeout(() => {
            if (get().vimRecipeActiveId === recipeId) {
              get().clearVimRecipe();
            }
          }, 900);
        }
      }, index * 700);
    });
  },

  clearVimRecipe() {
    const state = get();
    const overrides: Partial<KeymapState> = {
      vimRecipeActiveId: null,
      vimRecipeStepIndex: 0,
      vimFlash: null,
      vimHighlightCommandIds: [],
      vimView: { kind: 'idle' },
    };
    set({
      ...overrides,
      ...buildVimDisplayState(state, overrides),
    });
  },

  undo() {
    const state = get();
    const previous = state.historyPast.at(-1);
    if (!previous) {
      return;
    }
    const current = snapshotState(state);
    set({
      ...previous,
      historyPast: state.historyPast.slice(0, -1),
      historyFuture: [current, ...state.historyFuture].slice(0, MAX_HISTORY),
      dirty: true,
    });
    scheduleSlotAutosave();
  },

  redo() {
    const state = get();
    const next = state.historyFuture[0];
    if (!next) {
      return;
    }
    const current = snapshotState(state);
    set({
      ...next,
      historyPast: [...state.historyPast, current].slice(-MAX_HISTORY),
      historyFuture: state.historyFuture.slice(1),
      dirty: true,
    });
    scheduleSlotAutosave();
  },

  exportXml(filename = 'keymap.xml') {
    get().exportKeymap(filename);
  },

  exportKeymap(filename) {
    const state = get();
    if (state.selectedProgram === 'vim') {
      const content = serializeVimKeymap(state.vimBindings);
      downloadVimrc(filename ?? 'keybinds.vim', content);
      set({ dirty: false });
      return;
    }
    const source = serializeSource(state);
    if (state.selectedProgram === 'bash') {
      downloadInputrc(filename ?? 'inputrc', source);
    } else {
      downloadXml(filename ?? 'keymap.xml', source);
    }
    set({ dirty: false, sourceXml: source });
  },

  async saveProfile(name) {
    const state = get();
    const xml = serializeSource(state);
    const profiles = await getSavedProfiles();
    const profile: SavedProfile = {
      id: crypto.randomUUID(),
      name,
      program: state.selectedProgram,
      xml,
      updatedAt: Date.now(),
    };
    await idbSet(PROFILES_KEY, [...profiles, profile]);
    set({ dirty: false, sourceXml: xml });
    return profile;
  },

  async loadProfile(profile) {
    set({
      ...applySourceToState(get(), profile.xml, profile.program),
    });
  },

  async deleteProfile(id) {
    const profiles = await getSavedProfiles();
    await idbSet(
      PROFILES_KEY,
      profiles.filter((profile) => profile.id !== id),
    );
  },
};
});

export async function getSavedProfiles(): Promise<SavedProfile[]> {
  return (await get<SavedProfile[]>(PROFILES_KEY)) ?? [];
}

export function bindKeymapStore() {
  let current = normalizeStoreState(keymapStore.getState());
  const subscribers = new Set<(state: KeymapState & KeymapActions) => void>();

  keymapStore.subscribe((state) => {
    current = normalizeStoreState(state);
    subscribers.forEach((listener) => listener(current));
  });

  return {
    subscribe(listener: (state: KeymapState & KeymapActions) => void) {
      subscribers.add(listener);
      listener(current);
      return () => subscribers.delete(listener);
    },
    getState: () => normalizeStoreState(keymapStore.getState()),
  };
}

function normalizeStoreState(
  state: KeymapState & KeymapActions,
): KeymapState & KeymapActions {
  return {
    ...state,
    bindings: state.bindings ?? {},
    unassigned: state.unassigned ?? [],
    importWarnings: state.importWarnings ?? [],
    historyPast: state.historyPast ?? [],
    historyFuture: state.historyFuture ?? [],
    modifierVisibility: state.modifierVisibility ?? { ...MODIFIER_VISIBILITY_DEFAULT },
    drag: state.drag ?? null,
    vimMode: state.vimMode ?? 'normal',
    vimBindings: state.vimBindings ?? [],
    vimLayers: state.vimLayers ?? [],
    vimOperators: state.vimOperators ?? [],
    vimExCommands: state.vimExCommands ?? [],
    vimRecipes: state.vimRecipes ?? [],
    vimView: state.vimView ?? { kind: 'idle' },
    activeSectors: state.activeSectors ?? [],
    vimFlash: state.vimFlash ?? null,
    vimHighlightRoles: state.vimHighlightRoles ?? [],
    vimHighlightCommandIds: state.vimHighlightCommandIds ?? [],
    vimRecipeActiveId: state.vimRecipeActiveId ?? null,
    vimRecipeStepIndex: state.vimRecipeStepIndex ?? 0,
  };
}

export const keymap = bindKeymapStore();
