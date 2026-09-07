import { createStore } from 'zustand/vanilla';
import type {
  CommandRef,
  KeyBindings,
  KeymapMetadata,
  ParsedCommands,
  PrintLayerMode,
  ProfileSlotId,
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
import { parseVimKeymap } from '../parsers/vim';
import {
  downloadVimrc,
  parseVimrcMaps,
  serializeVimKeymap,
} from '../parsers/vim-serialize';
import { serializePycharmKeymap, downloadXml } from '../parsers/pycharm-serialize';
import { serializeBashInputrc, downloadInputrc } from '../parsers/bash-serialize';
import {
  downloadVsCodeKeymap,
  serializeVsCodeKeymap,
} from '../parsers/vscode-serialize';
import { reduceVimView, type VimViewTransition } from '../vim/vimView';
import defaultPycharmXml from '@fixtures/Windows.xml?raw';
import defaultBashInputrc from '@fixtures/bash-emacs.inputrc?raw';
import defaultVimJson from '@fixtures/vim-default.json?raw';
import defaultVimRecipes from '@fixtures/vim-recipes.json?raw';
import { bundledCatalog } from '../catalog/bundledPrograms';
import { canMutateBinding } from '../keyboard/bindingPolicy';
import {
  clearDraftKey,
  getActiveProfileId,
  getProfileSlots,
  getSavedProfiles,
  saveNamedProfiles,
  setActiveProfileId,
  setProfileSlots,
} from './profilePersistence';
import {
  MAX_HISTORY,
  cloneBindings,
  pushHistory,
  restoreDisplay,
  snapshotState,
  type KeymapStateSnapshot,
} from './history';
import {
  EMPTY_VIM,
  applyVimToState,
  buildVimDisplayState,
  catalogFor,
  catalogToRefs,
  patchVimBinding,
  resolveCommand,
  vimDisplayLayer,
} from './vimHelpers';

export { getSavedProfiles } from './profilePersistence';

const AUTOSAVE_MS = 1500;

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let bootPromise: Promise<void> | null = null;

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

type AssignArgs = {
  key: string;
  slot: keyof KeyBindings[string];
  command: CommandRef;
  replaceExisting?: boolean;
};

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
    return applyVimToState(state, source, defaultVimRecipes) as Partial<KeymapState>;
  }
  return {
    ...EMPTY_VIM,
    ...applyXmlToState(state, source, program),
  };
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

function serializeSource(state: KeymapState): string {
  if (state.selectedProgram === 'bash') {
    return serializeBashInputrc(state.bindings);
  }
  if (state.selectedProgram === 'vscode') {
    return serializeVsCodeKeymap(state.bindings);
  }
  if (state.selectedProgram === 'vim') {
    return state.sourceXml || defaultVimJson;
  }
  return serializePycharmKeymap(state.bindings, state.metadata);
}

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
  copyCurrentProfile: (options?: {
    overwriteCustom1?: boolean;
  }) => Promise<ProfileSlotId | null>;
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
    await setActiveProfileId('standard');
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
    await clearDraftKey();

    const slots = await getProfileSlots();
    const savedActive = await getActiveProfileId();
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
      ...(applyVimToState(get(), source, defaultVimRecipes) as Partial<KeymapState>),
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
    const applied = applyVimToState(state, nextSource, defaultVimRecipes) as Partial<KeymapState>;
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
      await setActiveProfileId(slotId);
      return true;
    }

    await loadStandardProfile();
    return true;
  },

  async copyCurrentProfile(options = {}) {
    const state = get();
    const slots = await getProfileSlots();
    const bothFull = Boolean(slots.custom1 && slots.custom2);
    if (bothFull && !options.overwriteCustom1) {
      return null;
    }

    const target: 'custom1' | 'custom2' = !slots.custom1
      ? 'custom1'
      : !slots.custom2
        ? 'custom2'
        : 'custom1';

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
    const previous = state.bindings[key]?.[slot];
    if (!canMutateBinding(state.catalog, state.selectedProgram, key, slot, previous, state.vimMode)) {
      return;
    }
    if (previous && !replaceExisting) {
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

    const bindings = cloneBindings(state.bindings);
    bindings[key] ??= {};
    bindings[key][slot] = command;

    let unassigned = [...state.unassigned];
    if (previous && previous.id !== command.id) {
      if (!unassigned.some((item) => item.id === previous.id)) {
        unassigned.push(previous);
      }
    }
    unassigned = unassigned.filter((item) => item.id !== command.id);

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
    const visibility =
      mode === 'insert'
        ? state.modifierVisibility
        : {
            ...state.modifierVisibility,
            push: true,
            s: true,
          };
    const overrides = {
      vimMode: mode,
      vimView: { kind: 'idle' } as VimViewState,
      vimFlash: null,
      vimHighlightRoles: [],
      vimHighlightCommandIds: [],
      vimRecipeActiveId: null,
      modifierVisibility: visibility,
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
    if (state.vimRecipeActiveId === recipeId) {
      get().clearVimRecipe();
      return;
    }
    const recipe = state.vimRecipes.find((item) => item.id === recipeId);
    if (!recipe?.steps.length) {
      return;
    }
    const first = recipe.steps[0];
    const sequence = recipe.steps
      .map((step) => {
        const binding = state.vimBindings.find(
          (item) =>
            item.mode === step.mode &&
            item.keyName === step.keyName &&
            item.slot === step.slot &&
            (item.layer ?? null) === (step.layer ?? null),
        );
        if (binding) {
          return resolveCommand(binding.commandId, catalogFor(state), 'vim').shortName;
        }
        return step.keyName;
      })
      .join(' → ');

    const focusLayer = first.layer ?? null;
    const highlightIds: string[] = [];
    for (const step of recipe.steps) {
      if (step.mode !== first.mode) {
        continue;
      }
      if ((step.layer ?? null) !== focusLayer) {
        continue;
      }
      const binding = state.vimBindings.find(
        (item) =>
          item.mode === step.mode &&
          item.keyName === step.keyName &&
          item.slot === step.slot &&
          (item.layer ?? null) === (step.layer ?? null),
      );
      if (binding) {
        highlightIds.push(binding.commandId);
      }
    }

    const overrides: Partial<KeymapState> = {
      vimRecipeActiveId: recipeId,
      vimRecipeStepIndex: 0,
      vimMode: first.mode,
      vimView: focusLayer ? { kind: 'prefix', layerId: focusLayer } : { kind: 'idle' },
      vimFlash: sequence,
      vimHighlightCommandIds: highlightIds,
      vimHighlightRoles: [],
    };
    set({
      ...overrides,
      ...buildVimDisplayState(state, overrides),
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
      ...restoreDisplay(state, previous),
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
      ...restoreDisplay(state, next),
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
    } else if (state.selectedProgram === 'vscode') {
      downloadVsCodeKeymap(filename ?? 'keybindings.json', source);
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
    await saveNamedProfiles([...profiles, profile]);
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
    await saveNamedProfiles(profiles.filter((profile) => profile.id !== id));
  },
};
});

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
