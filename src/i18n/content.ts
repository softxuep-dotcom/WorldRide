import es from "./content/es.json";
import fr from "./content/fr.json";
import it from "./content/it.json";
import ptBR from "./content/pt-BR.json";

export const CONTENT_LOCALES = ["fr", "pt-BR", "it", "es"] as const;

export type ContentLocale = (typeof CONTENT_LOCALES)[number];

const translations: Readonly<
  Record<ContentLocale, Readonly<Record<string, string>>>
> = {
  fr,
  "pt-BR": ptBR,
  it,
  es,
};

export function localizeAuthoredText(text: string, locale: string): string {
  return isContentLocale(locale) ? translations[locale][text] ?? text : text;
}

export function isContentLocale(locale: string): locale is ContentLocale {
  return CONTENT_LOCALES.includes(locale as ContentLocale);
}
