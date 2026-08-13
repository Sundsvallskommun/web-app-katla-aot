/**
 * Lokalisering av schema och ui-schema.
 *
 * Visningstexten för avvikelseformuläret ligger i ui-schemat, inte i JSON-schemat — där
 * finns bara datadefinitionerna. Översättningarna lagras därför som ett `x-i18n`-block
 * bredvid den svenska texten, och löses upp här innan svaret går ut.
 *
 * Att lagra dem i ui-schemat och inte i JSON-schemat är avsiktligt: ui-schemat skrivs med
 * PUT och lämnar schemats ID orört, medan varje ändring i JSON-schemat kräver en ny version.
 * Ärenden pinnas till sitt schema-ID, så en rättad översättning får inte skapa en ny version.
 *
 * Verifierat mot jsonschema-API:t i test: okända nycklar som `x-i18n` bevaras i ui-schemats
 * lagrade värde, både på fält- och rotnivå.
 */

/** Nyckeln översättningarna lagras under. Får aldrig följa med ut i svaret. */
export const LOCALE_EXTENSION_KEY = 'x-i18n';

export const DEFAULT_LOCALE = 'sv';
export const SUPPORTED_LOCALES = ['sv', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSupportedLocale = (value: string): value is SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

/**
 * Plockar första begripliga språket ur en Accept-Language-header. Frontend skickar en ren
 * språkkod, men headern kan komma från andra klienter i standardform ("en-GB,en;q=0.9"),
 * så både region och kvalitetsvikt tolereras. Okända språk faller tillbaka på svenska
 * i stället för att avvisas — ett formulär ska aldrig sluta ladda för att språket är okänt.
 */
export const localeFromAcceptLanguage = (header: string | undefined): SupportedLocale => {
  for (const part of (header ?? '').split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase() ?? '';
    if (!tag || tag === '*') continue;

    if (isSupportedLocale(tag)) return tag;

    const base = tag.split('-')[0] ?? '';
    if (isSupportedLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
};

/**
 * Går igenom strukturen och ersätter varje nod som bär `x-i18n` med sin översatta variant.
 * Blocket tas alltid bort, även när språket saknas — annars skulle den svenska texten och
 * alla andra språk läcka ut till klienten som död vikt i varje svar.
 *
 * Sammanslagningen är ytlig per nod: översättningsblocket ersätter hela nycklar som
 * `ui:title`. Det räcker för visningstext och gör resultatet förutsägbart.
 */
export const resolveLocaleExtensions = (value: unknown, locale: string): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => resolveLocaleExtensions(entry, locale));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const resolved: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === LOCALE_EXTENSION_KEY) continue;
    resolved[key] = resolveLocaleExtensions(entry, locale);
  }

  const translations = value[LOCALE_EXTENSION_KEY];
  if (isPlainObject(translations)) {
    const forLocale = translations[locale];
    if (isPlainObject(forLocale)) {
      for (const [key, entry] of Object.entries(forLocale)) {
        resolved[key] = resolveLocaleExtensions(entry, locale);
      }
    }
  }

  return resolved;
};

export const localizeUiSchema = (uiSchema: Record<string, unknown>, locale: string): Record<string, unknown> =>
  resolveLocaleExtensions(uiSchema, locale) as Record<string, unknown>;

/**
 * JSON-schemats rubrik är den enda visningstexten utanför ui-schemat, och den kan bara ändras
 * genom en ny schemaversion. Den översätts därför via ett `ui:title` i ui-schemats rot, som
 * skrivs in i schemakopian här. Utan det steget skulle felsammanfattningen i formuläret
 * namnge schemat på svenska i ett engelskt gränssnitt.
 */
export const applyUiSchemaTitleToSchema = (
  schema: Record<string, unknown>,
  localizedUiSchema: Record<string, unknown>,
): Record<string, unknown> => {
  const uiTitle = localizedUiSchema['ui:title'];
  if (typeof uiTitle !== 'string' || uiTitle.trim().length === 0) {
    return schema;
  }

  return { ...schema, title: uiTitle };
};
