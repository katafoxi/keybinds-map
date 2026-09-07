import { describe, expect, it } from 'vitest';
import { parseJsonc, parseVsCodeKeymap } from './vscode';

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

  it('parses JSONC with comments and trailing commas', () => {
    const source = `// Place your key bindings in this file to override the defaults
[
  {
    "key": "ctrl+k",
    "command": "workbench.action.showCommands", // palette
  },
  /* block comment */
  {
    "key": "alt+left",
    "command": "workbench.action.navigateBack",
  },
]
`;
    expect(Array.isArray(parseJsonc(source))).toBe(true);
    const parsed = parseVsCodeKeymap(source);
    expect(parsed.commands['workbench.action.showCommands']).toEqual({ k: 'c' });
    expect(parsed.commands['workbench.action.navigateBack']).toEqual({ left: 'a' });
    expect(parsed.warnings).toEqual([]);
  });

  it('skips removals and warns about when / meta', () => {
    const json = JSON.stringify([
      { key: 'ctrl+c', command: '-editor.action.clipboardCopyAction' },
      { key: 'ctrl+s', command: 'workbench.action.files.save', when: 'editorTextFocus' },
      { key: 'meta+c', command: 'editor.action.clipboardCopyAction' },
      { key: 'win+e', command: 'explorer.newFile' },
      { key: 'ctrl+k', command: 'workbench.action.showCommands' },
    ]);
    const parsed = parseVsCodeKeymap(json);
    expect(parsed.commands).toEqual({
      'workbench.action.files.save': { s: 'c' },
      'workbench.action.showCommands': { k: 'c' },
    });
    expect(parsed.warnings).toEqual([
      'Пропущено removal: 1',
      'Проигнорировано when: 1',
      'Пропущено meta/win/super: 2',
    ]);
  });

  it('still maps cmd to ctrl', () => {
    const parsed = parseVsCodeKeymap(
      JSON.stringify([{ key: 'cmd+shift+p', command: 'workbench.action.showCommands' }]),
    );
    expect(parsed.commands['workbench.action.showCommands']).toEqual({ p: 'cs' });
    expect(parsed.warnings).toEqual([]);
  });
});
