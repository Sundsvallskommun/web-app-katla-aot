import initLocalization from '@app/i18n';
import { createInstance, type Resource } from 'i18next';
import { describe, expect, it } from 'vitest';

const resources = (label: string): Resource => ({
  sv: {
    common: {
      greeting: 'Hej {{name}}',
      label,
    },
  },
});

describe('Localization', () => {
  it('keeps resources isolated between instances and interpolates values', async () => {
    const firstInstance = createInstance();
    const secondInstance = createInstance();

    const [firstLocalization, secondLocalization] = await Promise.all([
      initLocalization('sv', ['common'], firstInstance, resources('Första')),
      initLocalization('sv', ['common'], secondInstance, resources('Andra')),
    ]);

    expect(firstLocalization.t('greeting', { name: 'Ada' })).toBe('Hej Ada');
    expect(firstLocalization.t('label')).toBe('Första');
    expect(secondLocalization.t('label')).toBe('Andra');
  });
});
