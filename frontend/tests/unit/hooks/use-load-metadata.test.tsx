import { MetadataResponseDTO } from '@data-contracts/backend/data-contracts';
import { getMetadata } from '@services/errand-service/errand-service';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useLoadMetadata } from 'src/hooks/use-load-metadata';
import { useMetadataStore } from 'src/stores/metadata-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getMetadata: vi.fn(),
  t: (key: string) => key,
}));

vi.mock('@services/errand-service/errand-service', () => ({
  getMetadata: mocks.getMetadata,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.t }),
}));

const getMetadataMock = vi.mocked(getMetadata);

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

beforeEach(() => {
  getMetadataMock.mockReset();
  useMetadataStore.setState({ metadata: null });
});

describe('useLoadMetadata', () => {
  it('keeps the current request loading even when the store contains previous metadata', async () => {
    const previousMetadata: MetadataResponseDTO = { roles: [{ name: 'OLD_ROLE' }] };
    const currentMetadata: MetadataResponseDTO = { roles: [{ name: 'CURRENT_ROLE' }] };
    const request = createDeferred<MetadataResponseDTO>();
    useMetadataStore.setState({ metadata: previousMetadata });
    getMetadataMock.mockReturnValueOnce(request.promise);

    const { result } = renderHook(() => useLoadMetadata());

    expect(result.current).toEqual({ metadataError: null, metadataLoadState: 'loading' });
    expect(useMetadataStore.getState().metadata).toEqual(previousMetadata);

    await act(async () => {
      request.resolve(currentMetadata);
      await request.promise;
    });

    expect(result.current).toEqual({ metadataError: null, metadataLoadState: 'ready' });
    expect(useMetadataStore.getState().metadata).toEqual(currentMetadata);
  });

  it('fails the current request without treating previous metadata as ready', async () => {
    const previousMetadata: MetadataResponseDTO = { roles: [{ name: 'OLD_ROLE' }] };
    useMetadataStore.setState({ metadata: previousMetadata });
    getMetadataMock.mockRejectedValueOnce(new Error('metadata unavailable'));

    const { result } = renderHook(() => useLoadMetadata());

    await waitFor(() => {
      expect(result.current).toEqual({ metadataError: 'api_errors.metadata', metadataLoadState: 'error' });
    });
    expect(useMetadataStore.getState().metadata).toEqual(previousMetadata);
  });
});
