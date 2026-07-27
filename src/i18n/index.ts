import type {
  CountryDefinition,
  PhotoSpotDefinition,
} from "../game/data";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { it } from "./locales/it";
import { ptBR } from "./locales/pt-BR";
import { zhCN } from "./locales/zh-CN";
import type {
  LocaleDefinition,
  MessageKey,
  MessageParams,
  WorldCountryTranslation,
} from "./types";

const DEFAULT_LOCALE = "en";
const SOURCE_LOCALE = "zh-CN";
const STORAGE_KEY = "worldride.locale";

const localeRegistry = {
  "zh-CN": zhCN as LocaleDefinition,
  en: en as LocaleDefinition,
  fr: fr as LocaleDefinition,
  "pt-BR": ptBR as LocaleDefinition,
  it: it as LocaleDefinition,
  es: es as LocaleDefinition,
};

export type LocaleCode = keyof typeof localeRegistry;

let activeLocale: LocaleCode = detectInitialLocale();
const listeners = new Set<(locale: LocaleCode) => void>();

export function initializeI18n(): void {
  applyDocumentLanguage();
}

export function getLocale(): LocaleCode {
  return activeLocale;
}

export function getSupportedLocales(): readonly LocaleDefinition[] {
  return Object.values(localeRegistry);
}

export function setLocale(locale: string): boolean {
  const resolved = resolveLocale(locale);
  if (!resolved || resolved === activeLocale) {
    return Boolean(resolved);
  }

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
  const message =
    localeRegistry[activeLocale].messages[key] ??
    localeRegistry[DEFAULT_LOCALE].messages[key];
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
  const translation =
    localeRegistry[activeLocale].countries[country.id] ??
    (activeLocale === SOURCE_LOCALE
      ? undefined
      : localeRegistry[DEFAULT_LOCALE].countries[country.id]);
  if (!translation) {
    return country;
  }

  return {
    ...country,
    name: translation.name,
    intro: translation.intro,
    facts:
      translation.facts ??
      (activeLocale === SOURCE_LOCALE
        ? country.facts
        : []),
    city: {
      ...country.city,
      name: translation.cityName,
    },
  };
}

export function localizePhotoSpot(
  spot: PhotoSpotDefinition,
): PhotoSpotDefinition {
  const translation =
    localeRegistry[activeLocale].photoSpots[spot.id] ??
    (activeLocale === SOURCE_LOCALE
      ? undefined
      : localeRegistry[DEFAULT_LOCALE].photoSpots[spot.id]);
  return translation ? { ...spot, ...translation } : spot;
}

export function getWorldCountryTranslation(
  atlasName: string,
): WorldCountryTranslation {
  return (
    localeRegistry[activeLocale].worldCountries[atlasName] ??
    (activeLocale === SOURCE_LOCALE
      ? {}
      : localeRegistry[DEFAULT_LOCALE].worldCountries[atlasName]) ??
    {}
  );
}

function applyDocumentLanguage(): void {
  const locale = localeRegistry[activeLocale];
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
  const entries = Object.entries(localeRegistry) as readonly [
    LocaleCode,
    LocaleDefinition,
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

function formatMessage(message: string, params?: MessageParams): string {
  if (!params) {
    return message;
  }
  return message.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(params, key) ? String(params[key]) : placeholder,
  );
}
