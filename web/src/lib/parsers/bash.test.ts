import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decodeKeyseq, parseBashKeymap } from './bash';
import { serializeBashInputrc } from './bash-serialize';
import { buildBindingsFromParsed } from '../keyboard/layout';

const fixtureRoot = resolve(__dirname, '../../../../test-fixtures');

describe('bash / readline parser', () => {
  it('maps emacs Control and Meta keyseqs', () => {
    expect(decodeKeyseq('\\C-a')).toEqual({ key: 'a', slot: 'c' });
    expect(decodeKeyseq('\\M-f')).toEqual({ key: 'f', slot: 'a' });
    expect(decodeKeyseq('\\M-\\C-h')).toEqual({ key: 'h', slot: 'ac' });
    expect(decodeKeyseq('\\C-m')).toEqual({ key: 'enter', slot: 'push' });
    expect(decodeKeyseq('\\C-@')).toEqual({ key: 'space', slot: 'c' });
    expect(decodeKeyseq('\\t')).toEqual({ key: 'tab', slot: 'push' });
    expect(decodeKeyseq('\\C-?')).toEqual({ key: 'back_space', slot: 'push' });
    expect(decodeKeyseq('Control-a')).toEqual({ key: 'a', slot: 'c' });
  });

  it('maps CSI arrows and modified arrows', () => {
    expect(decodeKeyseq('\\e[A')).toEqual({ key: 'up', slot: 'push' });
    expect(decodeKeyseq('\\e[3~')).toEqual({ key: 'delete', slot: 'push' });
    expect(decodeKeyseq('\\e[1;5C')).toEqual({ key: 'right', slot: 'c' });
    expect(decodeKeyseq('\\e[3;5~')).toEqual({ key: 'delete', slot: 'c' });
    expect(decodeKeyseq('\\e[Z')).toEqual({ key: 'tab', slot: 's' });
  });

  it('skips chords and macros', () => {
    const parsed = parseBashKeymap(`
"\\C-a": beginning-of-line
"\\C-x\\C-e": edit-and-execute-command
"\\C-t": "macro-text"
`);
    expect(parsed.commands['beginning-of-line']).toEqual({ a: 'c' });
    expect(parsed.commands['edit-and-execute-command']).toBeUndefined();
    expect(parsed.skippedChords).toBe(1);
    expect(parsed.warnings.some((warning) => warning.includes('chord'))).toBe(true);
    expect(parsed.warnings.some((warning) => warning.includes('макро'))).toBe(true);
  });

  it('skips vi-mode $if blocks', () => {
    const parsed = parseBashKeymap(`
$if mode=emacs
"\\C-a": beginning-of-line
$endif
$if mode=vi
"\\C-a": vi-movement-mode
$endif
`);
    expect(parsed.commands['beginning-of-line']).toEqual({ a: 'c' });
    expect(parsed.commands['vi-movement-mode']).toBeUndefined();
  });

  it('parses default emacs fixture', () => {
    const source = readFileSync(resolve(fixtureRoot, 'bash-emacs.inputrc'), 'utf-8');
    const parsed = parseBashKeymap(source);
    expect(parsed.commands['beginning-of-line']).toMatchObject({ a: 'c', home: 'push' });
    expect(parsed.commands['forward-word']).toMatchObject({ f: 'a', right: 'c' });
    expect(parsed.commands['complete']).toEqual({ tab: 'push' });
    expect(parsed.commands['accept-line']).toMatchObject({ enter: 'push', j: 'c' });
    expect(parsed.commands['set-mark']).toEqual({ space: 'c,a' });
    expect(parsed.commands['abort']).toMatchObject({ g: 'c,ac' });
    expect(parsed.commands['digit-argument']).toMatchObject({ '1': 'a', minus: 'a' });
    expect(parsed.commands['quoted-insert']).toMatchObject({ q: 'c', v: 'c' });
    expect(parsed.skippedChords).toBe(0);
  });
});

describe('bash serializer', () => {
  it('round-trips single-keystroke emacs bindings', () => {
    const source = `"\\C-a": beginning-of-line\n"\\M-f": forward-word\n"\\e[1;5C": forward-word\n`;
    const parsed = parseBashKeymap(source);
    const bindings = buildBindingsFromParsed(parsed.commands, (id) => ({
      id,
      shortName: id,
    }));
    const serialized = serializeBashInputrc(bindings);
    const parsedAgain = parseBashKeymap(serialized);
    expect(parsedAgain.commands).toEqual(parsed.commands);
  });
});
