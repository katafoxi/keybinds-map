import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modifiersToCode, parsePycharmKeymap } from './pycharm';
import { serializePycharmKeymap } from './pycharm-serialize';
import { buildBindingsFromParsed } from '../keyboard/layout';

const testXml = readFileSync(
  resolve(__dirname, '../../../../keymap/tests/test.xml'),
  'utf-8',
);

describe('pycharm parser', () => {
  it('parses test.xml like Django parser', () => {
    const parsed = parsePycharmKeymap(testXml);
    expect(parsed).toEqual({
      $Redo: { z: 'cs', back_space: 'as' },
    });
  });

  it('maps modifier strings to slot codes', () => {
    expect(modifiersToCode('shift ctrl z')).toEqual({ z: 'cs' });
    expect(modifiersToCode('z')).toEqual({ z: 'push' });
  });
});

describe('pycharm serializer', () => {
  it('round-trips single-keystroke bindings', () => {
    const parsed = parsePycharmKeymap(testXml);
    const bindings = buildBindingsFromParsed(parsed, (id) => ({
      id,
      shortName: id,
    }));
    const xml = serializePycharmKeymap(bindings, { version: '1', name: 'Empty' });
    const parsedAgain = parsePycharmKeymap(xml);
    expect(parsedAgain).toEqual(parsed);
  });
});
