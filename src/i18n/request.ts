import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// proxy.ts (next-intl middleware) reads the locale from the URL and forwards it in this header.
// It is the most reliable source, so it comes first. During static prerendering there are no
// headers: we fall back to what next-intl detected.
async function localeFromProxy() {
  try {
    return (await headers()).get("x-next-intl-locale") ?? undefined;
  } catch {
    return undefined;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const fromProxy = await localeFromProxy();
  const requested = hasLocale(routing.locales, fromProxy)
    ? fromProxy
    : await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Africa/Kinshasa", // same rendering on server and client
  };
});
