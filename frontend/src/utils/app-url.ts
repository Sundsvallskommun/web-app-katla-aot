export const appURL = (path?: string): string => {
  // (path ?? '') || … bevarar ||-semantiken: tom sträng ska falla tillbaka till bassökvägen
  return `${window.location.origin}${(path ?? '') || process.env.NEXT_PUBLIC_BASE_PATH}`;
};
