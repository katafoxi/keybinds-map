import type { ParsedCommands } from '../types/keymap';
import { modifiersToCode } from './pycharm';

export type ParseBashResult = {
  commands: ParsedCommands;
  warnings: string[];
  skippedChords: number;
};

const CSI_LETTER_KEYS: Record<string, string> = {
  A: 'up',
  B: 'down',
  C: 'right',
  D: 'left',
  H: 'home',
  F: 'end',
  Z: 'tab',
};

const SS3_KEYS: Record<string, string> = {
  A: 'up',
  B: 'down',
  C: 'right',
  D: 'left',
  H: 'home',
  F: 'end',
  P: 'f1',
  Q: 'f2',
  R: 'f3',
  S: 'f4',
};

const TILDE_KEYS: Record<string, string> = {
  '1': 'home',
  '2': 'insert',
  '3': 'delete',
  '4': 'end',
  '5': 'page up',
  '6': 'page down',
  '7': 'home',
  '8': 'end',
  '11': 'f1',
  '12': 'f2',
  '13': 'f3',
  '14': 'f4',
  '15': 'f5',
  '17': 'f6',
  '18': 'f7',
  '19': 'f8',
  '20': 'f9',
  '21': 'f10',
  '23': 'f11',
  '24': 'f12',
};

const CSI_MODIFIER_SLOT: Record<number, string> = {
  1: 'push',
  2: 's',
  3: 'a',
  4: 'as',
  5: 'c',
  6: 'cs',
  7: 'ac',
  8: 'acs',
};

const NAMED_KEYS: Record<string, string> = {
  del: 'delete',
  delete: 'delete',
  esc: 'escape',
  escape: 'escape',
  lfd: 'enter',
  newline: 'enter',
  ret: 'enter',
  return: 'enter',
  rubout: 'back_space',
  space: 'space',
  spc: 'space',
  tab: 'tab',
};

const BASH_KEY_ALIASES: Record<string, string> = {
  '\\': 'back_quote',
  '|': 'back_quote',
  '-': 'minus',
  _: 'minus',
  '=': 'equals',
  '+': 'equals',
  '[': 'open_bracket',
  '{': 'open_bracket',
  ']': 'close_bracket',
  '}': 'close_bracket',
  ';': 'semicolon',
  ':': 'semicolon',
  "'": 'apostrophe',
  '"': 'apostrophe',
  ',': 'comma',
  '<': 'comma',
  '.': 'period',
  '>': 'period',
  '/': 'slash',
  '?': 'slash',
  '`': 'back_quote',
  '~': 'back_quote',
};

type DecodedKey = { key: string; slot: string };

export function parseBashKeymap(source: string): ParseBashResult {
  const commands: ParsedCommands = {};
  const warnings: string[] = [];
  let skippedChords = 0;
  let skipVi = false;

  const lines = source.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = stripComment(rawLine).trim();
    if (!line) {
      continue;
    }

    const directive = line.toLowerCase();
    if (directive.startsWith('$if ')) {
      skipVi = /\bmode\s*=\s*vi\b/.test(directive);
      continue;
    }
    if (directive === '$else') {
      skipVi = !skipVi;
      continue;
    }
    if (directive === '$endif') {
      skipVi = false;
      continue;
    }
    if (skipVi) {
      continue;
    }
    if (directive.startsWith('$include') || directive.startsWith('set ')) {
      continue;
    }

    const binding = parseBindingLine(line);
    if (!binding) {
      continue;
    }

    if (binding.kind === 'macro') {
      warnings.push(`Пропущена макро-привязка: ${binding.keyseq}`);
      continue;
    }

    const decoded = decodeKeyseq(binding.keyseq);
    if (decoded === 'chord') {
      skippedChords += 1;
      warnings.push(`Пропущен chord: ${binding.keyseq}`);
      continue;
    }
    if (!decoded) {
      warnings.push(`Не удалось распознать клавишу: ${binding.keyseq}`);
      continue;
    }

    const commandId = binding.command;
    commands[commandId] ??= {};
    const existing = commands[commandId][decoded.key];
    if (!existing) {
      commands[commandId][decoded.key] = decoded.slot;
    } else if (!existing.split(',').includes(decoded.slot)) {
      commands[commandId][decoded.key] = `${existing},${decoded.slot}`;
    }
  }

  return { commands, warnings, skippedChords };
}

