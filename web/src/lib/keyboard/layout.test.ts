import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePycharmKeymap } from '../parsers/pycharm';
import {
  buildBindingsFromParsed,
  mergeKeyboardWithBindings,
} from './layout';

const testXml = readFileSync(
  resolve(__dirname, '../../../../test-fixtures/test.xml'),
  'utf-8',
);

describe('keyboard layout', () => {
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
