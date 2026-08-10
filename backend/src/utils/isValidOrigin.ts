import { ORIGIN } from '@/config';
import { isValidUrl } from '@utils/util';

const getAllowedOrigins = (): string[] =>
  ORIGIN.split(',')
    .map(origin => origin.trim())
    .filter(origin => origin !== '');

export const isValidOrigin = (url: string): boolean => {
  const origin = new URL(url).origin;
  return getAllowedOrigins().includes(origin);
};

/**
 * Returnerar en säker redirect-URL: kandidatens origin måste finnas i ORIGIN-vitlistan,
 * annars returneras fallback. URL:en byggs om från det vitlistade originet (konfigvärde)
 * så att en angripare aldrig kan styra schema eller värd.
 */
export const getSafeRedirect = (candidate: unknown, fallback: string): string => {
  if (typeof candidate !== 'string' || !isValidUrl(candidate)) {
    return fallback;
  }
  const url = new URL(candidate);
  const allowedOrigin = getAllowedOrigins().find(origin => origin === url.origin);
  if (!allowedOrigin) {
    return fallback;
  }
  return `${allowedOrigin}${url.pathname}${url.search}${url.hash}`;
};

export const getSamlRedirects = (
  relayState: unknown,
  successFallback: string,
): { successRedirect: URL; failureRedirect: URL } => {
  const urls = typeof relayState === 'string' ? relayState.split(',') : [];
  const successRedirect = new URL(getSafeRedirect(urls[0], successFallback));
  const failureRedirect = new URL(getSafeRedirect(urls[1], successRedirect.toString()));

  return { successRedirect, failureRedirect };
};
