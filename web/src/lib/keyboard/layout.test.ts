import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePycharmKeymap } from '../parsers/pycharm';
import {
  buildBindingsFromParsed,
  getCleanKeyboardKeys,
  mergeKeyboardWithBindings,
} from './layout';

const testXml = readFileSync(
  resolve(__dirname, '../../../../test-fixtures/test.xml'),
  'utf-8',
);

describe('keyboard layout', () => {
  it('keeps Z in the first column of the last row', () => {
    const keys = getCleanKeyboardKeys();
    const columns = 17;
    expect(keys).toHaveLength(columns * 5);
    expect(keys[columns * 4]).toMatchObject({ backName: 'z', frontName: 'Z' });
    expect(keys[columns * 4 - 2]).toMatchObject({ backName: 'None3', frontName: '' });
  });

  it('places parsed commands on modifier slots', () => {
    const parsed = parsePycharmKeymap(testXml);
    const bindings = buildBindingsFromParsed(parsed, (id) => ({
      id,
      shortName: id,
    }));

    expect(bindings.z?.cs?.id).toBe('$Redo');
    expect(bindings.back_space?.as?.id).toBe('$Redo');

    const grid = mergeKeyboardWithBindings(bindings);
    const zKey = grid.find((key) => key.backName === 'z');
    expect(zKey?.bindings.cs?.id).toBe('$Redo');
  });
});
