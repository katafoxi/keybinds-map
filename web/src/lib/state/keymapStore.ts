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
import { serializePycharmKeymap, downloadXml } from '../parsers/pycharm-serialize';
import { serializeBashInputrc, downloadInputrc } from '../parsers/bash-serialize';
import defaultPycharmXml from '@fixtures/Windows.xml?raw';
import defaultBashInputrc from '@fixtures/bash-emacs.inputrc?raw';
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
    };
  }
  return { id: commandId, shortName: commandId };
}

function catalogToRefs(entries: CommandCatalogEntry[] | undefined): CommandRef[] {
  return (entries ?? []).map((entry) => ({
    id: entry.id,
    shortName: entry.shortName,
    icon: entry.iconPath,
  }));
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
    return applyParsedToState(state, 'bash', source, parseBashKeymap(source), {
      version: '1',
      name: 'Bash Emacs',
    });
  }
  if (program === 'vscode') {
    return applyParsedToState(state, 'vscode', source, parseVsCodeKeymap(source), {
      version: '1',
      name: 'VS Code',
    });
  }
  return applyXmlToState(state, source, program);
}

function serializeSource(state: KeymapState): string {
  if (state.selectedProgram === 'bash') {
    return serializeBashInputrc(state.bindings);
  }
  if (state.selectedProgram === 'vscode') {
    return state.sourceXml;
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
    }
  },

  loadFromXml(xml) {
    set({
      ...applyXmlToState(get(), xml, 'pycharm'),
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

  loadDefaultKeymap() {
    const program = get().selectedProgram;
    if (program === 'bash') {
      get().loadFromBash(defaultBashInputrc);
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
    if (!canMutateBinding(state.catalog, state.selectedProgram, key, slot, existing)) {
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
    if (!canMutateBinding(state.catalog, state.selectedProgram, key, slot, command)) {
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
    if (!canMutateBinding(state.catalog, state.selectedProgram, fromKey, fromSlot, command)) {
      return;
    }

    const target = state.bindings[toKey]?.[toSlot];
    if (!canMutateBinding(state.catalog, state.selectedProgram, toKey, toSlot, target)) {
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
  };
}

export const keymap = bindKeymapStore();
