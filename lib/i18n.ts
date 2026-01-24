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

  // 쿠키에서 저장된 언어 설정 확인
  let locale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;

  // 쿠키가 없으면 Accept-Language 헤더에서 자동으로 감지
  if (!locale) {
    const acceptLanguage = headersList.get("accept-language");
    locale = getLocaleFromAcceptLanguage(acceptLanguage);
  }

  // 유효한 locale 확인
  if (!locale || !locales.includes(locale as Locale)) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
