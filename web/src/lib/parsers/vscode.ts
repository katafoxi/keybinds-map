import type { ParsedCommands } from '../types/keymap';
import { modifiersToCode } from './pycharm';

export type ParseVsCodeResult = {
  commands: ParsedCommands;
  warnings: string[];
};

const VSCODE_MODIFIER_MAP: Record<string, string> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  cmd: 'ctrl',
  command: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
  meta: 'alt',
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

function parseVsCodeKey(key: string): Record<string, string> | null {
  const parts = key.toLowerCase().split('+').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  const keyPart = parts.pop();
  if (!keyPart) {
    return null;
  }

  const modifiers = parts
    .map((part) => VSCODE_MODIFIER_MAP[part] ?? part)
    .filter((part) => ['ctrl', 'alt', 'shift'].includes(part));

  const keystroke =
    modifiers.length > 0 ? `${modifiers.join(' ')} ${keyPart}` : keyPart;
  const mapped = modifiersToCode(keystroke);
  const entry = Object.entries(mapped)[0];
  if (!entry) {
    return null;
  }
  const [parsedKey, code] = entry;
  return { [VSCODE_KEY_TO_LAYOUT[parsedKey] ?? parsedKey]: code };
}

export function parseVsCodeKeymap(json: string): ParseVsCodeResult {
  const warnings: string[] = [];
  const commands: ParsedCommands = {};

  let entries: Array<{ key?: string; command?: string }>;
  try {
    entries = JSON.parse(json);
  } catch {
    return { commands, warnings: ['Невалидный JSON keybindings'] };
  }

  if (!Array.isArray(entries)) {
    return { commands, warnings: ['Ожидается массив keybindings VS Code'] };
  }

  for (const entry of entries) {
    if (!entry.key || !entry.command) {
      continue;
    }
    if (entry.key.includes(' ')) {
      warnings.push(`Пропущен chord: ${entry.key}`);
      continue;
    }

    const mapped = parseVsCodeKey(entry.key);
    if (!mapped) {
      warnings.push(`Не удалось распознать key: ${entry.key}`);
      continue;
    }

    const commandId = entry.command;
    commands[commandId] ??= {};
    Object.assign(commands[commandId], mapped);
  }

  return { commands, warnings };
}
