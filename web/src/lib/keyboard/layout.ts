import type { CommandRef, KeyboardKey, KeyBindings, ModifierSlot, ParsedCommands } from '../types/keymap';
import { MODIFIER_SLOTS } from '../types/keymap';

const BUTTONS_FRONT = {
  rowF1: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '␛', '⎙', 'SLk', '⏸', 'N÷'],
  row12: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-_', '+=', '⌫', 'Ins', '🏠', 'P▲', 'N×'],
  rowQW: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[{', ']}', '\\|', '⌦', 'End', 'P▼', 'N-'],
  rowAS: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';:', '„ “', '⭾', '⏎', '⏘', '🡅', '', 'N+'],
  rowZX: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',<', '.>', '/?', '🖰 L', '🖰M', '🖰R', '🡄', '🡇', '🡆', 'N⏎'],
};

const BUTTONS_BACK = {
  rowF1: [
    'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
    'escape', 'print screen', 'scroll lock', 'pause', 'divide',
  ],
  row12: [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'minus', 'equals',
    'back_space', 'insert', 'home', 'page up', 'multiply',
  ],
  rowQW: [
    'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'open_bracket',
    'close_bracket', 'back_quote', 'delete', 'end', 'page down', 'subtract',
  ],
  rowAS: [
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'semicolon', 'apostrophe',
    'tab', 'enter', 'space', 'up', 'None3', 'add',
  ],
  rowZX: [
    'z', 'x', 'c', 'v', 'b', 'n', 'm', 'comma', 'period', 'slash',
    'button1', 'button2', 'button3', 'left', 'down', 'right', '',
  ],
};

function flattenRows(rows: Record<string, string[]>): string[] {
  return Object.values(rows).flat();
}

export function getCleanKeyboardKeys(): KeyboardKey[] {
  const back = flattenRows(BUTTONS_BACK);
  const front = flattenRows(BUTTONS_FRONT);

  return back
    .map((backName, index) => ({
      backName,
      frontName: front[index] ?? '',
      bindings: {},
    }))
    .filter((key) => key.frontName !== '');
}

export function buildBindingsFromParsed(
  parsed: ParsedCommands,
  resolveCommand: (commandId: string) => CommandRef,
): KeyBindings {
  const bindings: KeyBindings = {};

  for (const [commandId, shortcuts] of Object.entries(parsed)) {
    const command = resolveCommand(commandId);
    for (const [keyName, modifierCode] of Object.entries(shortcuts)) {
      const slots = modifierCode.split(',') as ModifierSlot[];
      for (const slot of slots) {
        if (!MODIFIER_SLOTS.includes(slot)) {
          continue;
        }
        bindings[keyName] ??= {};
        bindings[keyName][slot] = command;
      }
    }
  }

  return bindings;
}

export function buildUnassignedCommands(
  parsed: ParsedCommands,
  catalogCommands: CommandRef[],
): CommandRef[] {
  const assigned = new Set(Object.keys(parsed));
  return catalogCommands.filter((command) => !assigned.has(command.id));
}

export function mergeKeyboardWithBindings(
  bindings: KeyBindings,
): KeyboardKey[] {
  return getCleanKeyboardKeys().map((key) => ({
    ...key,
    bindings: bindings[key.backName] ?? {},
  }));
}
