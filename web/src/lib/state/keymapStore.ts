import { createStore } from 'zustand/vanilla';
import type {
  CommandCatalogEntry,
  CommandRef,
  DraftState,
  KeyBindings,
  KeymapMetadata,
  PrintLayerMode,
  ProgramCatalog,
  SavedProfile,
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
import { serializePycharmKeymap, downloadXml } from '../parsers/pycharm-serialize';
import { get, set } from 'idb-keyval';

const PROFILES_KEY = 'keybinds-profiles';
const DRAFT_KEY = 'keybinds-draft';
const MAX_HISTORY = 20;
const AUTOSAVE_MS = 1500;

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

export type KeymapState = {
  selectedProgram: string;
  catalog: ProgramCatalog | null;
  bindings: KeyBindings;
  unassigned: CommandRef[];
  metadata: KeymapMetadata;
  sourceXml: string;
  dirty: boolean;
  importWarnings: string[];
  modifierVisibility: Record<string, boolean>;
  printLayerMode: PrintLayerMode;
  dropHighlight: string | null;
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

async function persistDraft(state: KeymapState): Promise<void> {
  if (!state.dirty || Object.keys(state.bindings).length === 0) {
    return;
  }
  const draft: DraftState = {
    selectedProgram: state.selectedProgram,
    bindings: cloneBindings(state.bindings),
    unassigned: structuredClone(state.unassigned),
    metadata: structuredClone(state.metadata),
    sourceXml: state.sourceXml,
    updatedAt: Date.now(),
  };
  await set(DRAFT_KEY, draft);
}

function scheduleAutosave(state: KeymapState): void {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  if (!state.dirty) {
    return;
  }
  autosaveTimer = setTimeout(() => {
    void persistDraft(get());
  }, AUTOSAVE_MS);
}

export type KeymapActions = {
  setCatalog: (catalog: ProgramCatalog) => void;
  selectProgram: (slug: string) => void;
  loadFromXml: (xml: string) => void;
  loadFromVsCode: (json: string) => void;
  restoreDraft: () => Promise<boolean>;
  clearDraft: () => Promise<void>;
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
  setDropHighlight: (slotId: string | null) => void;
  toggleModifier: (slot: string, visible: boolean) => void;
  setPrintLayerMode: (mode: PrintLayerMode) => void;
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
  importWarnings: [],
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
  printLayerMode: 'visible',
  dropHighlight: null,
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
      importWarnings: [],
      historyPast: [],
      historyFuture: [],
    });
  },

  loadFromXml(xml) {
    const state = get();
    const parsed = parsePycharmKeymapDetailed(xml);
    const metadata = parsePycharmMetadata(xml);
    const catalogRefs = catalogToRefs(state.catalog?.commands[state.selectedProgram]);
    const resolver = (commandId: string) =>
      resolveCommand(commandId, state.catalog, state.selectedProgram);

    const next = {
      ...pushHistory(state),
      bindings: buildBindingsFromParsed(parsed.commands, resolver),
      unassigned: buildUnassignedCommands(parsed.commands, catalogRefs),
      metadata,
      sourceXml: xml,
      dirty: false,
      importWarnings: parsed.warnings,
    };
    set(next);
    void persistDraft({ ...get(), ...next, dirty: false });
  },

  loadFromVsCode(json) {
    const state = get();
    const parsed = parseVsCodeKeymap(json);
    const catalogRefs = catalogToRefs(state.catalog?.commands.vscode);
    const resolver = (commandId: string) =>
      resolveCommand(commandId, state.catalog, 'vscode');

    const next = {
      ...pushHistory(state),
      selectedProgram: 'vscode',
      bindings: buildBindingsFromParsed(parsed.commands, resolver),
      unassigned: buildUnassignedCommands(parsed.commands, catalogRefs),
      metadata: { version: '1', name: 'VS Code' },
      sourceXml: json,
      dirty: false,
      importWarnings: parsed.warnings,
    };
    set(next);
  },

  async restoreDraft() {
    const draft = await get<DraftState>(DRAFT_KEY);
    if (!draft) {
      return false;
    }
    set({
      selectedProgram: draft.selectedProgram,
      bindings: draft.bindings,
      unassigned: draft.unassigned,
      metadata: draft.metadata,
      sourceXml: draft.sourceXml,
      dirty: true,
      importWarnings: [],
      historyPast: [],
      historyFuture: [],
    });
    return true;
  },

  async clearDraft() {
    await set(DRAFT_KEY, undefined);
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

    const next = {
      ...pushHistory(state),
      bindings,
      unassigned,
      dirty: true,
    };
    set(next);
    scheduleAutosave({ ...get(), ...next });
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

    const next = {
      ...pushHistory(state),
      bindings,
      unassigned,
      dirty: true,
    };
    set(next);
    scheduleAutosave({ ...get(), ...next });
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

    const next = {
      ...pushHistory(state),
      bindings,
      dirty: true,
      dropHighlight: null,
    };
    set(next);
    scheduleAutosave({ ...get(), ...next });
  },

  moveToPool(key, slot) {
    get().unassignCommand(key, slot);
  },

  assignFromPool(command, key, slot) {
    get().assignCommand({ key, slot, command, replaceExisting: true });
  },

  setDropHighlight(slotId) {
    set({ dropHighlight: slotId });
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
    });
    scheduleAutosave(get());
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
    scheduleAutosave(get());
  },

  exportXml(filename = 'keymap.xml') {
    const { bindings, metadata } = get();
    const xml = serializePycharmKeymap(bindings, metadata);
    downloadXml(filename, xml);
    set({ dirty: false, sourceXml: xml });
    void get().clearDraft();
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
    await get().clearDraft();
    return profile;
  },

  async loadProfile(profile) {
    if (profile.program === 'vscode') {
      get().loadFromVsCode(profile.xml);
      return;
    }
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
