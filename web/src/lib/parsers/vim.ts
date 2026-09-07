import type {
  ModifierSlot,
  ParsedCommands,
  VimBinding,
  VimExCommand,
  VimLayerDef,
  VimMode,
  VimOperatorDef,
  VimRecipe,
  VimRole,
  VimSector,
} from '../types/keymap';
import { MODIFIER_SLOTS, VIM_MODES, VIM_ROLES, VIM_SECTORS } from '../types/keymap';

export type VimCommandCatalogRaw = {
  id: string;
  short_name: string;
  icon?: string;
  sector?: string;
  roles?: string[];
  modes?: string[];
  descriptions?: Record<string, string>;
};

export type VimBindingRaw = {
  commandId: string;
  mode: string;
  key: string;
  slot: string;
  layer?: string | null;
};

export type VimDefaultDocument = {
  program: {
    slug: string;
    title: string;
    icon: string;
    site: string;
    settings_file_info?: string;
    is_bounded?: boolean;
  };
  commands: VimCommandCatalogRaw[];
  bindings: VimBindingRaw[];
  layers?: Array<{
    id: string;
    triggerCommandId: string;
    mode: string;
    key: string;
    slot: string;
  }>;
  operators?: Array<{
    commandId: string;
    doubledCommandId?: string;
    accepts: string[];
  }>;
  exCommands?: Array<{
    id: string;
    short_name: string;
    sector?: string;
    descriptions?: Record<string, string>;
  }>;
};

export type ParseVimResult = {
  commands: ParsedCommands;
  vimBindings: VimBinding[];
  layers: VimLayerDef[];
  operators: VimOperatorDef[];
  exCommands: VimExCommand[];
  recipes: VimRecipe[];
  warnings: string[];
};

const SLOT_SET = new Set<string>(MODIFIER_SLOTS);
const MODE_SET = new Set<string>(VIM_MODES);
const SECTOR_SET = new Set<string>(VIM_SECTORS);
const ROLE_SET = new Set<string>(VIM_ROLES);

export function parseVimSector(value: string | undefined): VimSector | undefined {
  if (!value) {
    return undefined;
  }
  return SECTOR_SET.has(value) ? (value as VimSector) : undefined;
}

export function parseVimRoles(values: string[] | undefined): VimRole[] | undefined {
  if (!values?.length) {
    return undefined;
  }
  const roles = values.filter((role): role is VimRole => ROLE_SET.has(role));
  return roles.length ? roles : undefined;
}

export function parseVimModes(values: string[] | undefined): VimMode[] | undefined {
  if (!values?.length) {
    return undefined;
  }
  const modes = values.filter((mode): mode is VimMode => MODE_SET.has(mode));
  return modes.length ? modes : undefined;
}

export function parseVimKeymap(source: string, recipesSource?: string): ParseVimResult {
  const warnings: string[] = [];
  let doc: VimDefaultDocument;

  try {
    doc = JSON.parse(source) as VimDefaultDocument;
  } catch {
    return {
      commands: {},
      vimBindings: [],
      layers: [],
      operators: [],
      exCommands: [],
      recipes: [],
      warnings: ['Не удалось разобрать Vim JSON'],
    };
  }

  const vimBindings: VimBinding[] = [];
  const parsed: ParsedCommands = {};

  for (const raw of doc.bindings ?? []) {
    if (!MODE_SET.has(raw.mode)) {
      warnings.push(`Неизвестный режим: ${raw.mode}`);
      continue;
    }
    if (!SLOT_SET.has(raw.slot)) {
      warnings.push(`Неизвестный слот: ${raw.slot} (${raw.commandId})`);
      continue;
    }
    if (!raw.key) {
      warnings.push(`Пустая клавиша для ${raw.commandId}`);
      continue;
    }

    const binding: VimBinding = {
      commandId: raw.commandId,
      mode: raw.mode as VimMode,
      keyName: raw.key,
      slot: raw.slot as ModifierSlot,
      layer: raw.layer ?? null,
    };
    vimBindings.push(binding);

    // Flat IR for Normal root only (delivery 0+1 grid / IDE-compatible path).
    if (binding.mode === 'normal' && !binding.layer) {
      parsed[binding.commandId] ??= {};
      parsed[binding.commandId][binding.keyName] = binding.slot;
    }
  }

  const layers: VimLayerDef[] = [];
  for (const raw of doc.layers ?? []) {
    if (!MODE_SET.has(raw.mode) || !SLOT_SET.has(raw.slot)) {
      warnings.push(`Пропущен слой ${raw.id}`);
      continue;
    }
    layers.push({
      id: raw.id,
      triggerCommandId: raw.triggerCommandId,
      mode: raw.mode as VimMode,
      keyName: raw.key,
      slot: raw.slot as ModifierSlot,
    });
  }

  const operators: VimOperatorDef[] = [];
  for (const raw of doc.operators ?? []) {
    const accepts = (raw.accepts ?? []).filter(
      (item): item is 'motion' | 'textobject' =>
        item === 'motion' || item === 'textobject',
    );
    if (!accepts.length) {
      warnings.push(`Оператор без accepts: ${raw.commandId}`);
      continue;
    }
    operators.push({
      commandId: raw.commandId,
      doubledCommandId: raw.doubledCommandId,
      accepts,
    });
  }

  const exCommands: VimExCommand[] = (doc.exCommands ?? []).map((entry) => ({
    id: entry.id,
    shortName: entry.short_name,
    sector: parseVimSector(entry.sector),
    descriptions: entry.descriptions,
  }));

  let recipes: VimRecipe[] = [];
  if (recipesSource) {
    try {
      const recipesDoc = JSON.parse(recipesSource) as { recipes?: VimRecipe[] };
      recipes = recipesDoc.recipes ?? [];
    } catch {
      warnings.push('Не удалось разобрать vim-recipes.json');
    }
  }

  return {
    commands: parsed,
    vimBindings,
    layers,
    operators,
    exCommands,
    recipes,
    warnings,
  };
}

/** Build display KeyBindings for a mode + optional prefix layer. */
export function vimBindingsToKeyBindings(
  vimBindings: VimBinding[],
  mode: VimMode,
  layer: string | null | undefined,
  resolveCommand: (commandId: string) => import('../types/keymap').CommandRef,
): import('../types/keymap').KeyBindings {
  const bindings: import('../types/keymap').KeyBindings = {};
  const layerId = layer ?? null;

  for (const binding of vimBindings) {
    if (binding.mode !== mode) {
      continue;
    }
    const bindingLayer = binding.layer ?? null;
    if (bindingLayer !== layerId) {
      continue;
    }
    bindings[binding.keyName] ??= {};
    bindings[binding.keyName][binding.slot] = resolveCommand(binding.commandId);
  }

  return bindings;
}

export function assignedCommandIds(
  vimBindings: VimBinding[],
  mode?: VimMode,
): Set<string> {
  const ids = new Set<string>();
  for (const binding of vimBindings) {
    if (mode && binding.mode !== mode) {
      continue;
    }
    ids.add(binding.commandId);
  }
  return ids;
}
