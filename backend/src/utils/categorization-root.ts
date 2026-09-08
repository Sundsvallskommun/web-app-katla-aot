import { Label, MetadataResponse } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

/**
 * SupportManagement's label tree carries the categorization Katla offers under a single node
 * classified CATEGORY_ROOT, alongside siblings that are not ours to show (the UNCATEGORIZED
 * placeholder). The BFF hands the frontend that node's children as the whole tree, so the
 * categorization UI never has to know the root exists.
 *
 * The root itself is deliberately not part of what the frontend sees or of what ends up in
 * `errand.labels`: an errand label is self-identifying and keeps the full `resourcePath` it was
 * given upstream, so the stored value is unaffected by where the offered tree starts.
 */
export const CATEGORIZATION_ROOT_CLASSIFICATION = 'CATEGORY_ROOT';

/** How deep below the root the frontend can render: CATEGORY, TYPE and SUBTYPE. */
const MAX_DEPTH_BELOW_ROOT = 3;

const findByClassification = (labels: Label[] | undefined, classification: string): Label[] =>
  (labels ?? []).flatMap(label => [
    ...(label.classification === classification ? [label] : []),
    ...findByClassification(label.labels, classification),
  ]);

const depthOf = (labels: Label[] | undefined): number => {
  const children = labels ?? [];
  return children.length === 0 ? 0 : 1 + Math.max(...children.map(label => depthOf(label.labels)));
};

/**
 * The categorization tree as the frontend should see it: the children of the CATEGORY_ROOT node.
 *
 * Fails rather than degrades. An empty tree would reach the citizen as a blank required Kategori
 * field with no explanation, and falling back to the unfiltered tree would offer categories that
 * are not Katla's to offer.
 */
export const selectCategorizationSubtree = (labelStructure: Label[] | undefined): Label[] => {
  const [root, ...extraRoots] = findByClassification(labelStructure, CATEGORIZATION_ROOT_CLASSIFICATION);

  if (!root || extraRoots.length > 0) {
    throw new HttpException(
      502,
      `Invalid response when reading metadata: expected exactly one label classified ${CATEGORIZATION_ROOT_CLASSIFICATION}, found ${root ? 1 + extraRoots.length : 0}`,
    );
  }

  const subtree = root.labels ?? [];
  const depth = depthOf(subtree);
  if (depth > MAX_DEPTH_BELOW_ROOT) {
    // The categorization UI walks a fixed three levels, so a deeper tree would lose its lowest
    // labels without anything saying so.
    throw new HttpException(
      502,
      `Invalid response when reading metadata: categorization tree is ${depth} levels deep, at most ${MAX_DEPTH_BELOW_ROOT} can be rendered`,
    );
  }

  return subtree;
};

/** Replaces only the label structure; every other metadata section is passed through untouched. */
export const withCategorizationSubtree = (metadata: MetadataResponse): MetadataResponse => ({
  ...metadata,
  labels: { ...metadata.labels, labelStructure: selectCategorizationSubtree(metadata.labels?.labelStructure) },
});
