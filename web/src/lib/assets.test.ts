import { describe, expect, it } from 'vitest';
import { assetUrl } from './assets';

const base = import.meta.env.BASE_URL;

describe('assetUrl', () => {
  it('keeps $ literal so Vite can serve $Copy.png', () => {
    expect(assetUrl('icons/vim/$Copy.png')).toBe(`${base}icons/vim/$Copy.png`);
  });

  it('still encodes spaces and other unsafe characters', () => {
    expect(assetUrl('icons/pycharm/Editor Delete.png')).toBe(
      `${base}icons/pycharm/Editor%20Delete.png`,
    );
  });

  it('strips a leading slash before joining with BASE_URL', () => {
    expect(assetUrl('/i/logo.png')).toBe(`${base}i/logo.png`);
  });
});
