import type { KeyBindings, ModifierSlot } from '../types/keymap';
import { LAYOUT_TO_VSCODE_KEY } from './vscode';

/** VS Code writes modifiers in a fixed ctrl → shift → alt order. */
const MODIFIER_NAMES: Record<ModifierSlot, string[]> = {
  push: [],
  c: ['ctrl'],
  a: ['alt'],
  s: ['shift'],
  ac: ['ctrl', 'alt'],
  as: ['shift', 'alt'],
  cs: ['ctrl', 'shift'],
  acs: ['ctrl', 'shift', 'alt'],
};

/** Layout slots with no VS Code counterpart. */
const UNSUPPORTED_KEYS = new Set(['button1', 'button2', 'button3', 'None3', 'print screen']);

export type VsCodeKeybinding = {
  key: string;
  command: string;
};

function formatKey(slot: ModifierSlot, keyName: string): string | null {
  if (!keyName || UNSUPPORTED_KEYS.has(keyName)) {
    return null;
  }
  const key = LAYOUT_TO_VSCODE_KEY[keyName] ?? keyName;
  return [...MODIFIER_NAMES[slot], key].join('+');
}

export function buildVsCodeKeybindings(bindings: KeyBindings): VsCodeKeybinding[] {
  const entries: VsCodeKeybinding[] = [];

  for (const [keyName, slots] of Object.entries(bindings)) {
    for (const [slot, command] of Object.entries(slots ?? {})) {
      if (!command) {
        continue;
      }
      const key = formatKey(slot as ModifierSlot, keyName);
      if (!key) {
        continue;
      }
      entries.push({ key, command: command.id });
    }
  }

  return entries.sort(
    (a, b) => a.command.localeCompare(b.command) || a.key.localeCompare(b.key),
  );
}

export function serializeVsCodeKeymap(bindings: KeyBindings): string {
  return JSON.stringify(buildVsCodeKeybindings(bindings), null, 2);
}

export function downloadVsCodeKeymap(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
