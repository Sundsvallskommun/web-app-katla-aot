import { ErrandFormDTO } from '@interfaces/errand-form';
import { storeErrandFormHandover, takeErrandFormHandover } from '@utils/errand-form-handover';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const values: ErrandFormDTO = {
  title: 'Empty errand',
  priority: 'MEDIUM',
  status: 'DRAFT',
  channel: 'ESERVICE',
  resolution: 'INFORMED',
  description: 'Halvfärdig beskrivning',
};

describe('errand form handover', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-14T08:00:00Z'));
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carries the form and the wizard step across a language switch', () => {
    storeErrandFormHandover({ path: '/arende/registrera', values, wizardStep: 2 });

    const handover = takeErrandFormHandover('/arende/registrera');

    expect(handover?.values).toEqual(values);
    expect(handover?.wizardStep).toBe(2);
  });

  it('is consumed once so it does not resurface in a later empty form', () => {
    storeErrandFormHandover({ path: '/arende/registrera', values, wizardStep: 1 });

    expect(takeErrandFormHandover('/arende/registrera')).not.toBeNull();
    expect(takeErrandFormHandover('/arende/registrera')).toBeNull();
  });

  it('ignores a handover written on another page', () => {
    storeErrandFormHandover({ path: '/arende/registrera', values, wizardStep: 1 });

    // Nyckeln är sökvägen utan språkprefix. Ett annat ärende är en annan sida, och dess
    // värden hör inte hemma här.
    expect(takeErrandFormHandover('/arende/AIA-25120019/grundinformation')).toBeNull();
  });

  it('ignores a handover that outlived the navigation that wrote it', () => {
    storeErrandFormHandover({ path: '/arende/registrera', values, wizardStep: 1 });

    vi.setSystemTime(new Date('2026-08-14T08:00:30Z'));

    expect(takeErrandFormHandover('/arende/registrera')).toBeNull();
  });
});
