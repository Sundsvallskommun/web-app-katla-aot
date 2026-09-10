import { ErrandFormDataItem, ErrandFormDTO } from '@interfaces/errand-form';
import { prepareErrandForApi } from '@utils/prepare-errand';
import { describe, expect, it } from 'vitest';

const errand = (errandFormData: ErrandFormDataItem[] = []): ErrandFormDTO => ({ errandFormData });

const permanentServingLabels = [
  { id: 'alkohol', classification: 'CATEGORY', resourceName: 'ALCOHOL' },
  { id: 'servering', classification: 'TYPE', resourceName: 'SERVING_PERMIT_APPLICATION' },
  { id: 'stadigvarande', classification: 'SUBTYPE', resourceName: 'PERMANENT_SERVING' },
];

describe('prepareErrandForApi', () => {
  it('files the labels the categorization put on the form', () => {
    const labels = [
      { id: 'alkohol', classification: 'CATEGORY' },
      { id: 'servering', classification: 'TYPE' },
      { id: 'stadigvarande', classification: 'SUBTYPE' },
    ];

    expect(prepareErrandForApi({ ...errand(), labels }, 'NEW').labels).toEqual(labels);
  });

  it('gives an empty label list when nothing has been categorized', () => {
    expect(prepareErrandForApi(errand(), 'DRAFT').labels).toEqual([]);
  });

  it('serialises the form data to jsonParameters and leaves no errandFormData behind', () => {
    const prepared = prepareErrandForApi(
      {
        ...errand([{ schemaName: 'aot_permanent_serving', schemaId: 'schema-1', data: '{"foo":"bar"}' }]),
        labels: permanentServingLabels,
      },
      'NEW'
    );

    expect(prepared.jsonParameters).toEqual([
      { key: 'aot_permanent_serving', value: { foo: 'bar' }, schemaId: 'schema-1' },
    ]);
    expect(prepared).not.toHaveProperty('errandFormData');
  });

  it('leaves the form data of an errand type the citizen changed away from out of jsonParameters', () => {
    const prepared = prepareErrandForApi(
      {
        ...errand([
          { schemaName: 'aot_temporary_serving', schemaId: 'schema-2', data: '{"stale":true}' },
          { schemaName: 'aot_permanent_serving', schemaId: 'schema-1', data: '{"foo":"bar"}' },
        ]),
        labels: permanentServingLabels,
      },
      'NEW'
    );

    expect(prepared.jsonParameters).toEqual([
      { key: 'aot_permanent_serving', value: { foo: 'bar' }, schemaId: 'schema-1' },
    ]);
  });

  it('keeps the stakeholders and sets the given status', () => {
    const stakeholders = [{ firstName: 'Anna', lastName: 'Andersson', role: 'PRIMARY' }];
    const prepared = prepareErrandForApi({ ...errand(), stakeholders }, 'DRAFT');

    expect(prepared.stakeholders).toEqual(stakeholders);
    expect(prepared.status).toBe('DRAFT');
  });

  it('gives an empty stakeholder list when the errand has none', () => {
    expect(prepareErrandForApi(errand(), 'NEW').stakeholders).toEqual([]);
  });
});
