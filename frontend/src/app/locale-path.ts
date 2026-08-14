import i18nConfig from './i18nConfig';

const isSupportedLocale = (value: string): boolean => i18nConfig.locales.includes(value);

const firstSegmentOf = (path: string): string => path.replace(/^\//, '').split('/')[0] ?? '';

/**
 * Sökvägarna som hanteras här är alltid utan basePath — både `nextUrl.pathname` i proxyn
 * och `usePathname()` i klienten utelämnar det, och `router.push()` lägger tillbaka det.
 */

/**
 * Plockar ut språket ur sökvägens första segment. Standardspråket saknar prefix
 * (prefixDefault är av i next-i18n-router), så en sökväg utan känt språksegment
 * tolkas som standardspråket.
 */
export const localeFromPath = (path: string | null | undefined): string => {
  const firstSegment = firstSegmentOf(path ?? '');
  return isSupportedLocale(firstSegment) ? firstSegment : i18nConfig.defaultLocale;
};

/**
 * Tar bort ett eventuellt språkprefix. Används för jämförelser som ska vara språkoberoende
 * – utan detta skulle t.ex. en lista över skyddade rutter sluta matcha så fort sökvägen
 * bär ett språkprefix.
 */
export const pathWithoutLocale = (path: string | null | undefined): string => {
  const value = path ?? '';
  const firstSegment = firstSegmentOf(value);
  if (!isSupportedLocale(firstSegment)) return value || '/';
  return value.slice(`/${firstSegment}`.length) || '/';
};

/**
 * Bygger sökvägen till samma sida på ett annat språk, alltid med uttryckligt språkprefix.
 * Prefixet behålls även för standardspråket: proxyn skriver då om NEXT_LOCALE-kakan och
 * skalar bort prefixet igen, vilket är det som gör att valet överlever nästa navigering.
 */
export const pathWithLocale = (path: string | null | undefined, locale: string): string => {
  const base = pathWithoutLocale(path);
  return `/${locale}${base === '/' ? '' : base}`;
};
