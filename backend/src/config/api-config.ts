//Subscribed APIS as lowercased
export const APIS = [
  {
    name: 'simulatorserver',
    version: '2.0',
  },
  {
    name: 'supportmanagement',
    version: '12.4',
  },
  {
    name: 'supportmanagement-sprint',
    version: '14.14',
  },
  {
    name: 'employee',
    version: '2.0',
  },
  {
    name: 'citizen',
    version: '3.0',
  },
  {
    name: 'company',
    version: '1.0',
  },
  {
    name: 'jsonschema',
    version: '1.0',
  },
] as const;

// Temporary routing for the Support Management development sprint.
// Remove this alias and rename the APIS entry when the sprint API is retired.
const API_SERVICE_ALIASES: Readonly<Record<string, string>> = {
  supportmanagement: 'supportmanagement-sprint',
};

export function getApiBase(name: string): string {
  const resolvedName = API_SERVICE_ALIASES[name] ?? name;
  const api = APIS.find(a => a.name === resolvedName);
  return api ? `${api.name}/${api.version}` : name;
}
