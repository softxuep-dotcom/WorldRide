export const CONTENT_LOCALES = ["fr", "pt-BR", "it", "es"] as const;

export type ContentLocale = (typeof CONTENT_LOCALES)[number];

const translations: Partial<
  Record<ContentLocale, Readonly<Record<string, string>>>
> = {};

const contentLoaders: Record<
  ContentLocale,
  () => Promise<Readonly<Record<string, string>>>
> = {
  es: () => import("./content/es.json").then((module) => module.default),
  fr: () => import("./content/fr.json").then((module) => module.default),
  it: () => import("./content/it.json").then((module) => module.default),
  "pt-BR": () =>
    import("./content/pt-BR.json").then((module) => module.default),
};

export async function loadAuthoredTextLocale(locale: string): Promise<void> {
  if (!isContentLocale(locale) || translations[locale]) {
    return;
  }
  translations[locale] = await contentLoaders[locale]();
}

export function localizeAuthoredText(text: string, locale: string): string {
  return isContentLocale(locale) ? translations[locale]?.[text] ?? text : text;
}

export function isContentLocale(locale: string): locale is ContentLocale {
  return CONTENT_LOCALES.includes(locale as ContentLocale);
}
