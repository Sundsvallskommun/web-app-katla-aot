/**
 * Fältkontroller som visar ett valideringsfel märks med det här attributet. Felnavigeringen
 * kan då hitta första felet i dokumentordning utan att känna till formulärens uppbyggnad,
 * vilket krävs eftersom felen kommer både från JSON-schemat och från handskrivna fält.
 */
export const INVALID_FIELD_ATTRIBUTE = 'data-invalid-field';

const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Hopfällda avsnitt (Disclosure) renderar sitt innehåll men döljer det. Regionerna hittas
 * via ARIA i stället för klassnamn, så samma navigering fungerar för alla avsnitt i appen.
 */
function collapsedRegionsAround(field: HTMLElement): HTMLElement[] {
  const regions: HTMLElement[] = [];
  let current: HTMLElement | null = field;

  while (current) {
    const region: HTMLElement | null = current.closest('[role="region"][aria-hidden="true"]');
    if (!region) break;
    // Yttersta avsnittet först, annars går de inre inte att öppna.
    regions.unshift(region);
    current = region.parentElement;
  }

  return regions;
}

function expandCollapsedRegions(field: HTMLElement): void {
  for (const region of collapsedRegionsAround(field)) {
    const toggles = document.querySelectorAll<HTMLElement>('[aria-expanded="false"][aria-controls]');
    for (const toggle of toggles) {
      if (toggle.getAttribute('aria-controls') === region.id) {
        toggle.click();
        break;
      }
    }
  }
}

function scrollIntoView(element: HTMLElement): void {
  // jsdom saknar scrollIntoView, och äldre webbläsare saknar stöd för optionsobjektet.
  if (typeof element.scrollIntoView !== 'function') return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/** Returnerar false när fältet inte gick att fokusera, t.ex. för att avsnittet fortfarande är dolt. */
function revealField(field: HTMLElement): boolean {
  const focusTarget = field.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  focusTarget?.focus({ preventScroll: true });
  scrollIntoView(focusTarget ?? field);

  return focusTarget !== null && document.activeElement === focusTarget;
}

/**
 * Flyttar fokus till första fältet som visar ett valideringsfel, öppnar avsnittet det ligger i
 * och rullar fram det. Returnerar false när inget felmarkerat fält finns.
 */
export function focusFirstInvalidField(root: ParentNode = document): boolean {
  const field = root.querySelector<HTMLElement>(`[${INVALID_FIELD_ATTRIBUTE}]`);
  if (!field) return false;

  expandCollapsedRegions(field);

  if (!revealField(field)) {
    // Ett avsnitt som fälls ut i en senare uppdatering hinner inte göra fältet fokuserbart.
    requestAnimationFrame(() => {
      revealField(field);
    });
  }

  return true;
}
