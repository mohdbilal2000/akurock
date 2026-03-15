import type { Locale } from './config';
import type { Dictionary } from './dictionaries/de';
import de from './dictionaries/de';
import en from './dictionaries/en';
import es from './dictionaries/es';

const dictionaries: Record<Locale, Dictionary> = { de, en, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.de;
}
