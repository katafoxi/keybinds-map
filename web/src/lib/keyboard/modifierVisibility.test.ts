import { describe, expect, it } from 'vitest';
import { isModifierSlotVisibleOnScreen, isModifierSlotVisibleForPrint } from './modifierVisibility';

const allVisible = {
  push: true,
  a: true,
  c: true,
  s: true,
  ac: true,
  as: true,
  cs: true,
  acs: true,
};

describe('isModifierSlotVisibleOnScreen', () => {
  it('always shows Alt and Ctrl layers', () => {
    const hidden = { ...allVisible, a: false, c: false };
    expect(isModifierSlotVisibleOnScreen('a', hidden)).toBe(true);
    expect(isModifierSlotVisibleOnScreen('c', hidden)).toBe(true);
  });

  it('respects modifierVisibility', () => {
    const partial = { ...allVisible, ac: false, as: false };
    expect(isModifierSlotVisibleOnScreen('ac', partial)).toBe(false);
    expect(isModifierSlotVisibleOnScreen('s', partial)).toBe(true);
  });
});

describe('isModifierSlotVisibleForPrint', () => {
  it('shows only push layer in push print mode', () => {
    expect(isModifierSlotVisibleForPrint('push', allVisible, 'push')).toBe(true);
    expect(isModifierSlotVisibleForPrint('s', allVisible, 'push')).toBe(false);
  });

  it('shows all layers in all print mode', () => {
    const partial = { ...allVisible, acs: false };
    expect(isModifierSlotVisibleForPrint('acs', partial, 'all')).toBe(true);
  });
});
