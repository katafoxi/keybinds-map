import { describe, expect, it } from 'vitest';
import { isUiLocale, pickLocalized } from './locale';

describe('pickLocalized', () => {
  it('prefers the active locale, then ru, then any remaining text', () => {
    expect(pickLocalized({ ru: 'Русский', en: 'English' }, 'en')).toBe('English');
    expect(pickLocalized({ ru: 'Русский' }, 'en')).toBe('Русский');
    expect(pickLocalized({ en: 'English' }, 'ru')).toBe('English');
    expect(pickLocalized(undefined, 'ru')).toBeUndefined();
  });

  it('accepts only known UI locales', () => {
    expect(isUiLocale('ru')).toBe(true);
    expect(isUiLocale('en')).toBe(true);
    expect(isUiLocale('de')).toBe(false);
  });
});