function stripComment(line: string): string {
  let inQuotes = false;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\' && inQuotes) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === '#' && !inQuotes) {
      return line.slice(0, index);
    }
  }
  return line;
}

function parseBindingLine(
  line: string,
): { kind: 'command' | 'macro'; keyseq: string; command: string } | null {
  const quoted = line.match(/^"((?:\\.|[^"\\])*)"\s*:\s*(.+)$/);
  if (quoted) {
    const rhs = quoted[2].trim();
    if (rhs.startsWith('"')) {
      return { kind: 'macro', keyseq: quoted[1], command: rhs };
    }
    const command = rhs.replace(/^"|"$/g, '').trim();
    if (!command) {
      return null;
    }
    return { kind: 'command', keyseq: quoted[1], command };
  }

  const named = line.match(/^([A-Za-z][\w-]*)\s*:\s*([A-Za-z][\w-]*)$/);
  if (!named) {
    return null;
  }
  return { kind: 'command', keyseq: named[1], command: named[2] };
}

export function decodeKeyseq(keyseq: string): DecodedKey | 'chord' | null {
  const named = decodeNamedKey(keyseq);
  if (named) {
    return named;
  }

  const chars = unescapeReadline(keyseq);
  if (chars === null) {
    return null;
  }

  return decodeUnescaped(chars);
}

function decodeNamedKey(keyseq: string): DecodedKey | null {
  const lower = keyseq.toLowerCase();
  const named = NAMED_KEYS[lower];
  if (named) {
    return { key: named, slot: 'push' };
  }

  const combo = keyseq.match(/^(Control|Ctrl|Meta|Alt)-(.+)$/i);
  if (!combo) {
    return null;
  }
  const prefix = combo[1].toLowerCase();
  const rest = combo[2];
  const modifiers = prefix === 'meta' || prefix === 'alt' ? 'alt' : 'ctrl';
  const nested = rest.match(/^(Control|Ctrl|Meta|Alt)-(.+)$/i);
  if (nested) {
    const innerPrefix = nested[1].toLowerCase();
    const key = normalizeCharKey(nested[2]);
    if (!key) {
      return null;
    }
    const second = innerPrefix === 'meta' || innerPrefix === 'alt' ? 'alt' : 'ctrl';
    const mapped = modifiersToCode(`${[modifiers, second].join(' ')} ${key}`);
    const [mappedKey, slot] = Object.entries(mapped)[0] ?? [];
    return mappedKey && slot ? { key: mappedKey, slot } : null;
  }

  const key = normalizeCharKey(rest);
  if (!key) {
    return null;
  }
  const mapped = modifiersToCode(`${modifiers} ${key}`);
  const [mappedKey, slot] = Object.entries(mapped)[0] ?? [];
  return mappedKey && slot ? { key: mappedKey, slot } : null;
}

