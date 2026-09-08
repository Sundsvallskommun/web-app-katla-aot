import { describe, expect, it } from 'vitest';

import { Label } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { selectCategorizationSubtree, withCategorizationSubtree } from '@/utils/categorization-root';

const type = (resourceName: string, parentPath: string): Label => ({
  classification: 'TYPE',
  resourceName,
  resourcePath: `${parentPath}/${resourceName}`,
  labels: [],
});

const category = (resourceName: string, types: string[]): Label => ({
  classification: 'CATEGORY',
  resourceName,
  resourcePath: `CATEGORYROOT/${resourceName}`,
  labels: types.map(name => type(name, `CATEGORYROOT/${resourceName}`)),
});

/** Shaped after docs/label-structure.json: the root plus an UNCATEGORIZED sibling of its own. */
const labelStructure = (): Label[] => [
  {
    classification: 'CATEGORY_ROOT',
    resourceName: 'CATEGORYROOT',
    resourcePath: 'CATEGORYROOT',
    labels: [category('ALCOHOL', ['SERVING_PERMIT_APPLICATION', 'INSPECTION']), category('TOBACCO', ['INSPECTION'])],
  },
  {
    classification: 'CATEGORY',
    resourceName: 'UNCATEGORIZED',
    resourcePath: 'UNCATEGORIZED',
    labels: [type('UNCATEGORIZED', 'UNCATEGORIZED')],
  },
];

describe('categorization root', () => {
  it('returns the children of the CATEGORY_ROOT node as the tree', () => {
    const subtree = selectCategorizationSubtree(labelStructure());

    expect(subtree.map(label => label.resourceName)).toEqual(['ALCOHOL', 'TOBACCO']);
    expect(subtree.every(label => label.classification === 'CATEGORY')).toBe(true);
  });

  it('drops the UNCATEGORIZED sibling that lives outside the root', () => {
    const subtree = selectCategorizationSubtree(labelStructure());

    expect(JSON.stringify(subtree)).not.toContain('UNCATEGORIZED');
  });

  it('keeps the upstream resourcePath so a stored label still carries its full path', () => {
    const [alcohol] = selectCategorizationSubtree(labelStructure());

    expect(alcohol?.resourcePath).toBe('CATEGORYROOT/ALCOHOL');
    expect(alcohol?.labels?.[0]?.resourcePath).toBe('CATEGORYROOT/ALCOHOL/SERVING_PERMIT_APPLICATION');
  });

  it.each([
    ['no root', []],
    ['no label structure', undefined],
  ])('fails closed with %s rather than returning an empty tree', (_case, structure) => {
    expect(() => selectCategorizationSubtree(structure as Label[] | undefined)).toThrow(
      expect.objectContaining<Partial<HttpException>>({ status: 502 }),
    );
  });

  it('fails closed when more than one root is classified CATEGORY_ROOT', () => {
    const structure = labelStructure();
    structure.push({ classification: 'CATEGORY_ROOT', resourceName: 'OTHERROOT', resourcePath: 'OTHERROOT', labels: [] });

    expect(() => selectCategorizationSubtree(structure)).toThrow(/exactly one label classified CATEGORY_ROOT, found 2/);
  });

  it('fails closed when the tree is deeper than the categorization UI can render', () => {
    const structure = labelStructure();
    const deepest = structure[0]?.labels?.[0]?.labels?.[0];
    if (!deepest) throw new Error('fixture lost its type label');
    deepest.labels = [{ classification: 'SUBTYPE', resourceName: 'A', labels: [{ classification: 'SUBTYPE', resourceName: 'B', labels: [] }] }];

    expect(() => selectCategorizationSubtree(structure)).toThrow(/4 levels deep/);
  });

  it('passes every other metadata section through untouched', () => {
    const metadata = {
      labels: { labelStructure: labelStructure() },
      roles: [{ name: 'PRIMARY' }],
      statuses: [{ name: 'NEW' }],
      categories: [{ name: 'CATEGORY' }],
    };

    const result = withCategorizationSubtree(metadata);

    expect(result.roles).toBe(metadata.roles);
    expect(result.statuses).toBe(metadata.statuses);
    expect(result.categories).toBe(metadata.categories);
    expect(result.labels?.labelStructure).toHaveLength(2);
  });
});
