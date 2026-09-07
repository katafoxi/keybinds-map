import type { KeyBindings, KeymapMetadata, ModifierSlot } from '../types/keymap';

const MODIFIER_NAMES: Record<ModifierSlot, string[]> = {
  push: [],
  c: ['ctrl'],
  a: ['alt'],
  s: ['shift'],
  ac: ['alt', 'ctrl'],
  as: ['alt', 'shift'],
  cs: ['shift', 'ctrl'],
  acs: ['alt', 'shift', 'ctrl'],
};

const KEY_TO_PYCHARM: Record<string, string> = {
  back_space: 'BACK_SPACE',
  open_bracket: 'OPEN_BRACKET',
  close_bracket: 'CLOSE_BRACKET',
  back_quote: 'BACK_QUOTE',
  'page up': 'PAGE UP',
  'page down': 'PAGE DOWN',
  'print screen': 'PRINT SCREEN',
  'scroll lock': 'SCROLL LOCK',
  insert: 'INSERT',
  delete: 'DELETE',
  escape: 'ESCAPE',
  enter: 'ENTER',
  tab: 'TAB',
  space: 'SPACE',
  minus: 'MINUS',
  equals: 'EQUALS',
  semicolon: 'SEMICOLON',
  apostrophe: 'APOSTROPHE',
  comma: 'COMMA',
  period: 'PERIOD',
  slash: 'SLASH',
  divide: 'DIVIDE',
  multiply: 'MULTIPLY',
  subtract: 'SUBTRACT',
  add: 'ADD',
  button1: 'BUTTON1',
  button2: 'BUTTON2',
  button3: 'BUTTON3',
  left: 'LEFT',
  right: 'RIGHT',
  up: 'UP',
  down: 'DOWN',
  home: 'HOME',
  end: 'END',
  pause: 'PAUSE',
};

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function formatKeyName(key: string): string {
  if (KEY_TO_PYCHARM[key]) {
    return KEY_TO_PYCHARM[key];
  }
  if (key.length === 1) {
    return key.toUpperCase();
  }
  if (key.startsWith('f') && /^f\d+$/.test(key)) {
    return key.toUpperCase();
  }
  return key.toUpperCase();
}

function formatKeystroke(slot: ModifierSlot, key: string): string {
  const modifiers = MODIFIER_NAMES[slot];
  const formattedKey = formatKeyName(key);
  if (modifiers.length === 0) {
    return formattedKey;
  }
  return [...modifiers, formattedKey].join(' ');
}

export function serializePycharmKeymap(
  bindings: KeyBindings,
  metadata: KeymapMetadata,
): string {
  const commandShortcuts = new Map<string, Array<{ slot: ModifierSlot; key: string }>>();

  for (const [key, slots] of Object.entries(bindings)) {
    if (!key) {
      continue;
    }
    for (const [slot, command] of Object.entries(slots)) {
      if (!command) {
        continue;
      }
      const modifierSlot = slot as ModifierSlot;
      const list = commandShortcuts.get(command.id) ?? [];
      list.push({ slot: modifierSlot, key });
      commandShortcuts.set(command.id, list);
    }
  }

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<keymap version="${escapeXml(metadata.version)}" name="${escapeXml(metadata.name)}">`,
  ];

  for (const [commandId, shortcuts] of [...commandShortcuts.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push(`  <action id="${escapeXml(commandId)}">`);
    for (const { slot, key } of shortcuts) {
      lines.push(
        `    <keyboard-shortcut first-keystroke="${escapeXml(formatKeystroke(slot, key))}"/>`,
      );
    }
    lines.push('  </action>');
  }

  lines.push('</keymap>');
  return lines.join('\n');
}

export function downloadXml(filename: string, xml: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
