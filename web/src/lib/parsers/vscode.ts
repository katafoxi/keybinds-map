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
  return modifiersToCode(keystroke);
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
