import { LabelDTO } from '@data-contracts/backend/data-contracts';
import {
  findPlaceNode,
  findPlaceNodeByKey,
  getPlaceNodes,
  getPlaceStructureRoot,
  getSubPlaceNodes,
  hasSubPlaces,
  placeKey,
  placeLabelChainText,
  PlaceNode,
  placeParentName,
  placePathText,
  qualifiedPlaceName,
  toErrandLabels,
} from '@utils/label-structure';
import { describe, expect, it } from 'vitest';

const label = (name: string, resourcePath: string, labels: LabelDTO[] = []): LabelDTO => ({
  id: resourcePath,
  classification: 'PLACE',
  displayName: name,
  resourceName: resourcePath.split('/').pop() ?? resourcePath,
  resourcePath,
  labels,
});

const labelStructure: LabelDTO[] = [
  {
    id: 'uncategorized',
    classification: 'CATEGORY',
    displayName: 'Kategori',
    resourceName: 'UNCATEGORIZED',
    resourcePath: 'UNCATEGORIZED',
    labels: [],
  },
  {
    id: 'platsstruktur',
    classification: 'PLACE',
    displayName: 'Platsstruktur',
    resourceName: 'PLATSSTRUKTUR',
    resourcePath: 'PLATSSTRUKTUR',
    labels: [
      label('VOF Äldreboende', 'PLATSSTRUKTUR/VOF_ALDREBOENDE', [
        label('VOF ÄB Skottsundsbacken', 'PLATSSTRUKTUR/VOF_ALDREBOENDE/SKOTTSUNDSBACKEN', [
          label('VOF ÄB Skottsundsbacken geme.', 'PLATSSTRUKTUR/VOF_ALDREBOENDE/SKOTTSUNDSBACKEN/GEME', [
            label('Blå', 'PLATSSTRUKTUR/VOF_ALDREBOENDE/SKOTTSUNDSBACKEN/GEME/BLA'),
            label('Gul', 'PLATSSTRUKTUR/VOF_ALDREBOENDE/SKOTTSUNDSBACKEN/GEME/GUL'),
            label('Röd', 'PLATSSTRUKTUR/VOF_ALDREBOENDE/SKOTTSUNDSBACKEN/GEME/ROD'),
          ]),
        ]),
        label('VOF ÄB Solhaga', 'PLATSSTRUKTUR/VOF_ALDREBOENDE/SOLHAGA', [
          label('VOF ÄB Solhaga geme.', 'PLATSSTRUKTUR/VOF_ALDREBOENDE/SOLHAGA/GEME', [
            label('Blå', 'PLATSSTRUKTUR/VOF_ALDREBOENDE/SOLHAGA/GEME/BLA'),
          ]),
        ]),
      ]),
    ],
  },
];

const placeNodes = getPlaceNodes(labelStructure);

const requirePlace = (name: string, parentName?: string): PlaceNode => {
  const node = findPlaceNode(placeNodes, name, parentName);
  if (!node) throw new Error(`Hittade ingen plats för "${name}"`);
  return node;
};

describe('label-structure', () => {
  it('hittar platsstrukturens rot och ingen annan rotnod', () => {
    expect(getPlaceStructureRoot(labelStructure)?.resourceName).toBe('PLATSSTRUKTUR');
    expect(getPlaceStructureRoot([labelStructure[0]])).toBeUndefined();
  });

  it('plattar ut alla noder under roten men inte roten själv', () => {
    expect(placeNodes).toHaveLength(9);
    expect(placeNodes.map((node) => node.label.displayName)).not.toContain('Platsstruktur');
  });

  it('slår upp en nod på namn oberoende av skiftläge och extra mellanslag', () => {
    const node = requirePlace('  vof äb  skottsundsbacken geme. ');

    expect(node.label.resourcePath).toBe('PLATSSTRUKTUR/VOF_ALDREBOENDE/SKOTTSUNDSBACKEN/GEME');
    expect(hasSubPlaces(node)).toBe(true);
  });

  it('vägrar gissa när sista nivåns namn finns på flera ställen', () => {
    expect(findPlaceNode(placeNodes, 'Blå')).toBeUndefined();
  });

  it('särskiljer sista nivån med hjälp av föräldern', () => {
    const node = requirePlace('Blå', 'VOF ÄB Skottsundsbacken geme.');

    expect(node.label.resourcePath).toBe('PLATSSTRUKTUR/VOF_ALDREBOENDE/SKOTTSUNDSBACKEN/GEME/BLA');
    expect(qualifiedPlaceName(node)).toBe('VOF ÄB Skottsundsbacken geme. Blå');
    expect(placeParentName(node)).toBe('VOF ÄB Skottsundsbacken geme.');
    expect(hasSubPlaces(node)).toBe(false);
  });

  it('utelämnar roten i sökvägstexten men har med den i labelkedjan', () => {
    const node = requirePlace('Blå', 'VOF ÄB Solhaga geme.');

    expect(placePathText(node)).toBe('VOF Äldreboende › VOF ÄB Solhaga › VOF ÄB Solhaga geme. › Blå');
    expect(placeLabelChainText(node)).toBe(
      'Platsstruktur › VOF Äldreboende › VOF ÄB Solhaga › VOF ÄB Solhaga geme. › Blå'
    );
  });

  it('ger toppnivåns platser inget föräldrapåhäng', () => {
    const node = requirePlace('VOF Äldreboende');

    expect(placeParentName(node)).toBeUndefined();
    expect(qualifiedPlaceName(node)).toBe('VOF Äldreboende');
  });

  it('returnerar direkta barn till en nod', () => {
    const parent = requirePlace('VOF ÄB Skottsundsbacken geme.');

    expect(getSubPlaceNodes(placeNodes, parent).map((node) => node.label.displayName)).toEqual(['Blå', 'Gul', 'Röd']);
  });

  it('hittar tillbaka till noden via sin nyckel', () => {
    const node = requirePlace('Gul', 'VOF ÄB Skottsundsbacken geme.');

    expect(findPlaceNodeByKey(placeNodes, placeKey(node))?.label.id).toBe(node.label.id);
  });

  it('bygger labelkedjan från roten ner till valet, utan underliggande barn', () => {
    const node = requirePlace('Blå', 'VOF ÄB Skottsundsbacken geme.');
    const labels = toErrandLabels(node);

    expect(labels.map((l) => l.resourceName)).toEqual([
      'PLATSSTRUKTUR',
      'VOF_ALDREBOENDE',
      'SKOTTSUNDSBACKEN',
      'GEME',
      'BLA',
    ]);
    expect(labels.every((l) => !('labels' in l))).toBe(true);
  });
});
