import { ErrandFormDTO } from '@interfaces/errand-form';

const STORAGE_KEY = 'errand-form-handover';

/**
 * Hur länge en överlämning får ligga kvar. Navigeringen sker på klienten och är i praktiken
 * omedelbar, så fönstret behöver bara täcka den. Utan det skulle en överlämning som av någon
 * anledning aldrig hämtades kunna dyka upp i ett tomt formulär långt senare.
 */
const MAX_AGE_MS = 10_000;

export interface ErrandFormHandover {
  /** Sökvägen utan språkprefix, så att överlämningen bara gäller sidan den skrevs på. */
  path: string;
  values: ErrandFormDTO;
  wizardStep: number;
  storedAt: number;
}

/**
 * Ett språkbyte är en navigering till en annan route, och hela ärendeträdet monteras om.
 * Formuläret lever bara i minnet, så utan den här överlämningen förlorar användaren allt
 * hen fyllt i genom att byta språk mitt i registreringen – priset för att byta språk blir
 * att börja om.
 */
export const storeErrandFormHandover = (handover: Omit<ErrandFormHandover, 'storedAt'>): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...handover, storedAt: Date.now() }));
  } catch {
    // Utan lagring faller vi tillbaka på det tidigare beteendet – ett tomt formulär – i
    // stället för att låta själva språkbytet krascha.
  }
};

/**
 * Läser överlämningen en gång och tar bort den. Den ska överleva just den navigering som
 * skrev den, inte återuppstå nästa gång användaren öppnar ett tomt formulär.
 */
export const takeErrandFormHandover = (path: string): ErrandFormHandover | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    sessionStorage.removeItem(STORAGE_KEY);

    const handover = JSON.parse(stored) as ErrandFormHandover;
    if (handover.path !== path) return null;
    if (Date.now() - handover.storedAt > MAX_AGE_MS) return null;

    return handover;
  } catch {
    return null;
  }
};
