import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const locales = ["en", "ko"] as const;
export type Locale = (typeof locales)[number];

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return "en";

  const languages = acceptLanguage
    .split(",")
    .map((lang) => lang.split(";")[0].trim().toLowerCase());

  for (const lang of languages) {
    if (lang.startsWith("ko")) return "ko";
    if (lang.startsWith("en")) return "en";
  }

  return "en";
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Check saved language setting in cookies
  let locale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;

  // If no cookie, detect automatically from Accept-Language header
  if (!locale) {
    const acceptLanguage = headersList.get("accept-language");
    locale = getLocaleFromAcceptLanguage(acceptLanguage);
  }

  // Verify valid locale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
