import type { KeyBindings, KeymapMetadata, CommandRef, VimBinding } from '../types/keymap';
import { buildVimDisplayState, type VimDisplaySource } from './vimHelpers';

export const MAX_HISTORY = 20;

export type KeymapStateSnapshot = {
  bindings: KeyBindings;
  unassigned: CommandRef[];
  metadata: KeymapMetadata;
  sourceXml: string;
  dirty: boolean;
  importWarnings: string[];
  /** Source of truth in Vim: `bindings` is only a projection of the active mode/layer. */
  vimBindings: VimBinding[];
};

export type HistorySource = KeymapStateSnapshot & {
  historyPast: KeymapStateSnapshot[];
  historyFuture: KeymapStateSnapshot[];
};

function cloneBindings(bindings: KeyBindings): KeyBindings {
  return structuredClone(bindings);
}

export function snapshotState(state: KeymapStateSnapshot): KeymapStateSnapshot {
  return {
    bindings: cloneBindings(state.bindings),
    unassigned: structuredClone(state.unassigned),
    metadata: structuredClone(state.metadata),
    sourceXml: state.sourceXml,
    dirty: state.dirty,
    importWarnings: [...state.importWarnings],
    vimBindings: structuredClone(state.vimBindings ?? []),
  };
}

export function pushHistory(
  state: HistorySource,
): Pick<HistorySource, 'historyPast' | 'historyFuture'> {
  return {
    historyPast: [...state.historyPast, snapshotState(state)].slice(-MAX_HISTORY),
    historyFuture: [],
  };
}

/**
 * In Vim `bindings` is only a projection of `vimBindings` onto the visible
 * mode/layer, so restoring a snapshot has to re-derive it for the current view.
 */
export function restoreDisplay(
  state: VimDisplaySource & { selectedProgram: string },
  snapshot: KeymapStateSnapshot,
): Partial<{ bindings: KeyBindings; unassigned: CommandRef[] }> {
  if (state.selectedProgram !== 'vim') {
    return {};
  }
  return buildVimDisplayState(state, { vimBindings: snapshot.vimBindings });
}

export { cloneBindings };
