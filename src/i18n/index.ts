import type {
  CountryDefinition,
  PhotoSpotDefinition,
} from "../game/data";
import {
  loadAuthoredTextLocale,
  localizeAuthoredText,
} from "./content";
import { en } from "./locales/en";
import type {
  LocaleDefinition,
  MessageKey,
  MessageParams,
  WorldCountryTranslation,
} from "./types";

const DEFAULT_LOCALE = "en";
const SOURCE_LOCALE = "zh-CN";
const STORAGE_KEY = "worldride.locale";

const localeMetadata = {
  "zh-CN": { code: "zh-CN", htmlLang: "zh-CN", label: "中文" },
  en: { code: "en", htmlLang: "en", label: "English" },
  fr: { code: "fr", htmlLang: "fr", label: "Français" },
  "pt-BR": {
    code: "pt-BR",
    htmlLang: "pt-BR",
    label: "Português (Brasil)",
  },
  it: { code: "it", htmlLang: "it", label: "Italiano" },
  es: { code: "es", htmlLang: "es", label: "Español" },
  de: { code: "de", htmlLang: "de", label: "Deutsch" },
};

export type LocaleCode = keyof typeof localeMetadata;
export type LocaleSummary = (typeof localeMetadata)[LocaleCode];

const localeRegistry: Partial<Record<LocaleCode, LocaleDefinition>> = {
  en: en as LocaleDefinition,
};
const localeLoaders: Record<LocaleCode, () => Promise<LocaleDefinition>> = {
  en: async () => en,
  "zh-CN": () =>
    import("./locales/zh-CN").then((module) => module.zhCN),
  fr: () => import("./locales/fr").then((module) => module.fr),
  "pt-BR": () =>
    import("./locales/pt-BR").then((module) => module.ptBR),
  it: () => import("./locales/it").then((module) => module.it),
  es: () => import("./locales/es").then((module) => module.es),
  de: () => import("./locales/de").then((module) => module.de),
};

let activeLocale: LocaleCode = DEFAULT_LOCALE;
const listeners = new Set<(locale: LocaleCode) => void>();

export async function initializeI18n(): Promise<void> {
  activeLocale = detectInitialLocale();
  await ensureLocaleLoaded(activeLocale);
  applyDocumentLanguage();
}

export function getLocale(): LocaleCode {
  return activeLocale;
}

export function getSupportedLocales(): readonly LocaleSummary[] {
  return Object.values(localeMetadata);
}

export async function setLocale(locale: string): Promise<boolean> {
  const resolved = resolveLocale(locale);
  if (!resolved || resolved === activeLocale) {
    return Boolean(resolved);
  }

  await ensureLocaleLoaded(resolved);
  activeLocale = resolved;
  try {
    window.localStorage.setItem(STORAGE_KEY, resolved);
  } catch {
    // The game still works when storage is unavailable or blocked.
  }
  applyDocumentLanguage();
  for (const listener of listeners) {
    listener(resolved);
  }
  return true;
}

