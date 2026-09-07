import type {
  CommandCatalogEntry,
  CommandRef,
  KeyBindings,
  ProgramCatalog,
  VimBinding,
  VimExCommand,
  VimLayerDef,
  VimMode,
  VimOperatorDef,
  VimRecipe,
  VimSector,
  VimViewState,
} from '../types/keymap';
import { bundledCatalog } from '../catalog/bundledPrograms';
import {
  assignedCommandIds,
  parseVimKeymap,
  vimBindingsToKeyBindings,
} from '../parsers/vim';

export function catalogFor(state: { catalog: ProgramCatalog | null }): ProgramCatalog {
  return state.catalog ?? bundledCatalog;
}

export function resolveCommand(
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

export function catalogToRefs(entries: CommandCatalogEntry[] | undefined): CommandRef[] {
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

export const EMPTY_VIM = {
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

/** Minimal state shape needed to project Vim bindings onto the keyboard. */
export type VimDisplaySource = {
  catalog: ProgramCatalog | null;
  vimBindings: VimBinding[];
  vimMode: VimMode;
  vimView: VimViewState;
  modifierVisibility?: Record<string, boolean>;
};

export function vimDisplayLayer(view: VimViewState): string | null {
  return view.kind === 'prefix' ? view.layerId : null;
}

export function patchVimBinding(
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

export function buildVimDisplayState(
  state: VimDisplaySource,
  overrides: Partial<VimDisplaySource> = {},
): { bindings: KeyBindings; unassigned: CommandRef[] } {
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

export function applyVimToState(
  state: VimDisplaySource & { modifierVisibility: Record<string, boolean> },
  source: string,
  recipesRaw: string,
): Record<string, unknown> {
  const parsed = parseVimKeymap(source, recipesRaw);
  const catalog = catalogFor(state);
  const next = {
    selectedProgram: 'vim',
    catalog,
    metadata: { version: '1', name: 'Vim Default' },
    sourceXml: source,
    dirty: false,
    importWarnings: parsed.warnings,
    historyPast: [] as never[],
    historyFuture: [] as never[],
    vimMode: 'normal' as VimMode,
    vimBindings: parsed.vimBindings,
    vimLayers: parsed.layers,
    vimOperators: parsed.operators,
    vimExCommands: parsed.exCommands,
    vimRecipes: parsed.recipes,
    vimView: { kind: 'idle' } as VimViewState,
    activeSectors: [] as VimSector[],
    vimFlash: null as string | null,
    vimHighlightRoles: [] as string[],
    vimHighlightCommandIds: [] as string[],
    vimRecipeActiveId: null as string | null,
    vimRecipeStepIndex: 0,
    modifierVisibility: {
      ...state.modifierVisibility,
      push: true,
      s: true,
    },
  };
  return {
    ...next,
    ...buildVimDisplayState({ ...state, ...next }),
  };
}
