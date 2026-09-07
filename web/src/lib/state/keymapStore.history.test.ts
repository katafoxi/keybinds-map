import { beforeEach, describe, expect, it } from 'vitest';
import defaultPycharmXml from '@fixtures/Windows.xml?raw';
import { keymapStore } from './keymapStore';
import { bundledCatalog } from '../catalog/bundledPrograms';

describe('keymapStore undo/redo', () => {
  beforeEach(() => {
    keymapStore.setState({
      catalog: bundledCatalog,
      selectedProgram: 'pycharm',
      activeProfileId: 'standard',
      bindings: {},
      unassigned: [],
      sourceXml: '',
      dirty: false,
      importWarnings: [],
      historyPast: [],
      historyFuture: [],
    });
  });

  it('restores a removed PyCharm binding', () => {
    keymapStore.getState().loadFromXml(defaultPycharmXml);
    const command = keymapStore.getState().bindings['n']?.c;
    expect(command).toBeDefined();

    keymapStore.getState().unassignCommand('n', 'c');
    expect(keymapStore.getState().bindings['n']?.c).toBeUndefined();

    keymapStore.getState().undo();
    expect(keymapStore.getState().bindings['n']?.c?.id).toBe(command?.id);

    keymapStore.getState().redo();
    expect(keymapStore.getState().bindings['n']?.c).toBeUndefined();
  });

  it('restores vimBindings, not just the visible projection', async () => {
    await keymapStore.getState().selectProgram('vim');
    const before = keymapStore.getState().vimBindings.length;

    keymapStore.getState().unassignCommand('h', 'push');
    expect(keymapStore.getState().vimBindings.length).toBe(before - 1);

    keymapStore.getState().undo();
    expect(keymapStore.getState().vimBindings.length).toBe(before);
    expect(keymapStore.getState().bindings['h']?.push?.id).toBe('vim-h');

    // The projection is rebuilt from vimBindings on every mode change, so an
    // undo that only patched `bindings` would be lost on the way back.
    keymapStore.getState().setVimMode('insert');
    keymapStore.getState().setVimMode('normal');
    expect(keymapStore.getState().bindings['h']?.push?.id).toBe('vim-h');

    keymapStore.getState().redo();
    expect(keymapStore.getState().vimBindings.length).toBe(before - 1);
    expect(keymapStore.getState().bindings['h']?.push).toBeUndefined();
  });
});
