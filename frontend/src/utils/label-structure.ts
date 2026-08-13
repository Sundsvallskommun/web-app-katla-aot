import { LabelDTO } from '@data-contracts/backend/data-contracts';

/**
 * Labelstrukturen används för rättighetsstyrning i Support Management. Platsvalet måste därför peka
 * ut en nod som faktiskt finns i strukturen — både sökningen och ärendets labels byggs från det här
 * trädet istället för från organisationsträdet i company-API:t.
 */
const PLACE_STRUCTURE_ROOT_NAMES = ['platsstruktur', 'place_structure', 'placestructure'];
const PLACE_STRUCTURE_ROOT_LEVEL = 2;
const PLACE_LEVEL = 6;
const DEPARTMENT_LEVEL = 7;

export interface PlaceNode {
  /** Labelnoden själv */
  label: LabelDTO;
  /** Kedjan från platsstrukturens rot ner till och med noden */
  path: LabelDTO[];
}

export interface PlaceSelectionPresentation {
  place: string;
  department?: string;
}

export const normalizeLabelName = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export const labelName = (label: LabelDTO): string => label.displayName ?? label.resourceName;

/** Identitet i första hand på id och resourcePath, som är unika i hela strukturen */
export const isSameLabel = (a: LabelDTO | undefined, b: LabelDTO | undefined): boolean => {
  if (!a || !b) return false;
  if (a.id && b.id) return a.id === b.id;
  if (a.resourcePath && b.resourcePath) return a.resourcePath === b.resourcePath;
  return normalizeLabelName(a.resourceName) === normalizeLabelName(b.resourceName);
};

export const getPlaceStructureRoot = (labelStructure: LabelDTO[] | undefined): LabelDTO | undefined =>
  labelStructure?.find(
    (label) =>
      PLACE_STRUCTURE_ROOT_NAMES.includes(normalizeLabelName(label.resourceName)) ||
      PLACE_STRUCTURE_ROOT_NAMES.includes(normalizeLabelName(label.displayName))
  );

/** Alla noder under platsstrukturens rot, var och en med sin väg från roten */
export const flattenPlaceNodes = (root: LabelDTO | undefined): PlaceNode[] => {
  if (!root) return [];

  const nodes: PlaceNode[] = [];
  const traverse = (label: LabelDTO, ancestors: LabelDTO[]) => {
    const path = [...ancestors, label];
    nodes.push({ label, path });
    label.labels?.forEach((child) => {
      traverse(child, path);
    });
  };

  root.labels?.forEach((child) => {
    traverse(child, [root]);
  });

  return nodes;
};

export const getPlaceNodes = (labelStructure: LabelDTO[] | undefined): PlaceNode[] =>
  flattenPlaceNodes(getPlaceStructureRoot(labelStructure));

export const hasSubPlaces = (node: PlaceNode): boolean => (node.label.labels?.length ?? 0) > 0;

export const placeName = (node: PlaceNode): string => labelName(node.label);

/** Föräldern inom platsstrukturen. Roten räknas inte som förälder. */
export const placeParentName = (node: PlaceNode): string | undefined => {
  const parent = node.path[node.path.length - 2];
  return parent && !isSameLabel(parent, node.path[0]) ? labelName(parent) : undefined;
};

/**
 * Namn kvalificerat med föräldern. Sista nivån är inte unik i sig — "Blå" finns under flera
 * enheter — så "VOF ÄB Skottsundsbacken geme. Blå" är det som identifierar platsen för en läsare.
 */
export const qualifiedPlaceName = (node: PlaceNode): string => {
  const parentName = placeParentName(node);
  return parentName ? `${parentName} ${placeName(node)}` : placeName(node);
};

const labelAtLevel = (node: PlaceNode, level: number): LabelDTO | undefined =>
  node.path[level - PLACE_STRUCTURE_ROOT_LEVEL];

/**
 * Nivå 6 är platsen som visas. Nivå 7 är en valfri avdelning under platsen.
 * För ett ännu ofullständigt val på nivå 3–5 visas den aktuella noden tills användaren valt vidare.
 */
export const getPlaceSelectionPresentation = (node: PlaceNode): PlaceSelectionPresentation => {
  const place = labelAtLevel(node, PLACE_LEVEL) ?? node.label;
  const department = labelAtLevel(node, DEPARTMENT_LEVEL);

  return {
    place: labelName(place),
    ...(department ? { department: labelName(department) } : {}),
  };
};

/** Sökindexet innehåller samtliga användarnivåer 3–7 men inte den tekniska roten på nivå 2. */
export const placeSearchText = (node: PlaceNode): string =>
  node.path
    .slice(1, DEPARTMENT_LEVEL - PLACE_STRUCTURE_ROOT_LEVEL + 1)
    .map(labelName)
    .join(' ');

/** Sökord får ligga på olika nivåer i strukturen och behöver därför inte stå direkt efter varandra. */
export const matchesPlaceSearch = (node: PlaceNode, query: string): boolean => {
  const searchableText = normalizeLabelName(placeSearchText(node));
  const terms = normalizeLabelName(query).split(' ').filter(Boolean);
  return terms.every((term) => searchableText.includes(term));
};

export const placeKey = (node: PlaceNode): string => node.label.resourcePath ?? node.path.map(labelName).join('/');

export const findPlaceNodeByKey = (nodes: PlaceNode[], key: string): PlaceNode | undefined =>
  nodes.find((node) => placeKey(node) === key);

/** Närmaste föräldern inom platsstrukturen. Den tekniska roten returneras aldrig som valbar plats. */
export const getParentPlaceNode = (nodes: PlaceNode[], node: PlaceNode): PlaceNode | undefined => {
  const parentLabel = node.path.at(-2);
  if (!parentLabel || isSameLabel(parentLabel, node.path[0])) return undefined;

  return nodes.find((candidate) => isSameLabel(candidate.label, parentLabel));
};

/** Direkta barn till en nod, som PlaceNode så att de bär med sig hela sin väg */
export const getSubPlaceNodes = (nodes: PlaceNode[], parent: PlaceNode): PlaceNode[] =>
  nodes.filter((node) => node.path.length === parent.path.length + 1 && isSameLabel(node.path.at(-2), parent.label));

/**
 * Slår upp en nod på visningsnamn. Namnet ensamt räcker inte på sista nivån, så föräldern används
 * som kvalificerare. Flera träffar räknas som ingen träff — då får användaren välja själv istället
 * för att vi gissar och sätter fel label på ärendet.
 */
export const findPlaceNode = (
  nodes: PlaceNode[],
  name: string | undefined,
  parentName?: string
): PlaceNode | undefined => {
  const wanted = normalizeLabelName(name);
  if (!wanted) return undefined;

  const matches = nodes.filter((node) => normalizeLabelName(placeName(node)) === wanted);
  if (matches.length <= 1) return matches[0];

  const wantedParent = normalizeLabelName(parentName);
  if (!wantedParent) return undefined;

  const withParent = matches.filter((node) => normalizeLabelName(placeParentName(node)) === wantedParent);
  return withParent.length === 1 ? withParent[0] : undefined;
};

export const isDescendantOrSelf = (node: PlaceNode, ancestor: PlaceNode): boolean =>
  node.path.some((label) => isSameLabel(label, ancestor.label));

/** Labelkedjan som sätts på ärendet: roten och varje nod ner till valet, utan underliggande barn */
export const toErrandLabels = (node: PlaceNode): LabelDTO[] =>
  node.path.map((label) => ({
    id: label.id,
    classification: label.classification,
    displayName: label.displayName,
    resourcePath: label.resourcePath,
    resourceName: label.resourceName,
  }));
