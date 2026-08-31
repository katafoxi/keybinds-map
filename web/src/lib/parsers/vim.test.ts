import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseVimKeymap, vimBindingsToKeyBindings } from './vim';
import { serializeVimKeymap, parseVimrcMaps } from './vim-serialize';

const rootVim = readFileSync(
  resolve(__dirname, '../../../../fixtures/vim-default.json'),
  'utf-8',
);
const rootRecipes = readFileSync(
  resolve(__dirname, '../../../../fixtures/vim-recipes.json'),
  'utf-8',
);

describe('parseVimKeymap', () => {
  it('parses default catalog with normal root bindings', () => {
    const parsed = parseVimKeymap(rootVim, rootRecipes);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.vimBindings.length).toBeGreaterThan(50);
    expect(parsed.commands['vim-h']?.h).toBe('push');
    expect(parsed.commands['vim-ctrl-d']?.d).toBe('c');
    expect(parsed.layers.some((layer) => layer.id === 'g')).toBe(true);
    expect(parsed.operators.some((op) => op.commandId === 'vim-d')).toBe(true);
    expect(parsed.recipes.length).toBeGreaterThan(10);
  });

  it('keeps layer bindings out of flat ParsedCommands', () => {
    const parsed = parseVimKeymap(rootVim);
    expect(parsed.commands['vim-gg']).toBeUndefined();
    expect(
      parsed.vimBindings.some(
        (binding) => binding.commandId === 'vim-gg' && binding.layer === 'g',
      ),
    ).toBe(true);
  });

  it('builds mode-filtered key bindings', () => {
    const parsed = parseVimKeymap(rootVim);
    const resolveCmd = (id: string) => ({ id, shortName: id });
    const normal = vimBindingsToKeyBindings(parsed.vimBindings, 'normal', null, resolveCmd);
    expect(normal.h?.push?.id).toBe('vim-h');
    expect(normal.g?.push?.id).toBe('vim-prefix-g');

    const gLayer = vimBindingsToKeyBindings(parsed.vimBindings, 'normal', 'g', resolveCmd);
    expect(gLayer.g?.push?.id).toBe('vim-gg');
    expect(gLayer.h?.push).toBeUndefined();

    const insert = vimBindingsToKeyBindings(parsed.vimBindings, 'insert', null, resolveCmd);
    expect(insert.escape?.push?.id).toBe('vim-esc');
    expect(insert.h?.push).toBeUndefined();
  });
});

describe('serializeVimKeymap', () => {
  it('emits nnoremap lines for root normal bindings', () => {
    const parsed = parseVimKeymap(rootVim);
    const text = serializeVimKeymap(parsed.vimBindings);
    expect(text).toContain('nnoremap');
    expect(text).toContain('vim-h');
    expect(text).toMatch(/layer g:/);
  });
});

describe('parseVimrcMaps', () => {
  it('imports simple nnoremap and skips Plug', () => {
    const source = `
nnoremap j gj
nnoremap <C-j> <C-w>j
nmap <Plug>(test) :
`;
    const result = parseVimrcMaps(source);
    expect(result.bindings.some((binding) => binding.keyName === 'j')).toBe(true);
    expect(result.warnings.some((warning) => /Plug/.test(warning))).toBe(true);
  });
});
