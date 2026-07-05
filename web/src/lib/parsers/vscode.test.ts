import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseVsCodeKeymap } from './vscode';

describe('vscode parser', () => {
  it('parses simple keybindings array', () => {
    const json = JSON.stringify([
      { key: 'ctrl+shift+z', command: 'redo' },
      { key: 'z', command: 'type' },
    ]);
    const parsed = parseVsCodeKeymap(json);
    expect(parsed.commands.redo).toEqual({ z: 'cs' });
    expect(parsed.commands.type).toEqual({ z: 'push' });
  });
});
