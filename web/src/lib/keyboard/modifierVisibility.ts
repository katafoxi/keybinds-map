import type { ModifierSlot } from '../types/keymap';

export function isModifierSlotVisibleOnScreen(
  slot: ModifierSlot,
  modifierVisibility: Record<string, boolean>,
): boolean {
  if (slot === 'a' || slot === 'c') {
    return true;
  }
  return modifierVisibility[slot] ?? true;
}

export function isModifierSlotVisibleForPrint(
  slot: ModifierSlot,
  modifierVisibility: Record<string, boolean>,
  printLayerMode: import('../types/keymap').PrintLayerMode,
): boolean {
  if (printLayerMode === 'all') {
    return true;
  }
  if (printLayerMode === 'push') {
    return slot === 'push';
  }
  return isModifierSlotVisibleOnScreen(slot, modifierVisibility);
}
