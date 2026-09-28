import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { appConfigMock } = vi.hoisted(() => ({ appConfigMock: { features: { draftEnabled: true } } }));

vi.mock('src/config/appconfig', () => ({ appConfig: appConfigMock }));

const persistedDraftFilter = () => {
  localStorage.setItem(
    'filter-storage',
    JSON.stringify({ state: { activeStatus: 'Utkast', statuses: [], lifecycle: 'DRAFT' }, version: 0 })
  );
};

const loadStore = async () => (await import('src/stores/filter-store')).useFilterStore.getState();

describe('filter store rehydration', () => {
  beforeEach(() => {
    vi.resetModules();
    persistedDraftFilter();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('keeps a persisted draft filter while drafts are offered', async () => {
    appConfigMock.features.draftEnabled = true;

    const state = await loadStore();

    expect(state.lifecycle).toBe('DRAFT');
    expect(state.activeStatus).toBe('Utkast');
  });

  // With the draft button gone nothing else could clear the filter, so it starts over instead.
  it('drops a persisted draft filter once drafts are no longer offered', async () => {
    appConfigMock.features.draftEnabled = false;

    const state = await loadStore();

    expect(state.lifecycle).toBeUndefined();
    expect(state.activeStatus).toBeNull();
  });
});
