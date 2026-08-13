const i18nConfig = {
  locales: ['sv', 'en'],
  defaultLocale: 'sv',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  // Språket är ett aktivt val, inte något vi gissar utifrån Accept-Language. Delar av
  // innehållet (schemats fältetiketter, platsstrukturen, statusar) levereras fortfarande
  // enbart på svenska från API:erna, så en engelsk webbläsare ska inte automatiskt hamna
  // i ett halvöversatt gränssnitt. Valet sparas i NEXT_LOCALE-kakan av språkväljaren.
  localeDetector: false as const,
};

export default i18nConfig;
