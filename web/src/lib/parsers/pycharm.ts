import { XMLParser } from 'fast-xml-parser';
import type { KeymapMetadata, ParsedCommands } from '../types/keymap';

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
  return key.replace(/\s+/g, '_').toLowerCase();
}

export function parsePycharmKeymap(xml: string): ParsedCommands {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    allowBooleanAttributes: true,
  });

  const doc = parser.parse(xml);
  const root = doc.keymap;
  const actions = normalizeActions(root?.action);
  const commands: ParsedCommands = {};

  for (const action of actions) {
    const actionId = action.id;
    if (!actionId) {
      continue;
    }

    const shortcuts = normalizeShortcuts(action['keyboard-shortcut']);
    const parsedShortcuts: Record<string, string> = {};

    for (const shortcut of shortcuts) {
      if (Object.keys(shortcut).length !== 1) {
        continue;
      }

      const [attrName] = Object.keys(shortcut);
      const keystroke = shortcut[attrName];
      if (!keystroke || typeof keystroke !== 'string') {
        continue;
      }

      Object.assign(parsedShortcuts, modifiersToCode(keystroke));
    }

    if (Object.keys(parsedShortcuts).length > 0) {
      commands[actionId] = parsedShortcuts;
    }
  }

  return commands;
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
