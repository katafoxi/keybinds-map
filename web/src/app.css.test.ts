import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, 'app.css'), 'utf-8');

describe('app.css layout contract', () => {
  it('does not use :global() — this is a plain stylesheet, not Svelte-scoped CSS', () => {
    expect(css).not.toMatch(/:global\s*\(/);
  });

  it('keeps the keyboard on a 17-column shrinking grid', () => {
    expect(css).toMatch(
      /\.keyboardGrid\s*\{[^}]*grid-template-columns:\s*repeat\(\s*17\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)/s,
    );
    expect(css).toMatch(/\.char\s*\{[^}]*min-width:\s*0/s);
  });

  it('clips chips and keeps the command pool in CSS columns', () => {
    expect(css).toMatch(/\.commandIcons\s*\{[^}]*column-width:\s*85px/s);
    expect(css).toMatch(
      /\.command_description\s*,\s*\.descr\s*\{[^}]*overflow:\s*hidden/s,
    );
    expect(css).toMatch(/\.chip-popover\s*\{[^}]*position:\s*fixed/s);
  });
});
