import type { CommandRef, ModifierSlot, ProgramCatalog, VimMode } from '../types/keymap';

export type LockedBinding = {
  keyName: string;
  slot: ModifierSlot;
  commandId: string;
};

/** Keys where IDE programs disallow plain push and Shift-only bindings. */
const UNBOUNDED_PUSH_SHIFT_KEYS = new Set([
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
  'escape', 'print screen', 'scroll lock', 'pause',
  'insert', 'home', 'page up', 'page down', 'end',
  'up', 'left', 'down', 'right',
]);

const IDE_LOCKED_BINDINGS: Record<string, LockedBinding[]> = {
  pycharm: [
    { keyName: 'c', slot: 'c', commandId: '$Copy' },
    { keyName: 'insert', slot: 'c', commandId: '$Copy' },
    { keyName: 'v', slot: 'c', commandId: '$Paste' },
    { keyName: 'insert', slot: 's', commandId: '$Paste' },
    { keyName: 'x', slot: 'c', commandId: '$Cut' },
    { keyName: 'delete', slot: 's', commandId: '$Cut' },
    { keyName: 'z', slot: 'c', commandId: '$Undo' },
    { keyName: 'back_space', slot: 'a', commandId: '$Undo' },
    { keyName: 's', slot: 'c', commandId: 'SaveAll' },
  ],
  vscode: [
    { keyName: 'c', slot: 'c', commandId: 'editor.action.clipboardCopyAction' },
    { keyName: 'v', slot: 'c', commandId: 'editor.action.clipboardPasteAction' },
    { keyName: 'x', slot: 'c', commandId: 'editor.action.clipboardCutAction' },
    { keyName: 'z', slot: 'c', commandId: 'undo' },
    { keyName: 's', slot: 'c', commandId: 'workbench.action.files.save' },
  ],
};

const IDE_PROGRAMS = new Set(Object.keys(IDE_LOCKED_BINDINGS));

export function isProgramBounded(
  catalog: ProgramCatalog | null,
  programSlug: string,
): boolean {
  const fromCatalog = catalog?.programs.find((program) => program.slug === programSlug);
  if (fromCatalog?.isBounded !== undefined) {
    return fromCatalog.isBounded;
  }
  return IDE_PROGRAMS.has(programSlug);
}

export function isPushShiftBoundedKey(keyName: string): boolean {
  if (!keyName) {
    return false;
  }
  return !UNBOUNDED_PUSH_SHIFT_KEYS.has(keyName);
}

export function isBoundedSlot(
  catalog: ProgramCatalog | null,
  programSlug: string,
  keyName: string,
  slot: ModifierSlot,
  vimMode?: VimMode,
): boolean {
  // Vim: Normal/Visual/Cmdline are command maps — push and Shift are valid.
  // Only Insert treats letter keys as typing, so push/Shift slots stay closed.
  if (programSlug === 'vim') {
    if (vimMode === 'insert') {
      return (slot === 'push' || slot === 's') && isPushShiftBoundedKey(keyName);
    }
    return false;
  }
  if (!isProgramBounded(catalog, programSlug)) {
    return false;
  }
  return (slot === 'push' || slot === 's') && isPushShiftBoundedKey(keyName);
}

export function findLockedBinding(
  programSlug: string,
  keyName: string,
  slot: ModifierSlot,
  commandId?: string,
): LockedBinding | undefined {
  const locked = IDE_LOCKED_BINDINGS[programSlug] ?? [];
  return locked.find(
    (entry) =>
      entry.keyName === keyName &&
      entry.slot === slot &&
      (commandId === undefined || entry.commandId === commandId),
  );
}

export function isBindingLocked(
  programSlug: string,
  keyName: string,
  slot: ModifierSlot,
  command: CommandRef | undefined,
): boolean {
  if (!command) {
    return false;
  }
  return Boolean(findLockedBinding(programSlug, keyName, slot, command.id));
}

export function canDropOnSlot(
  catalog: ProgramCatalog | null,
  programSlug: string,
  keyName: string,
  slot: ModifierSlot,
  existing?: CommandRef,
  vimMode?: VimMode,
): boolean {
  if (isBoundedSlot(catalog, programSlug, keyName, slot, vimMode)) {
    return false;
  }
  if (existing && isBindingLocked(programSlug, keyName, slot, existing)) {
    return false;
  }
  return true;
}

export function canDragBinding(
  catalog: ProgramCatalog | null,
  programSlug: string,
  keyName: string,
  slot: ModifierSlot,
  command: CommandRef | undefined,
): boolean {
  if (!command) {
    return false;
  }
  return !isBindingLocked(programSlug, keyName, slot, command);
}

export function canMutateBinding(
  catalog: ProgramCatalog | null,
  programSlug: string,
  keyName: string,
  slot: ModifierSlot,
  existing?: CommandRef,
  vimMode?: VimMode,
): boolean {
  if (isBoundedSlot(catalog, programSlug, keyName, slot, vimMode)) {
    return false;
  }
  if (existing && isBindingLocked(programSlug, keyName, slot, existing)) {
    return false;
  }
  return true;
}
