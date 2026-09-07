import { describe, expect, it } from 'vitest';
import { reduceVimView, vimViewBreadcrumb } from '../vim/vimView';
import type { VimLayerDef, VimOperatorDef } from '../types/keymap';

const layers: VimLayerDef[] = [
  {
    id: 'g',
    triggerCommandId: 'vim-prefix-g',
    mode: 'normal',
    keyName: 'g',
    slot: 'push',
  },
];

const operators: VimOperatorDef[] = [
  {
    commandId: 'vim-d',
    doubledCommandId: 'vim-dd',
    accepts: ['motion', 'textobject'],
  },
  {
    commandId: 'vim-c',
    doubledCommandId: 'vim-cc',
    accepts: ['motion', 'textobject'],
  },
];

const ctx = { layers, operators, mode: 'normal' };

describe('reduceVimView', () => {
  it('enters prefix layer on g', () => {
    const next = reduceVimView(
      { kind: 'idle' },
      {
        type: 'activateCommand',
        command: { id: 'vim-prefix-g', shortName: 'g…', roles: ['prefix'] },
        keyName: 'g',
        slot: 'push',
      },
      ctx,
    );
    expect(next.view).toEqual({ kind: 'prefix', layerId: 'g' });
  });

  it('enters operator pending on d and doubles to dd', () => {
    const pending = reduceVimView(
      { kind: 'idle' },
      {
        type: 'activateCommand',
        command: { id: 'vim-d', shortName: 'd', roles: ['operator'] },
        keyName: 'd',
        slot: 'push',
      },
      ctx,
    );
    expect(pending.view.kind).toBe('operator');

    const doubled = reduceVimView(
      pending.view,
      {
        type: 'activateCommand',
        command: { id: 'vim-d', shortName: 'd', roles: ['operator'] },
        keyName: 'd',
        slot: 'push',
      },
      ctx,
    );
    expect(doubled.view.kind).toBe('idle');
    expect(doubled.flash).toBe('vim-dd');
  });

  it('handles ciw via textobject nest', () => {
    const op = reduceVimView(
      { kind: 'idle' },
      {
        type: 'activateCommand',
        command: { id: 'vim-c', shortName: 'c', roles: ['operator'] },
        keyName: 'c',
        slot: 'push',
      },
      ctx,
    );
    const inner = reduceVimView(
      op.view,
      {
        type: 'activateCommand',
        command: { id: 'vim-i', shortName: 'i', roles: ['command', 'textobject'] },
        keyName: 'i',
        slot: 'push',
      },
      ctx,
    );
    expect(inner.view).toEqual({
      kind: 'textobject',
      operatorId: 'vim-c',
      kindInner: 'inner',
    });

    const done = reduceVimView(
      inner.view,
      {
        type: 'activateCommand',
        command: { id: 'vim-w', shortName: 'word→', roles: ['motion', 'command'] },
        keyName: 'w',
        slot: 'push',
      },
      ctx,
    );
    expect(done.view.kind).toBe('idle');
    expect(done.flash).toContain('c');
    expect(done.flash).toContain('w');
  });

  it('escape resets to idle', () => {
    const next = reduceVimView(
      { kind: 'prefix', layerId: 'g' },
      { type: 'escape' },
      ctx,
    );
    expect(next.view).toEqual({ kind: 'idle' });
  });

  it('builds breadcrumbs', () => {
    expect(vimViewBreadcrumb({ kind: 'idle' }, 'Normal')).toBe('Normal');
    expect(
      vimViewBreadcrumb({ kind: 'operator', commandId: 'vim-d' }, 'Normal'),
    ).toBe('Normal › d');
    expect(
      vimViewBreadcrumb(
        { kind: 'textobject', operatorId: 'vim-c', kindInner: 'inner' },
        'Normal',
      ),
    ).toBe('Normal › c › inner');
  });
});
