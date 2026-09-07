import { beforeEach, describe, expect, it } from 'vitest';
import defaultPycharmXml from '@fixtures/Windows.xml?raw';
import { keymapStore } from './keymapStore';
import { bundledCatalog } from '../catalog/bundledPrograms';

describe('keymapStore standard profile', () => {
  beforeEach(() => {
    keymapStore.setState({
      catalog: bundledCatalog,
      bindings: {},
      unassigned: [],
      selectedProgram: 'pycharm',
      activeProfileId: 'standard',
      dirty: false,
      sourceXml: '',
      importWarnings: [],
      historyPast: [],
      historyFuture: [],
    });
  });

  it('loads Windows.xml with bindings and command icons from catalog', () => {
    keymapStore.getState().loadFromXml(defaultPycharmXml);

    const state = keymapStore.getState();
    expect(Object.keys(state.bindings).length).toBeGreaterThan(50);
    expect(state.bindings['c']?.c?.id).toBeDefined();
    expect(state.bindings['c']?.c?.icon).toMatch(/^icons\/pycharm\//);
  });

  it('loads bash emacs defaults with catalog command icons', async () => {
    await keymapStore.getState().selectProgram('bash');

    const state = keymapStore.getState();
    expect(state.selectedProgram).toBe('bash');
    expect(state.bindings['a']?.c?.id).toBe('beginning-of-line');
    expect(state.bindings['a']?.c?.icon).toMatch(/^icons\/bash\//);
    expect(state.bindings['tab']?.push?.id).toBe('complete');
    expect(state.bindings['a']?.c?.descriptions?.ru).toMatch(/начало/i);
    expect(state.unassigned.some((command) => command.id === 'edit-and-execute-command')).toBe(
      true,
    );
  });

  it('loads vim defaults with normal-mode plain keys and sectors', async () => {
    await keymapStore.getState().selectProgram('vim');

    const state = keymapStore.getState();
    expect(state.selectedProgram).toBe('vim');
    expect(state.vimMode).toBe('normal');
    expect(state.modifierVisibility.push).toBe(true);
    expect(state.modifierVisibility.s).toBe(true);
    expect(state.bindings['h']?.push?.id).toBe('vim-h');
    expect(state.bindings['h']?.push?.sector).toBe('motion');
    expect(state.bindings['g']?.s?.id).toBe('vim-G');
    expect(state.bindings['d']?.push?.roles).toContain('operator');
    expect(state.vimLayers.some((layer) => layer.id === 'g')).toBe(true);
    expect(state.vimRecipes.length).toBeGreaterThan(5);

    const { isBoundedSlot } = await import('../keyboard/bindingPolicy');
    expect(isBoundedSlot(state.catalog, 'vim', 'h', 'push', 'normal')).toBe(false);
    expect(isBoundedSlot(state.catalog, 'vim', 'h', 's', 'normal')).toBe(false);

    keymapStore.getState().setVimMode('insert');
    const insert = keymapStore.getState();
    expect(insert.bindings['h']?.push).toBeUndefined();
    expect(insert.bindings['w']?.c?.id).toBe('vim-ins-ctrl-w');
    expect(isBoundedSlot(insert.catalog, 'vim', 'h', 'push', 'insert')).toBe(true);
    expect(isBoundedSlot(insert.catalog, 'vim', 'h', 's', 'insert')).toBe(true);
  });
});