export function onLocaleChange(
  listener: (locale: LocaleCode) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function t(key: MessageKey, params?: MessageParams): string {
  const active =
    localeRegistry[activeLocale] ?? (en as LocaleDefinition);
  const message =
    active.messages[key] ??
    (en as LocaleDefinition).messages[key];
  return formatMessage(message, params);
}

export function translateDocument(root: ParentNode = document): void {
  for (const element of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = element.dataset.i18n as MessageKey | undefined;
    if (key) {
      element.textContent = t(key);
    }
  }

  for (const element of root.querySelectorAll<HTMLElement>("[data-i18n-attr]")) {
    const bindings = element.dataset.i18nAttr?.split(";") ?? [];
    for (const binding of bindings) {
      const [attribute, rawKey] = binding.split(":");
      const key = rawKey?.trim() as MessageKey | undefined;
      if (attribute?.trim() && key) {
        element.setAttribute(attribute.trim(), t(key));
      }
    }
  }
}

export function localizeCountry(
  country: CountryDefinition,
): CountryDefinition {
  const active =
    localeRegistry[activeLocale] ?? (en as LocaleDefinition);
  const translation =
    active.countries[country.id] ??
    (activeLocale === SOURCE_LOCALE
      ? undefined
      : (en as LocaleDefinition).countries[country.id]);
  if (!translation) {
    return country;
  }

  return {
    ...country,
    name: localizeAuthoredText(translation.name, activeLocale),
    intro: localizeAuthoredText(translation.intro, activeLocale),
    facts:
      translation.facts?.map((fact) =>
        localizeAuthoredText(fact, activeLocale),
      ) ??
      (activeLocale === SOURCE_LOCALE
        ? country.facts
        : []),
    city: {
      ...country.city,
      name: localizeAuthoredText(translation.cityName, activeLocale),
    },
  };
}

export function localizePhotoSpot(
  spot: PhotoSpotDefinition,
): PhotoSpotDefinition {
  const active =
    localeRegistry[activeLocale] ?? (en as LocaleDefinition);
  const translation =
    active.photoSpots[spot.id] ??
    (activeLocale === SOURCE_LOCALE
      ? undefined
      : (en as LocaleDefinition).photoSpots[spot.id]);
  return translation
    ? {
        ...spot,
        name: localizeAuthoredText(translation.name, activeLocale),
        postcard: localizeAuthoredText(translation.postcard, activeLocale),
        description: localizeAuthoredText(
          translation.description,
          activeLocale,
        ),
        fact: localizeAuthoredText(translation.fact, activeLocale),
      }
    : spot;
}

export function getWorldCountryTranslation(
  atlasName: string,
): WorldCountryTranslation {
  const active =
    localeRegistry[activeLocale] ?? (en as LocaleDefinition);
  const translation =
    active.worldCountries[atlasName] ??
    (activeLocale === SOURCE_LOCALE
      ? {}
      : (en as LocaleDefinition).worldCountries[atlasName]);
  if (activeLocale === SOURCE_LOCALE) {
    return translation ?? {};
  }
  return {
    name: localizeAuthoredText(
      translation?.name ?? atlasName,
      activeLocale,
    ),
    intro: translation?.intro
      ? localizeAuthoredText(translation.intro, activeLocale)
      : undefined,
    details: translation?.details?.map((detail) =>
      localizeAuthoredText(detail, activeLocale),
    ),
  };
}

function applyDocumentLanguage(): void {
  const locale =
    localeRegistry[activeLocale] ?? (en as LocaleDefinition);
  document.documentElement.lang = locale.htmlLang;
  document.documentElement.dir = locale.direction ?? "ltr";
  document.title = t("meta.title");
  document
    .querySelector<HTMLMetaElement>('meta[name="description"]')
    ?.setAttribute("content", t("meta.description"));
  translateDocument();
}

function detectInitialLocale(): LocaleCode {
  const requested = new URLSearchParams(window.location.search).get("lang");
  const requestedLocale = requested ? resolveLocale(requested) : undefined;
  if (requestedLocale) {
    return requestedLocale;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const storedLocale = stored ? resolveLocale(stored) : undefined;
    if (storedLocale) {
      return storedLocale;
    }
  } catch {
    // Fall through to browser language detection.
  }

  for (const language of navigator.languages) {
    const locale = resolveLocale(language);
    if (locale) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
}

function resolveLocale(locale: string): LocaleCode | undefined {
  const normalized = locale.trim().toLowerCase();
  const entries = Object.entries(localeMetadata) as readonly [
    LocaleCode,
    LocaleSummary,
  ][];

  for (const [code, definition] of entries) {
    if (
      normalized === code.toLowerCase() ||
      normalized === definition.htmlLang.toLowerCase()
    ) {
      return code;
    }
  }

  const baseLanguage = normalized.split("-")[0];
  for (const [code, definition] of entries) {
    if (definition.htmlLang.toLowerCase().split("-")[0] === baseLanguage) {
      return code;
    }
  }
  return undefined;
}

async function ensureLocaleLoaded(locale: LocaleCode): Promise<void> {
  if (!localeRegistry[locale]) {
    localeRegistry[locale] = await localeLoaders[locale]();
  }
  await loadAuthoredTextLocale(locale);
}

function formatMessage(message: string, params?: MessageParams): string {
  if (!params) {
    return message;
  }
  return message.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(params, key) ? String(params[key]) : placeholder,
  );
}
