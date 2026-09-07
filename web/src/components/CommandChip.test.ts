/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import CommandChip from './CommandChip.svelte';
import CommandPool from './CommandPool.svelte';
import type { CommandRef } from '../lib/types/keymap';

const source = readFileSync(resolve(__dirname, 'CommandChip.svelte'), 'utf-8');

const yank: CommandRef = {
  id: 'yank',
  shortName: 'Yank',
  descriptions: { ru: 'Вставить последний вырезанный фрагмент.' },
};

function mountChip(command: CommandRef = yank) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const component = new CommandChip({ target: host, props: { command } });
  return {
    host,
    component,
    destroy() {
      component.$destroy();
      host.remove();
    },
  };
}

describe('CommandChip layout', () => {
  afterEach(() => {
    document.body.querySelectorAll('.chip-popover').forEach((node) => node.remove());
  });

  it('keeps the tooltip inside a single root so CSS columns do not gain extra items', () => {
    const markup = source.replace(/<script[\s\S]*?<\/script>/, '').replace(/<style[\s\S]*?<\/style>/, '');
    expect(markup).toMatch(/use:portal/);
    const afterRoot = markup.split('class="command_description"')[1] ?? '';
    const closedRoot = afterRoot.lastIndexOf('</div>');
    const trailing = afterRoot.slice(closedRoot + 6);
    expect(trailing).not.toMatch(/\{#if\s+tipVisible/);
  });

  it('renders one element into the parent', () => {
    const { host, destroy } = mountChip();
    expect(host.childElementCount).toBe(1);
    expect(host.firstElementChild?.classList.contains('command_description')).toBe(true);
    destroy();
  });

  it('moves the hover tooltip to document.body instead of the chip', async () => {
    const { host, destroy } = mountChip();
    const chip = host.querySelector('.command_description');
    expect(chip).toBeTruthy();
    chip?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await Promise.resolve();

    const tip = document.body.querySelector('.chip-popover');
    expect(tip).toBeTruthy();
    expect(chip?.contains(tip)).toBe(false);
    expect(tip?.parentElement).toBe(document.body);
    expect(tip?.textContent).toMatch(/Yank/);
    expect(tip?.textContent).toMatch(/Вставить/);
    destroy();
  });

  it('does not add a second child to the command pool while a tooltip is open', async () => {
    const commands: CommandRef[] = [
      { id: 'a', shortName: 'A' },
      { id: 'b', shortName: 'B' },
      { id: 'c', shortName: 'C' },
    ];
    const host = document.createElement('div');
    document.body.appendChild(host);
    const pool = new CommandPool({ target: host, props: { commands } });
    const list = host.querySelector('.commandIcons');
    expect(list?.childElementCount).toBe(3);

    list?.querySelector('.command_description')?.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );
    await Promise.resolve();

    expect(list?.childElementCount).toBe(3);
    expect(document.body.querySelectorAll('.chip-popover')).toHaveLength(1);
    pool.$destroy();
    host.remove();
  });
});
