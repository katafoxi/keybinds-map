/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { portal } from './portal';

describe('portal', () => {
  it('moves the node to document.body and removes it on destroy', () => {
    const host = document.createElement('div');
    const node = document.createElement('div');
    host.appendChild(node);
    document.body.appendChild(host);

    const action = portal(node);
    expect(node.parentElement).toBe(document.body);
    expect(host.contains(node)).toBe(false);

    action.destroy();
    expect(document.body.contains(node)).toBe(false);
    host.remove();
  });
});
