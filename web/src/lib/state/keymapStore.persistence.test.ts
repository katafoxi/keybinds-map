import { beforeEach, describe, expect, it, vi } from 'vitest';
import defaultPycharmXml from '@fixtures/Windows.xml?raw';

const idb = new Map<string, unknown>();

vi.mock('idb-keyval', () => ({
  get: async (key: string) => idb.get(key),
  set: async (key: string, value: unknown) => {
    idb.set(key, value);
  },
}));

const { keymapStore } = await import('./keymapStore');
const { bundledCatalog } = await import('../catalog/bundledPrograms');

function resetToStandard() {
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
}

describe('keymapStore profile persistence', () => {
  beforeEach(() => {
    idb.clear();
    resetToStandard();
  });

  it('restores the active custom slot on the next boot', async () => {
    idb.set('keybinds-profile-slots', {
      custom1: { program: 'pycharm', xml: defaultPycharmXml, updatedAt: Date.now() },
    });
    idb.set('keybinds-active-profile', 'custom1');

    await keymapStore.getState().initialize();

    const state = keymapStore.getState();
    expect(state.activeProfileId).toBe('custom1');
    expect(Object.keys(state.bindings).length).toBeGreaterThan(50);
  });

  it('falls back to standard when the stored slot is gone', async () => {
    idb.set('keybinds-active-profile', 'custom2');

    await keymapStore.getState().initialize();

    expect(keymapStore.getState().activeProfileId).toBe('standard');
  });

  it('round-trips an edited VS Code keymap through a profile slot', async () => {
    await keymapStore.getState().selectProgram('vscode');
    keymapStore.getState().assignCommand({
      key: 'k',
      slot: 'c',
      command: { id: 'workbench.action.showCommands', shortName: 'Commands' },
    });

    const target = await keymapStore.getState().copyCurrentProfile();
    expect(target).toBe('custom1');

    const slots = idb.get('keybinds-profile-slots') as Record<
      string,
      { program: string; xml: string }
    >;
    expect(slots.custom1.program).toBe('vscode');
    expect(JSON.parse(slots.custom1.xml)).toEqual([
      { key: 'ctrl+k', command: 'workbench.action.showCommands' },
    ]);

    resetToStandard();
    await keymapStore.getState().initialize();

    const restored = keymapStore.getState();
    expect(restored.activeProfileId).toBe('custom1');
    expect(restored.selectedProgram).toBe('vscode');
    expect(restored.bindings['k']?.c?.id).toBe('workbench.action.showCommands');
  });

  it('refuses to overwrite when both custom slots are full unless forced', async () => {
    const originalCustom1 = {
      program: 'pycharm',
      xml: defaultPycharmXml,
      updatedAt: 1,
    };
    idb.set('keybinds-profile-slots', {
      custom1: originalCustom1,
      custom2: {
        program: 'pycharm',
        xml: defaultPycharmXml,
        updatedAt: 2,
      },
    });

    keymapStore.getState().loadFromXml(defaultPycharmXml);
    keymapStore.getState().assignCommand({
      key: 'q',
      slot: 'c',
      command: { id: 'Find', shortName: 'Find' },
    });

    const refused = await keymapStore.getState().copyCurrentProfile();
    expect(refused).toBeNull();
    const slotsBefore = idb.get('keybinds-profile-slots') as Record<
      string,
      { program: string; xml: string; updatedAt: number }
    >;
    expect(slotsBefore.custom1.updatedAt).toBe(1);
    expect(slotsBefore.custom1.xml).toBe(defaultPycharmXml);

    const forced = await keymapStore.getState().copyCurrentProfile({
      overwriteCustom1: true,
    });
    expect(forced).toBe('custom1');
    const slotsAfter = idb.get('keybinds-profile-slots') as Record<
      string,
      { program: string; xml: string }
    >;
    expect(slotsAfter.custom1.xml).not.toBe(defaultPycharmXml);
    expect(slotsAfter.custom1.xml).toContain('Find');
  });
});
