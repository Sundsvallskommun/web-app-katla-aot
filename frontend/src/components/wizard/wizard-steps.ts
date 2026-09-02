export interface WizardStep {
  id: string;
  titleKey: string;
}

export const ALL_WIZARD_STEPS: WizardStep[] = [
  { id: 'about', titleKey: 'errand-information:about.title' },
  { id: 'owner', titleKey: 'errand-information:owner.title' },
  { id: 'other-parties', titleKey: 'errand-information:other_parties.title' },
  { id: 'details', titleKey: 'errand-information:errand_details.title' },
  { id: 'summary', titleKey: 'errand-information:wizard.summary' },
];

/**
 * Övriga parter ligger bakom en funktionsflagga och renderas som ett eget avsnitt även på
 * desktop, så steget utgår helt när flaggan är av i stället för att visa ett tomt steg.
 */
export function getActiveWizardSteps(otherPartiesEnabled: boolean): WizardStep[] {
  if (otherPartiesEnabled) {
    return ALL_WIZARD_STEPS;
  }
  return ALL_WIZARD_STEPS.filter((step) => step.id !== 'other-parties');
}
