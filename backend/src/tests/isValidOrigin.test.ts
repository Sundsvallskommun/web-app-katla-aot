import { getSafeRedirect, getSamlRedirects, isValidOrigin } from '@/utils/isValidOrigin';

describe('redirect origin validation', () => {
  const fallback = 'http://localhost:3000/login';

  it('preserves path, query and fragment for an allowed origin', () => {
    const candidate = 'http://localhost:3000/arenden?status=OPEN#details';

    expect(isValidOrigin(candidate)).toBe(true);
    expect(getSafeRedirect(candidate, fallback)).toBe(candidate);
  });

  it.each([
    ['an untrusted origin', 'https://evil.example/arenden'],
    ['a lookalike host', 'http://localhost:3000.evil.example/arenden'],
    ['an invalid URL', 'not-a-url'],
    ['a missing candidate', undefined],
  ])('uses the fallback for %s', (_description, candidate) => {
    expect(getSafeRedirect(candidate, fallback)).toBe(fallback);
  });

  it('uses the configured fallback for missing RelayState', () => {
    const { successRedirect, failureRedirect } = getSamlRedirects(undefined, fallback);

    expect(successRedirect.toString()).toBe(fallback);
    expect(failureRedirect.toString()).toBe(fallback);
  });

  it('rejects untrusted RelayState redirects independently', () => {
    const { successRedirect, failureRedirect } = getSamlRedirects(
      'https://evil.example/success,http://localhost:3000/failure',
      fallback,
    );

    expect(successRedirect.toString()).toBe(fallback);
    expect(failureRedirect.toString()).toBe('http://localhost:3000/failure');
  });
});
