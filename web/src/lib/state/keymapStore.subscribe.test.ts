import { describe, expect, it } from 'vitest';
import { keymap, keymapStore } from './keymapStore';

describe('keymap store subscription', () => {
  it('exposes bindings on first subscribe callback', () => {
    let received: ReturnType<typeof keymapStore.getState> | undefined;
    keymap.subscribe((state) => {
      received = state;
    });
    expect(received).toBeDefined();
    expect(received!.bindings).toBeDefined();
    expect(typeof received!.bindings).toBe('object');
  });
});
