import type {
  CommandRef,
  VimLayerDef,
  VimOperatorDef,
  VimRole,
  VimViewState,
} from '../types/keymap';

export type VimViewEvent =
  | { type: 'escape' }
  | { type: 'clickOutside' }
  | {
      type: 'activateCommand';
      command: CommandRef;
      keyName: string;
      slot: string;
    };

export type VimViewContext = {
  layers: VimLayerDef[];
  operators: VimOperatorDef[];
  mode: string;
};

export type VimViewTransition = {
  view: VimViewState;
  /** Flash label for completed operator+motion sequences. */
  flash?: string;
  /** Keys to highlight while in pending states. */
  highlightRoles?: VimRole[];
  highlightCommandIds?: string[];
};

function rolesOf(command: CommandRef): VimRole[] {
  return command.roles ?? [];
}

function findLayer(
  ctx: VimViewContext,
  commandId: string,
): VimLayerDef | undefined {
  return ctx.layers.find(
    (layer) => layer.triggerCommandId === commandId && layer.mode === ctx.mode,
  );
}

function findOperator(
  ctx: VimViewContext,
  commandId: string,
): VimOperatorDef | undefined {
  return ctx.operators.find((op) => op.commandId === commandId);
}

export function reduceVimView(
  view: VimViewState,
  event: VimViewEvent,
  ctx: VimViewContext,
): VimViewTransition {
  if (event.type === 'escape' || event.type === 'clickOutside') {
    return { view: { kind: 'idle' } };
  }

  const { command, keyName, slot } = event;
  const commandRoles = rolesOf(command);

  if (view.kind === 'idle') {
    const layer = findLayer(ctx, command.id);
    if (layer || commandRoles.includes('prefix')) {
      const layerId = layer?.id;
      if (layerId) {
        return { view: { kind: 'prefix', layerId } };
      }
    }
    const operator = findOperator(ctx, command.id);
    if (operator || commandRoles.includes('operator')) {
      return {
        view: { kind: 'operator', commandId: command.id },
        highlightRoles: operator?.accepts ?? ['motion', 'textobject'],
        highlightCommandIds: operator?.doubledCommandId
          ? [operator.commandId]
          : [command.id],
      };
    }
    return { view: { kind: 'idle' } };
  }

  if (view.kind === 'prefix') {
    // Any activation leaves the prefix layer back to idle (display handled by store).
    return { view: { kind: 'idle' }, flash: command.shortName };
  }

  if (view.kind === 'operator') {
    const operator = findOperator(ctx, view.commandId);
    if (command.id === view.commandId || (operator && command.id === operator.commandId)) {
      const doubled = operator?.doubledCommandId;
      return {
        view: { kind: 'idle' },
        flash: doubled ?? `${command.shortName}${command.shortName}`,
      };
    }

    if (commandRoles.includes('textobject') && (command.id === 'vim-i' || command.shortName === 'i')) {
      if (operator?.accepts.includes('textobject')) {
        return {
          view: { kind: 'textobject', operatorId: view.commandId, kindInner: 'inner' },
          highlightRoles: ['textobject', 'motion'],
        };
      }
    }
    if (commandRoles.includes('textobject') && (command.id === 'vim-a' || command.shortName === 'a')) {
      if (operator?.accepts.includes('textobject')) {
        return {
          view: { kind: 'textobject', operatorId: view.commandId, kindInner: 'around' },
          highlightRoles: ['textobject', 'motion'],
        };
      }
    }

    if (commandRoles.includes('motion') || commandRoles.includes('command')) {
      if (!commandRoles.includes('operator') && !commandRoles.includes('prefix')) {
        return {
          view: { kind: 'idle' },
          flash: `${view.commandId.replace(/^vim-/, '')}${command.shortName}`,
        };
      }
    }

    // clicking unrelated command cancels
    return { view: { kind: 'idle' } };
  }

  if (view.kind === 'textobject') {
    const prefix = view.kindInner === 'inner' ? 'i' : 'a';
    return {
      view: { kind: 'idle' },
      flash: `${view.operatorId.replace(/^vim-/, '')}${prefix}${keyName}`,
    };
  }

  return { view: { kind: 'idle' } };
}

export function vimViewBreadcrumb(view: VimViewState, modeLabel: string): string {
  if (view.kind === 'idle') {
    return modeLabel;
  }
  if (view.kind === 'prefix') {
    return `${modeLabel} › ${view.layerId}`;
  }
  if (view.kind === 'operator') {
    return `${modeLabel} › ${view.commandId.replace(/^vim-/, '')}`;
  }
  if (view.kind === 'textobject') {
    const kind = view.kindInner === 'inner' ? 'inner' : 'around';
    return `${modeLabel} › ${view.operatorId.replace(/^vim-/, '')} › ${kind}`;
  }
  return modeLabel;
}
