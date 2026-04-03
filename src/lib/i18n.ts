import enCommon from "@/locales/en/common.json";
import skCommon from "@/locales/sk/common.json";

export const locales = ["en", "sk"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const languageStorageKey = "sitepulse.locale";

type Dictionary = typeof enCommon;
type MessageParams = Record<string, string | number>;

const dictionaries: Record<Locale, Dictionary> = {
  en: enCommon,
  sk: skCommon,
};

function getMessage(locale: Locale, key: string): string | null {
  const dictionary = dictionaries[locale] as Record<string, unknown>;
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return null;
    return (current as Record<string, unknown>)[segment];
  }, dictionary);

  return typeof value === "string" ? value : null;
}

export function translate(
  locale: Locale,
  key: string,
  params?: MessageParams,
): string {
  const template =
    getMessage(locale, key) ??
    getMessage(defaultLocale, key) ??
    key;

  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (_, token: string) => {
    const value = params[token];
    return value == null ? `{{${token}}}` : String(value);
  });
}
