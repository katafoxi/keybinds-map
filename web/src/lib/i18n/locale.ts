import { writable } from 'svelte/store';
import {
  DEFAULT_UI_LOCALE,
  UI_LOCALES,
  type UiLocale,
} from '../types/keymap';

const STORAGE_KEY = 'keybinds-ui-locale';

export function isUiLocale(value: string | null | undefined): value is UiLocale {
  return UI_LOCALES.includes(value as UiLocale);
}

export function pickLocalized(
  text: Partial<Record<UiLocale, string>> | undefined,
  locale: UiLocale,
): string | undefined {
  if (!text) {
    return undefined;
  }
  return text[locale] ?? text[DEFAULT_UI_LOCALE] ?? text.en ?? Object.values(text)[0];
}

function readStoredLocale(): UiLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isUiLocale(stored)) {
      return stored;
    }
  } catch {
    // private mode / SSR
  }
  return DEFAULT_UI_LOCALE;
}

function createLocaleStore() {
  const { subscribe, set } = writable<UiLocale>(DEFAULT_UI_LOCALE);
  let started = false;

  return {
    subscribe,
    start() {
      if (started) {
        return;
      }
      started = true;
      set(readStoredLocale());
    },
    set(locale: UiLocale) {
      set(locale);
      try {
        localStorage.setItem(STORAGE_KEY, locale);
      } catch {
        // ignore quota / private mode
      }
    },
  };
}

export const uiLocale = createLocaleStore();
