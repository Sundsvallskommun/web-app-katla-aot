import { isValidUrl } from '@utils/util';

import { ORIGIN } from '@/config';

const getAllowedOrigins = (): string[] =>
  (ORIGIN ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin !== '');

export const isValidOrigin = (url: string): boolean => {
  try {
    return getAllowedOrigins().includes(new URL(url).origin);
  } catch {
    return false;
  }
};

/**
 * Returns the candidate URL only when its origin is explicitly allowlisted.
 * Rebuilding it from the configured origin prevents user-controlled schemes or hosts.
 */
export const getSafeRedirect = (candidate: unknown, fallback: string): string => {
  if (typeof candidate !== 'string' || !isValidUrl(candidate)) {
    return fallback;
  }

  const candidateUrl = new URL(candidate);
  const allowedOrigin = getAllowedOrigins().find(origin => origin === candidateUrl.origin);
  if (!allowedOrigin) {
    return fallback;
  }

  return `${allowedOrigin}${candidateUrl.pathname}${candidateUrl.search}${candidateUrl.hash}`;
};

export const getSamlRedirects = (relayState: unknown, successFallback: string): { successRedirect: URL; failureRedirect: URL } => {
  const urls = typeof relayState === 'string' ? relayState.split(',') : [];
  const successRedirect = new URL(getSafeRedirect(urls[0], successFallback));
  const failureRedirect = new URL(getSafeRedirect(urls[1], successRedirect.toString()));

  return { successRedirect, failureRedirect };
};
