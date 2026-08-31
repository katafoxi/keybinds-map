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
    expect(state.unassigned.some((command) => command.id === 'edit-and-execute-command')).toBe(
      true,
    );
  });
});