function unescapeReadline(keyseq: string): string[] | null {
  const chars: string[] = [];
  let index = 0;
  while (index < keyseq.length) {
    const char = keyseq[index];
    if (char !== '\\') {
      chars.push(char);
      index += 1;
      continue;
    }

    const next = keyseq[index + 1];
    if (!next) {
      return null;
    }

    if (next === 'C' && keyseq[index + 2] === '-') {
      const target = keyseq[index + 3];
      if (!target) {
        return null;
      }
      if (target === '?') {
        chars.push('\u007f');
        index += 4;
        continue;
      }
      if (target === 'm' || target === 'M') {
        chars.push('\r');
        index += 4;
        continue;
      }
      chars.push(`\u0000C${target}`);
      index += 4;
      continue;
    }
    if (next === 'M' && keyseq[index + 2] === '-') {
      chars.push('\u0000M');
      index += 3;
      continue;
    }
    if (next === 'e') {
      chars.push('\u001b');
      index += 2;
      continue;
    }
    if (next === 'd') {
      chars.push('\u007f');
      index += 2;
      continue;
    }
    if (next === 'b') {
      chars.push('\u0008');
      index += 2;
      continue;
    }
    if (next === 't') {
      chars.push('\t');
      index += 2;
      continue;
    }
    if (next === 'n' || next === 'r') {
      chars.push('\r');
      index += 2;
      continue;
    }
    if (next === 'a') {
      chars.push('\u0007');
      index += 2;
      continue;
    }
    if (next === '\\' || next === '"' || next === "'") {
      chars.push(next);
      index += 2;
      continue;
    }
    if (next === 'x' && /[0-9a-fA-F]{2}/.test(keyseq.slice(index + 2, index + 4))) {
      chars.push(String.fromCharCode(parseInt(keyseq.slice(index + 2, index + 4), 16)));
      index += 4;
      continue;
    }
    if (/[0-7]/.test(next)) {
      const octal = keyseq.slice(index + 1).match(/^([0-7]{1,3})/);
      if (!octal) {
        return null;
      }
      chars.push(String.fromCharCode(parseInt(octal[1], 8)));
      index += 1 + octal[1].length;
      continue;
    }

    chars.push(next);
    index += 2;
  }
  return chars;
}

function decodeUnescaped(chars: string[]): DecodedKey | 'chord' | null {
  let meta = false;
  let ctrl = false;
  let index = 0;

  while (index < chars.length) {
    const char = chars[index];
    if (char === '\u0000M') {
      meta = true;
      index += 1;
      continue;
    }
    if (char.startsWith('\u0000C')) {
      break;
    }
    if (char === '\u001b') {
      const rest = chars.slice(index + 1);
      if (rest[0] === '[' || rest[0] === 'O') {
        if (meta || ctrl || index !== 0) {
          return 'chord';
        }
        return decodeEscapeSequence(rest);
      }
      if (rest[0] === '\u0000M' || rest[0]?.startsWith('\u0000C') || rest.length === 1) {
        meta = true;
        index += 1;
        continue;
      }
      return 'chord';
    }
    break;
  }

  if (index >= chars.length) {
    if (meta && !ctrl) {
      return { key: 'escape', slot: 'push' };
    }
    return null;
  }

  const remaining = chars.slice(index);
  if (remaining.length === 1 && remaining[0] === '\u001b') {
    return { key: 'escape', slot: 'push' };
  }

  if (remaining[0]?.startsWith('\u0000C')) {
    ctrl = true;
    const target = remaining[0].slice(2);
    const restAfterCtrl = remaining.slice(1);
    if (restAfterCtrl.length > 0) {
      return 'chord';
    }
    return decodeChar(target, meta, true);
  }

  if (remaining.length !== 1) {
    return 'chord';
  }

  return decodeChar(remaining[0], meta, ctrl);
}

function decodeEscapeSequence(chars: string[]): DecodedKey | 'chord' | null {
  if (chars[0] === 'O' && chars[1] && SS3_KEYS[chars[1]]) {
    if (chars.length > 2) {
      return 'chord';
    }
    return { key: SS3_KEYS[chars[1]], slot: 'push' };
  }

  if (chars[0] !== '[') {
    return null;
  }

  const body = chars.slice(1).join('');
  const letterMatch = body.match(/^(\d*(?:;\d+)*)([A-Z])$/);
  if (letterMatch) {
    const key = CSI_LETTER_KEYS[letterMatch[2]];
    if (!key) {
      return null;
    }
    const slot = slotFromCsiParams(letterMatch[1], letterMatch[2] === 'Z');
    return { key, slot };
  }

  const tildeMatch = body.match(/^(\d+)(?:;(\d+))?~$/);
  if (tildeMatch) {
    const key = TILDE_KEYS[tildeMatch[1]];
    if (!key) {
      return null;
    }
    const modifier = tildeMatch[2] ? Number(tildeMatch[2]) : 1;
    return { key, slot: CSI_MODIFIER_SLOT[modifier] ?? 'push' };
  }

  return 'chord';
}

