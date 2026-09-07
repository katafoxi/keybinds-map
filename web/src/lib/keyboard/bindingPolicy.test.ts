import { describe, expect, it } from 'vitest';
import {
  canDragBinding,
  canDropOnSlot,
  canMutateBinding,
  isBoundedSlot,
  isProgramBounded,
  isPushShiftBoundedKey,
} from './bindingPolicy';
import type { CommandRef } from '../types/keymap';

const copy: CommandRef = { id: '$Copy', shortName: 'Copy' };
const other: CommandRef = { id: 'EditorFoo', shortName: 'Foo' };

describe('bindingPolicy', () => {
  it('marks IDE programs as bounded by default', () => {
    expect(isProgramBounded(null, 'pycharm')).toBe(true);
    expect(isProgramBounded(null, 'vscode')).toBe(true);
    expect(isProgramBounded(null, 'siemens-nx')).toBe(false);
    expect(
      isProgramBounded(
        {
          programs: [
            { slug: 'bash', title: 'Bash', icon: '', site: '', supported: true, isBounded: true },
          ],
          commands: {},
        },
        'bash',
      ),
    ).toBe(true);
  });

  it('respects isBounded from catalog', () => {
    expect(
      isProgramBounded(
        {
          programs: [
            {
              slug: 'siemens-nx',
              title: 'NX',
              icon: '',
              site: '',
              supported: false,
              isBounded: false,
            },
          ],
          commands: {},
        },
        'siemens-nx',
      ),
    ).toBe(false);
    expect(
      isProgramBounded(
        {
          programs: [
            {
              slug: 'siemens-nx',
              title: 'NX',
              icon: '',
              site: '',
              supported: false,
              isBounded: true,
            },
          ],
          commands: {},
        },
        'siemens-nx',
      ),
    ).toBe(true);
  });

  it('treats letter keys as push/shift bounded', () => {
    expect(isPushShiftBoundedKey('i')).toBe(true);
    expect(isPushShiftBoundedKey('f1')).toBe(false);
    expect(isPushShiftBoundedKey('page up')).toBe(false);
  });

  it('blocks push and shift drops on text keys for IDE', () => {
    expect(isBoundedSlot(null, 'pycharm', 'i', 'push')).toBe(true);
    expect(isBoundedSlot(null, 'pycharm', 'i', 's')).toBe(true);
    expect(isBoundedSlot(null, 'pycharm', 'i', 'c')).toBe(false);
    expect(isBoundedSlot(null, 'pycharm', 'f1', 'push')).toBe(false);
    expect(isBoundedSlot(null, 'siemens-nx', 'i', 'push')).toBe(false);
  });

  it('locks standard clipboard shortcuts for PyCharm', () => {
    expect(canDropOnSlot(null, 'pycharm', 'c', 'c', copy)).toBe(false);
    expect(canDragBinding(null, 'pycharm', 'c', 'c', copy)).toBe(false);
    expect(canMutateBinding(null, 'pycharm', 'c', 'c', copy)).toBe(false);
    expect(canDropOnSlot(null, 'pycharm', 'c', 'c', other)).toBe(true);
    expect(canDragBinding(null, 'pycharm', 'c', 'c', other)).toBe(true);
  });

  it('allows plain push on CAD programs', () => {
    expect(canDropOnSlot(null, 'siemens-nx', 'i', 'push')).toBe(true);
    expect(canDropOnSlot(null, 'siemens-nx', 'c', 'c', copy)).toBe(true);
  });

  it('bounds Vim insert letter keys but not normal mode', () => {
    const vimCatalog = {
      programs: [
        { slug: 'vim', title: 'Vim', icon: '', site: '', supported: true, isBounded: false },
      ],
      commands: {},
    };
    expect(isBoundedSlot(vimCatalog, 'vim', 'h', 'push')).toBe(false);
    expect(isBoundedSlot(vimCatalog, 'vim', 'h', 'push', 'normal')).toBe(false);
    expect(isBoundedSlot(vimCatalog, 'vim', 'h', 's', 'normal')).toBe(false);
    expect(isBoundedSlot(vimCatalog, 'vim', 'h', 's', 'visual')).toBe(false);
    expect(isBoundedSlot(vimCatalog, 'vim', 'h', 'push', 'insert')).toBe(true);
    expect(isBoundedSlot(vimCatalog, 'vim', 'h', 's', 'insert')).toBe(true);
    expect(isBoundedSlot(vimCatalog, 'vim', 'h', 'c', 'insert')).toBe(false);
  });

  it('keeps Vim Normal/Visual unbounded even if catalog marks isBounded', () => {
    const vimCatalog = {
      programs: [
        { slug: 'vim', title: 'Vim', icon: '', site: '', supported: true, isBounded: true },
      ],
      commands: {},
    };
    expect(isBoundedSlot(vimCatalog, 'vim', 'g', 's', 'normal')).toBe(false);
    expect(isBoundedSlot(vimCatalog, 'vim', 'g', 'push', 'normal')).toBe(false);
    expect(isBoundedSlot(vimCatalog, 'vim', 'g', 's', 'insert')).toBe(true);
  });
});
