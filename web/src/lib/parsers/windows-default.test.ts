import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePycharmKeymapDetailed } from './pycharm';
import {
  buildBindingsFromParsed,
  getCleanKeyboardKeys,
  mergeKeyboardWithBindings,
} from '../keyboard/layout';

const xml = readFileSync(
  resolve(__dirname, '../../../../test-fixtures/Windows.xml'),
  'utf-8',
);

describe('Windows default keymap', () => {
  it('maps shortcuts onto the keyboard grid', () => {
    const parsed = parsePycharmKeymapDetailed(xml);
    const bindings = buildBindingsFromParsed(parsed.commands, (id) => ({
      id,
      shortName: id,
    }));
    const layoutKeys = new Set(getCleanKeyboardKeys().map((key) => key.backName));
    const bindingKeys = Object.keys(bindings);
    const onGrid = bindingKeys.filter((key) => layoutKeys.has(key));

    expect(Object.keys(parsed.commands).length).toBeGreaterThan(100);
    expect(onGrid.length).toBeGreaterThan(50);
    expect(bindings['page up']).toBeDefined();

    const grid = mergeKeyboardWithBindings(bindings);
    const withBindings = grid.filter((key) => Object.keys(key.bindings).length > 0);
    expect(withBindings.length).toBeGreaterThan(50);
  });
});
