import { describe, expect, it } from 'vitest';
import type { KeyBindings } from '../types/keymap';
import { buildVsCodeKeybindings, serializeVsCodeKeymap } from './vscode-serialize';
import { parseVsCodeKeymap } from './vscode';

function ref(id: string) {
  return { id, shortName: id };
}

describe('vscode serializer', () => {
  it('writes modifiers in VS Code order', () => {
    const bindings: KeyBindings = {
      p: { push: ref('a'), c: ref('b'), acs: ref('c'), as: ref('d') },
    };
    expect(buildVsCodeKeybindings(bindings)).toEqual([
      { key: 'p', command: 'a' },
      { key: 'ctrl+p', command: 'b' },
      { key: 'ctrl+shift+alt+p', command: 'c' },
      { key: 'shift+alt+p', command: 'd' },
    ]);
  });

  it('skips keys VS Code cannot express', () => {
    const bindings: KeyBindings = {
      button1: { push: ref('mouse') },
      None3: { push: ref('filler') },
      k: { c: ref('kept') },
    };
    expect(buildVsCodeKeybindings(bindings)).toEqual([{ key: 'ctrl+k', command: 'kept' }]);
  });

  it('round-trips special keys back to layout names', () => {
    const bindings: KeyBindings = {
      minus: { c: ref('zoomOut') },
      open_bracket: { cs: ref('outdent') },
      back_space: { a: ref('back') },
      'page up': { push: ref('up') },
      back_quote: { c: ref('terminal') },
      divide: { push: ref('slashPad') },
    };

    const json = serializeVsCodeKeymap(bindings);
    expect(json).toContain('"ctrl+-"');
    expect(json).toContain('"ctrl+shift+["');
    expect(json).toContain('"alt+backspace"');
    expect(json).toContain('"pageup"');
    expect(json).toContain('"numpad_divide"');

    expect(parseVsCodeKeymap(json).commands).toEqual({
      zoomOut: { minus: 'c' },
      outdent: { open_bracket: 'cs' },
      back: { back_space: 'a' },
      up: { 'page up': 'push' },
      terminal: { back_quote: 'c' },
      slashPad: { divide: 'push' },
    });
  });
});
