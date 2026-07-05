import { XMLParser } from 'fast-xml-parser';
import type { KeymapMetadata, ParsedCommands } from '../types/keymap';

export type ParsePycharmResult = {
  commands: ParsedCommands;
  warnings: string[];
  skippedChords: number;
  skippedMouse: number;
};

export function modifiersToCode(modifiersWithKey: string): Record<string, string> {
  const parts = modifiersWithKey.trim().toLowerCase().split(/\s+/);
  const key = parts.pop();
  if (!key) {
    return {};
  }

  const modifiers = parts;
  let code: string;
  if (modifiers.length > 0) {
    code = modifiers
      .slice()
      .sort()
      .map((modifier) => modifier[0])
      .join('');
  } else {
    code = 'push';
  }

  return { [normalizeKeyName(key)]: code };
}

function normalizeKeyName(key: string): string {
  const normalized = key.replace(/\s+/g, '_').toLowerCase();
  return PYCHARM_KEY_ALIASES[normalized] ?? normalized;
}

/** PyCharm XML key tokens → keyboard layout backName (see layout.ts BUTTONS_BACK). */
const PYCHARM_KEY_ALIASES: Record<string, string> = {
  page_up: 'page up',
  page_down: 'page down',
  print_screen: 'print screen',
  scroll_lock: 'scroll lock',
  none3: 'None3',
};

export function parsePycharmKeymap(xml: string): ParsedCommands {
  return parsePycharmKeymapDetailed(xml).commands;
}

export function parsePycharmKeymapDetailed(xml: string): ParsePycharmResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    allowBooleanAttributes: true,
  });

  const doc = parser.parse(xml);
  const root = doc.keymap;
  const actions = normalizeActions(root?.action);
  const commands: ParsedCommands = {};
  const warnings: string[] = [];
  let skippedChords = 0;
  let skippedMouse = 0;

  for (const action of actions) {
    const actionId = action.id;
    if (!actionId || typeof actionId !== 'string') {
      continue;
    }

    const mouseShortcuts = normalizeShortcuts(action['mouse-shortcut']);
    skippedMouse += mouseShortcuts.length;

    const shortcuts = normalizeShortcuts(action['keyboard-shortcut']);
    const parsedShortcuts: Record<string, string> = {};

    for (const shortcut of shortcuts) {
      const keystroke = shortcut['first-keystroke'];
      if (typeof keystroke !== 'string' || !keystroke.trim()) {
        continue;
      }
      if (shortcut['second-keystroke']) {
        skippedChords += 1;
      }

      const mapped = modifiersToCode(keystroke);
      const keyName = Object.keys(mapped)[0];
      if (keyName && !isKnownKeyName(keyName)) {
        warnings.push(`Unknown key "${keyName}" for action ${actionId}`);
      }
      Object.assign(parsedShortcuts, mapped);
    }

    if (Object.keys(parsedShortcuts).length > 0) {
      commands[actionId] = parsedShortcuts;
    }
  }

  if (skippedChords > 0) {
    warnings.push(`Пропущено chord-shortcut (second-keystroke): ${skippedChords}`);
  }
  if (skippedMouse > 0) {
    warnings.push(`Пропущено mouse-shortcut: ${skippedMouse}`);
  }

  return { commands, warnings, skippedChords, skippedMouse };
}

const KNOWN_KEY_PATTERN =
  /^([a-z0-9_ ]+|f\d+|page up|page down|print screen|scroll lock|back_space|open_bracket|close_bracket|back_quote|button[123]|None3)$/;

function isKnownKeyName(key: string): boolean {
  return KNOWN_KEY_PATTERN.test(key) || key.length === 1;
}

export function parsePycharmMetadata(xml: string): KeymapMetadata {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });
  const doc = parser.parse(xml);
  const root = doc.keymap ?? {};
  return {
    version: String(root.version ?? '1'),
    name: String(root.name ?? 'Custom'),
  };
}

function normalizeActions(action: unknown): Array<Record<string, unknown>> {
  if (!action) {
    return [];
  }
  return Array.isArray(action) ? action : [action as Record<string, unknown>];
}

function normalizeShortcuts(shortcut: unknown): Array<Record<string, string>> {
  if (!shortcut) {
    return [];
  }
  const list = Array.isArray(shortcut) ? shortcut : [shortcut];
  return list.filter(Boolean) as Array<Record<string, string>>;
}