function slotFromCsiParams(params: string, shiftTab: boolean): string {
  if (!params) {
    return shiftTab ? 's' : 'push';
  }
  const parts = params.split(';').map(Number);
  const modifier = parts.length > 1 ? parts[1] : parts[0] >= 2 && parts[0] <= 8 ? parts[0] : 1;
  const slot = CSI_MODIFIER_SLOT[modifier] ?? 'push';
  if (shiftTab && slot === 'push') {
    return 's';
  }
  return slot;
}

const SHIFT_SYMBOLS: Record<string, string> = {
  '<': 'comma',
  '>': 'period',
  _: 'minus',
  '#': '3',
  '*': '8',
  '?': 'slash',
  '~': 'back_quote',
  '{': 'open_bracket',
  '}': 'close_bracket',
  '|': 'back_quote',
  '+': 'equals',
  ':': 'semicolon',
  '"': 'apostrophe',
};

function decodeChar(char: string, meta: boolean, ctrl: boolean): DecodedKey | null {
  if (char === '\t') {
    return composeDecoded('tab', meta, ctrl);
  }
  if (char === '\r' || char === '\n') {
    return composeDecoded('enter', meta, ctrl);
  }
  if (char === '\u0008') {
    return composeDecoded('back_space', meta, ctrl);
  }
  if (char === '\u007f') {
    return composeDecoded('back_space', meta, ctrl);
  }
  if (char === '\u0000' || char === '@') {
    return composeDecoded('space', meta, true);
  }
  if (char === ' ') {
    return composeDecoded('space', meta, ctrl);
  }

  if (char.length !== 1) {
    return null;
  }

  const code = char.charCodeAt(0);
  if (code < 32) {
    const letter = String.fromCharCode(code + 64).toLowerCase();
    return composeDecoded(normalizeCharKey(letter) ?? letter, meta, true);
  }

  const shifted = SHIFT_SYMBOLS[char];
  if (shifted) {
    return composeDecoded(shifted, meta, ctrl, true);
  }

  const key = normalizeCharKey(char);
  if (!key) {
    return null;
  }
  return composeDecoded(key, meta, ctrl);
}

function composeDecoded(
  key: string,
  meta: boolean,
  ctrl: boolean,
  shift = false,
): DecodedKey | null {
  const modifiers = [meta ? 'alt' : '', ctrl ? 'ctrl' : '', shift ? 'shift' : ''].filter(Boolean);
  const keystroke = modifiers.length > 0 ? `${modifiers.join(' ')} ${key}` : key;
  const mapped = modifiersToCode(keystroke);
  const [mappedKey, slot] = Object.entries(mapped)[0] ?? [];
  if (!mappedKey || !slot) {
    return null;
  }
  return { key: mappedKey, slot };
}

function normalizeCharKey(raw: string): string | null {
  if (!raw) {
    return null;
  }
  if (raw.length === 1) {
    const lower = raw.toLowerCase();
    if (BASH_KEY_ALIASES[raw] || BASH_KEY_ALIASES[lower]) {
      return BASH_KEY_ALIASES[raw] ?? BASH_KEY_ALIASES[lower];
    }
    if (/^[a-z0-9]$/.test(lower)) {
      return lower;
    }
    return BASH_KEY_ALIASES[lower] ?? lower;
  }
  return NAMED_KEYS[raw.toLowerCase()] ?? raw.toLowerCase();
}
