import { LabelDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDataItem, ErrandFormDTO } from '@interfaces/errand-form';
import { renderHook } from '@testing-library/react';
import { usePrepareErrand } from 'src/hooks/use-prepare-errand';
import { useMetadataStore } from 'src/stores/metadata-store';
import { describe, expect, it } from 'vitest';

const uncategorized: LabelDTO = {
  id: 'uncategorized',
  classification: 'CATEGORY',
  displayName: 'Okategoriserad',
  resourceName: 'UNCATEGORIZED',
  resourcePath: 'UNCATEGORIZED',
  labels: [],
};

const setLabelStructure = (labelStructure: LabelDTO[]) => {
  useMetadataStore.setState({ metadata: { labels: { labelStructure } } });
};

const errand = (errandFormData: ErrandFormDataItem[] = []): ErrandFormDTO => ({ errandFormData });

const renderPrepareErrand = () => renderHook(() => usePrepareErrand()).result.current;

describe('usePrepareErrand', () => {
  it('sätter grundetiketten på ärendet', () => {
    setLabelStructure([uncategorized]);
    const { prepareErrandForApi } = renderPrepareErrand();

    const prepared = prepareErrandForApi(errand(), 'NEW');

    expect(prepared.labels?.map((l) => l.resourceName)).toEqual(['UNCATEGORIZED']);
  });

  it('skickar inga etiketter när metadatat saknar grundetiketten', () => {
    setLabelStructure([]);
    const { prepareErrandForApi } = renderPrepareErrand();

    expect(prepareErrandForApi(errand(), 'NEW').labels).toEqual([]);
  });

  it('serialiserar formulärdatat till jsonParameters och lämnar inte kvar errandFormData', () => {
    setLabelStructure([uncategorized]);
    const { prepareErrandForApi } = renderPrepareErrand();

    const prepared = prepareErrandForApi(
      errand([{ schemaName: 'aot-formular', schemaId: 'schema-1', data: '{"foo":"bar"}' }]),
      'NEW'
    );

    expect(prepared.jsonParameters).toEqual([{ key: 'aot-formular', value: { foo: 'bar' }, schemaId: 'schema-1' }]);
    expect(prepared).not.toHaveProperty('errandFormData');
  });

  it('behåller intressenterna och sätter angiven status', () => {
    setLabelStructure([uncategorized]);
    const { prepareErrandForApi } = renderPrepareErrand();

    const stakeholders = [{ firstName: 'Anna', lastName: 'Andersson', role: 'PRIMARY' }];
    const prepared = prepareErrandForApi({ ...errand(), stakeholders }, 'DRAFT');

    expect(prepared.stakeholders).toEqual(stakeholders);
    expect(prepared.status).toBe('DRAFT');
  });

  it('ger en tom intressentlista när ärendet saknar intressenter', () => {
    setLabelStructure([uncategorized]);
    const { prepareErrandForApi } = renderPrepareErrand();

    expect(prepareErrandForApi(errand(), 'NEW').stakeholders).toEqual([]);
  });
});
