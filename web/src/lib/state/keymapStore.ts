import { createStore } from 'zustand/vanilla';
import type {
  CommandCatalogEntry,
  CommandRef,
  KeyBindings,
  KeymapMetadata,
  ProgramCatalog,
  SavedProfile,
} from '../types/keymap';
import {
  buildBindingsFromParsed,
  buildUnassignedCommands,
} from '../keyboard/layout';
import { parsePycharmKeymap, parsePycharmMetadata } from '../parsers/pycharm';
import { serializePycharmKeymap, downloadXml } from '../parsers/pycharm-serialize';
import { get, set } from 'idb-keyval';

const PROFILES_KEY = 'keybinds-profiles';
const MAX_HISTORY = 20;

export type KeymapState = {
  selectedProgram: string;
  catalog: ProgramCatalog | null;
  bindings: KeyBindings;
  unassigned: CommandRef[];
  metadata: KeymapMetadata;
  sourceXml: string;
  dirty: boolean;
  modifierVisibility: Record<string, boolean>;
  historyPast: KeymapStateSnapshot[];
  historyFuture: KeymapStateSnapshot[];
};

type KeymapStateSnapshot = Pick<
  KeymapState,
  'bindings' | 'unassigned' | 'metadata' | 'sourceXml' | 'dirty'
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

export type KeymapActions = {
  setCatalog: (catalog: ProgramCatalog) => void;
  selectProgram: (slug: string) => void;
  loadFromXml: (xml: string) => void;
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
  toggleModifier: (slot: string, visible: boolean) => void;
  undo: () => void;
  redo: () => void;
  exportXml: (filename?: string) => void;
  saveProfile: (name: string) => Promise<SavedProfile>;
  loadProfile: (profile: SavedProfile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
};

export const keymapStore = createStore<KeymapState & KeymapActions>((set, get) => ({
  selectedProgram: 'pycharm',
  catalog: null,
  bindings: {},
  unassigned: [],
  metadata: { version: '1', name: 'Custom' },
  sourceXml: '',
  dirty: false,
  modifierVisibility: {
    push: true,
    a: true,
    c: true,
    s: true,
    ac: true,
    as: true,
    cs: true,
    acs: true,
  },
  historyPast: [],
  historyFuture: [],

  setCatalog(catalog) {
    const refs = catalogToRefs(catalog.commands[get().selectedProgram]);
    set({ catalog, unassigned: refs });
  },

  selectProgram(slug) {
    const catalog = get().catalog;
    set({
      selectedProgram: slug,
      bindings: {},
      unassigned: catalogToRefs(catalog?.commands[slug]),
      metadata: { version: '1', name: 'Custom' },
      sourceXml: '',
      dirty: false,
      historyPast: [],
      historyFuture: [],
    });
  },

  loadFromXml(xml) {
    const state = get();
    const parsed = parsePycharmKeymap(xml);
    const metadata = parsePycharmMetadata(xml);
    const catalogRefs = catalogToRefs(state.catalog?.commands[state.selectedProgram]);
    const resolver = (commandId: string) =>
      resolveCommand(commandId, state.catalog, state.selectedProgram);

    set({
      ...pushHistory(state),
      bindings: buildBindingsFromParsed(parsed, resolver),
      unassigned: buildUnassignedCommands(parsed, catalogRefs),
      metadata,
      sourceXml: xml,
      dirty: false,
    });
  },

  assignCommand({ key, slot, command, replaceExisting = true }) {
    const state = get();
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
    });
  },

  unassignCommand(key, slot) {
    const state = get();
    const bindings = cloneBindings(state.bindings);
    const command = bindings[key]?.[slot];
    if (!command) {
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
  },

  moveCommand(fromKey, fromSlot, toKey, toSlot) {
    const state = get();
    const command = state.bindings[fromKey]?.[fromSlot];
    if (!command) {
      return;
    }

    const bindings = cloneBindings(state.bindings);
    bindings[fromKey] ??= {};
    bindings[toKey] ??= {};

    const target = bindings[toKey][toSlot];
    delete bindings[fromKey][fromSlot];

    if (target) {
      bindings[fromKey][fromSlot] = target;
    }

    bindings[toKey][toSlot] = command;

    set({
      ...pushHistory(state),
      bindings,
      dirty: true,
    });
  },

  moveToPool(key, slot) {
    get().unassignCommand(key, slot);
  },

  assignFromPool(command, key, slot) {
    get().assignCommand({ key, slot, command, replaceExisting: true });
  },

  toggleModifier(slot, visible) {
    set((state) => ({
      modifierVisibility: { ...state.modifierVisibility, [slot]: visible },
    }));
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
    });
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
    });
  },

  exportXml(filename = 'keymap.xml') {
    const { bindings, metadata } = get();
    const xml = serializePycharmKeymap(bindings, metadata);
    downloadXml(filename, xml);
    set({ dirty: false, sourceXml: xml });
  },

  async saveProfile(name) {
    const state = get();
    const xml = serializePycharmKeymap(state.bindings, state.metadata);
    const profiles = await getSavedProfiles();
    const profile: SavedProfile = {
      id: crypto.randomUUID(),
      name,
      program: state.selectedProgram,
      xml,
      updatedAt: Date.now(),
    };
    await set(PROFILES_KEY, [...profiles, profile]);
    set({ dirty: false, sourceXml: xml });
    return profile;
  },

  async loadProfile(profile) {
    if (profile.program !== get().selectedProgram) {
      set({ selectedProgram: profile.program });
    }
    get().loadFromXml(profile.xml);
  },

  async deleteProfile(id) {
    const profiles = await getSavedProfiles();
    await set(
      PROFILES_KEY,
      profiles.filter((profile) => profile.id !== id),
    );
  },
}));

export async function getSavedProfiles(): Promise<SavedProfile[]> {
  return (await get<SavedProfile[]>(PROFILES_KEY)) ?? [];
}

export function bindKeymapStore() {
  let current = keymapStore.getState();
  const subscribers = new Set<(state: KeymapState & KeymapActions) => void>();

  keymapStore.subscribe((state) => {
    current = state;
    subscribers.forEach((listener) => listener(state));
  });

  return {
    subscribe(listener: (state: KeymapState & KeymapActions) => void) {
      subscribers.add(listener);
      listener(current);
      return () => subscribers.delete(listener);
    },
    getState: () => keymapStore.getState(),
  };
}

export const keymap = bindKeymapStore();
