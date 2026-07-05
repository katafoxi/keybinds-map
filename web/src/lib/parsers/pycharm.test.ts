import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modifiersToCode, parsePycharmKeymap, parsePycharmKeymapDetailed } from './pycharm';
import { serializePycharmKeymap } from './pycharm-serialize';
import { buildBindingsFromParsed } from '../keyboard/layout';

const fixtureRoot = resolve(__dirname, '../../../../test-fixtures');

const testXml = readFileSync(resolve(fixtureRoot, 'test.xml'), 'utf-8');

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

  it('reports skipped chords and mouse shortcuts from Empty-like xml', () => {
    const xml = readFileSync(
      resolve(__dirname, '../../../../media/pycharm_setting_files/1/Empty.xml'),
      'utf-8',
    );
    const result = parsePycharmKeymapDetailed(xml);
    expect(result.skippedChords).toBeGreaterThan(0);
    expect(result.skippedMouse).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('chord'))).toBe(true);
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

describe('pycharm parser BFR fixture', () => {
  it('parses BFR.xml without throwing and returns commands', () => {
    const bfrPath = resolve(fixtureRoot, 'BFR.xml');
    const xml = readFileSync(bfrPath, 'utf-8');
    const result = parsePycharmKeymapDetailed(xml);
    expect(Object.keys(result.commands).length).toBeGreaterThan(10);
    expect(result.warnings.some((w) => w.includes('chord'))).toBe(true);
  });
});
