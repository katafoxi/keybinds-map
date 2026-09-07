import type { ParsedCommands } from '../types/keymap';
import { modifiersToCode } from './pycharm';

export type ParseVsCodeResult = {
  commands: ParsedCommands;
  warnings: string[];
};

/** Modifiers we can represent on the visual keyboard. */
const SUPPORTED_MODIFIERS = new Set(['ctrl', 'alt', 'shift']);

/** Win/Super — not Alt; bindings that need them are skipped. */
const UNSUPPORTED_MODIFIERS = new Set(['meta', 'win', 'super']);

const VSCODE_MODIFIER_MAP: Record<string, string> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  cmd: 'ctrl',
  command: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
};

/**
 * Canonical layout backName → VS Code user-settings key token.
 * Keys absent here are identical in both notations (letters, digits, f1..f12,
 * arrows, enter, tab, space, escape, insert, delete, home, end).
 * Mouse buttons and `None3` have no VS Code counterpart and are not listed.
 */
export const LAYOUT_TO_VSCODE_KEY: Record<string, string> = {
  minus: '-',
  equals: '=',
  open_bracket: '[',
  close_bracket: ']',
  back_quote: '`',
  semicolon: ';',
  apostrophe: "'",
  comma: ',',
  period: '.',
  slash: '/',
  back_space: 'backspace',
  'page up': 'pageup',
  'page down': 'pagedown',
  'scroll lock': 'scrolllock',
  pause: 'pausebreak',
  divide: 'numpad_divide',
  multiply: 'numpad_multiply',
  subtract: 'numpad_subtract',
  add: 'numpad_add',
};

const VSCODE_KEY_TO_LAYOUT: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(LAYOUT_TO_VSCODE_KEY).map(([layout, vscode]) => [vscode, layout]),
  ),
  // Accepted on import only; serialization uses the canonical token above.
  backquote: 'back_quote',
  pause: 'pause',
  scroll_lock: 'scroll lock',
  numpad_decimal: 'period',
};

type VsCodeEntry = {
  key?: string;
  command?: string;
  when?: string;
};

/**
 * Strip line (`//`) and block comments outside strings, then trailing commas
 * before `]` / `}`. Enough for VS Code keybindings.json without a JSONC dep.
 */
export function parseJsonc(text: string): unknown {
  let result = '';
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < text.length) {
    const ch = text[i];

    if (inString) {
      result += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += ch;
      i += 1;
      continue;
    }

    if (ch === '/' && text[i + 1] === '/') {
      i += 2;
      while (i < text.length && text[i] !== '\n') {
        i += 1;
      }
      continue;
    }

    if (ch === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        i += 1;
      }
      i += 2;
      continue;
    }

    result += ch;
    i += 1;
  }

  const withoutTrailingCommas = result.replace(/,(\s*[\]}])/g, '$1');
  return JSON.parse(withoutTrailingCommas);
}

type ParsedKey =
  | { ok: true; mapped: Record<string, string> }
  | { ok: false; reason: 'unsupported-modifier' | 'unrecognized' };

function parseVsCodeKey(key: string): ParsedKey {
  const parts = key.toLowerCase().split('+').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { ok: false, reason: 'unrecognized' };
  }

  const keyPart = parts.pop();
  if (!keyPart) {
    return { ok: false, reason: 'unrecognized' };
  }

  const rawMods = parts;
  if (rawMods.some((part) => UNSUPPORTED_MODIFIERS.has(part))) {
    return { ok: false, reason: 'unsupported-modifier' };
  }

  const modifiers = rawMods
    .map((part) => VSCODE_MODIFIER_MAP[part] ?? part)
    .filter((part) => SUPPORTED_MODIFIERS.has(part));

  // Unknown tokens left after mapping (not ctrl/alt/shift and not known aliases).
  if (
    rawMods.some((part) => {
      const mapped = VSCODE_MODIFIER_MAP[part] ?? part;
      return !SUPPORTED_MODIFIERS.has(mapped);
    })
  ) {
    return { ok: false, reason: 'unrecognized' };
  }

  const keystroke =
    modifiers.length > 0 ? `${modifiers.join(' ')} ${keyPart}` : keyPart;
  const mapped = modifiersToCode(keystroke);
  const entry = Object.entries(mapped)[0];
  if (!entry) {
    return { ok: false, reason: 'unrecognized' };
  }
  const [parsedKey, code] = entry;
  return {
    ok: true,
    mapped: { [VSCODE_KEY_TO_LAYOUT[parsedKey] ?? parsedKey]: code },
  };
}

export function parseVsCodeKeymap(json: string): ParseVsCodeResult {
  const warnings: string[] = [];
  const commands: ParsedCommands = {};
  let skippedRemovals = 0;
  let ignoredWhen = 0;
  let skippedMeta = 0;

  let entries: VsCodeEntry[];
  try {
    const parsed = parseJsonc(json);
    if (!Array.isArray(parsed)) {
      return { commands, warnings: ['Ожидается массив keybindings VS Code'] };
    }
    entries = parsed as VsCodeEntry[];
  } catch {
    return { commands, warnings: ['Невалидный JSON keybindings'] };
  }

  for (const entry of entries) {
    if (!entry.key || !entry.command) {
      continue;
    }
    if (entry.command.startsWith('-')) {
      skippedRemovals += 1;
      continue;
    }
    if (entry.when) {
      ignoredWhen += 1;
    }
    if (entry.key.includes(' ')) {
      warnings.push(`Пропущен chord: ${entry.key}`);
      continue;
    }

    const parsedKey = parseVsCodeKey(entry.key);
    if (!parsedKey.ok) {
      if (parsedKey.reason === 'unsupported-modifier') {
        skippedMeta += 1;
      } else {
        warnings.push(`Не удалось распознать key: ${entry.key}`);
      }
      continue;
    }

    const commandId = entry.command;
    commands[commandId] ??= {};
    Object.assign(commands[commandId], parsedKey.mapped);
  }

  if (skippedRemovals > 0) {
    warnings.push(`Пропущено removal: ${skippedRemovals}`);
  }
  if (ignoredWhen > 0) {
    warnings.push(`Проигнорировано when: ${ignoredWhen}`);
  }
  if (skippedMeta > 0) {
    warnings.push(`Пропущено meta/win/super: ${skippedMeta}`);
  }

  return { commands, warnings };
}
