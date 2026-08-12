import { getErrands, getErrandsCount, getMetadata } from '@services/errand-service/errand-service';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { useStatusButtons } from 'src/hooks/use-status-buttons';
import { useErrandCountStore } from 'src/stores/errand-count-store';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useSortStore } from 'src/stores/sort-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const errandServiceMocks = vi.hoisted(() => ({
  getErrands: vi.fn(),
  getErrandsCount: vi.fn(),
  getMetadata: vi.fn(),
}));
const i18nMocks = vi.hoisted(() => ({
  t: (key: string) => key,
}));

vi.mock('@services/errand-service/errand-service', () => errandServiceMocks);

vi.mock('react-i18next', () => ({
  useTranslation: () => i18nMocks,
}));

const getErrandsMock = vi.mocked(getErrands);
const getErrandsCountMock = vi.mocked(getErrandsCount);
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
  getErrandsMock.mockReset();
  getErrandsCountMock.mockReset();
  getMetadataMock.mockReset();
  useSortStore.setState({ sortColumn: 'created', sortOrder: 'desc', page: 0, size: 12, rowHeight: 'normal' });
  useFilterStore.setState({ activeStatus: 'Öppna', statuses: [] });
  useMetadataStore.setState({ metadata: null });
  useErrandCountStore.setState({ newErrandCount: 0, draftErrandCount: 0, closedErrandCount: 0 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('overview API error state', () => {
  it.each([
    [
      'page',
      () => {
        useSortStore.getState().setPage(1);
      },
    ],
    [
      'filter',
      () => {
        useFilterStore.getState().setStatuses(['NEW']);
      },
    ],
    [
      'sort',
      () => {
        useSortStore.getState().setSort('priority');
      },
    ],
    [
      'size',
      () => {
        useSortStore.getState().setSize(24);
      },
    ],
  ] as const)(
    'clears the previous desktop query at %s request start and retains metadata if replacement fails',
    async (_change, changeQuery) => {
      const replacement = createDeferred<Awaited<ReturnType<typeof getErrands>>>();
      const previousMetadata = { statuses: [{ name: 'NEW' }] };
      useMetadataStore.setState({ metadata: previousMetadata });
      getMetadataMock.mockRejectedValue(new Error('metadata unavailable'));
      getErrandsMock
        .mockResolvedValueOnce({
          content: [{ id: 'errand-id', errandNumber: 'ERRAND-1' }],
          totalElements: 1,
          totalPages: 2,
        })
        .mockReturnValueOnce(replacement.promise);

      const { result } = renderHook(() => useOverviewErrands());

      await waitFor(() => {
        expect(result.current.rows).toHaveLength(1);
        expect(result.current.metadataError).toBe('api_errors.metadata');
      });

      act(() => {
        changeQuery();
      });

      await waitFor(() => {
        expect(getErrandsMock).toHaveBeenCalledTimes(2);
        expect(result.current.rows).toEqual([]);
        expect(result.current.totalElements).toBe(0);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.errandsError).toBeNull();
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        replacement.reject(new Error('errands unavailable'));
        await replacement.promise.catch(() => undefined);
      });

      expect(result.current.errandsError).toBe('api_errors.errands');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.rows).toEqual([]);
      expect(result.current.totalElements).toBe(0);
      expect(result.current.totalPages).toBe(1);
      expect(useMetadataStore.getState().metadata).toEqual(previousMetadata);
    }
  );

  it('rolls back the mobile page cursor and retries the same page after load-more fails', async () => {
    getMetadataMock.mockResolvedValue({});
    getErrandsMock
      .mockResolvedValueOnce({
        content: [{ id: 'errand-id', errandNumber: 'ERRAND-1' }],
        totalElements: 2,
        totalPages: 2,
      })
      .mockRejectedValueOnce(new Error('next page unavailable'))
      .mockResolvedValueOnce({
        content: [{ id: 'second-errand-id', errandNumber: 'ERRAND-2' }],
        totalElements: 2,
        totalPages: 2,
      });

    const { result } = renderHook(() => useOverviewErrands({ mode: 'mobile' }));

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
      expect(result.current.hasMore).toBe(true);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.errandsError).toBe('api_errors.errands');
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.rows.map((errand) => errand.errandNumber)).toEqual(['ERRAND-1', 'ERRAND-2']);
      expect(result.current.errandsError).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    expect(getErrandsMock.mock.calls.slice(1).map(([query]) => query?.page)).toEqual([1, 1]);
    expect(result.current.hasMore).toBe(false);
  });

  it.each([
    [
      'filter',
      () => {
        useFilterStore.getState().setStatuses(['NEW']);
      },
    ],
    [
      'sort',
      () => {
        useSortStore.getState().setSort('priority');
      },
    ],
    [
      'size',
      () => {
        useSortStore.getState().setSize(24);
      },
    ],
  ] as const)(
    'ignores a stale mobile page after a %s change and keeps the current request loading',
    async (_change, changeQuery) => {
      const stalePage = createDeferred<Awaited<ReturnType<typeof getErrands>>>();
      const currentFirstPage = createDeferred<Awaited<ReturnType<typeof getErrands>>>();
      getMetadataMock.mockResolvedValue({});
      getErrandsMock
        .mockResolvedValueOnce({
          content: [{ id: 'old-errand-id', errandNumber: 'OLD-1' }],
          totalElements: 3,
          totalPages: 3,
        })
        .mockReturnValueOnce(stalePage.promise)
        .mockReturnValueOnce(currentFirstPage.promise);

      const { result } = renderHook(() => useOverviewErrands({ mode: 'mobile' }));

      await waitFor(() => {
        expect(result.current.rows.map((errand) => errand.errandNumber)).toEqual(['OLD-1']);
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.loadMore();
      });
      await waitFor(() => {
        expect(getErrandsMock).toHaveBeenCalledTimes(2);
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        changeQuery();
      });
      await waitFor(() => {
        expect(getErrandsMock).toHaveBeenCalledTimes(3);
        expect(result.current.rows).toEqual([]);
      });

      await act(async () => {
        stalePage.resolve({
          content: [{ id: 'stale-errand-id', errandNumber: 'STALE-2' }],
          totalElements: 3,
          totalPages: 3,
        });
        await stalePage.promise;
      });

      expect(result.current.rows).toEqual([]);
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        currentFirstPage.resolve({
          content: [{ id: 'current-errand-id', errandNumber: 'CURRENT-1' }],
          totalElements: 1,
          totalPages: 1,
        });
        await currentFirstPage.promise;
      });

      await waitFor(() => {
        expect(result.current.rows.map((errand) => errand.errandNumber)).toEqual(['CURRENT-1']);
        expect(result.current.isLoading).toBe(false);
      });
    }
  );

  it('does not apply an in-flight mobile page after unmount', async () => {
    const stalePage = createDeferred<Awaited<ReturnType<typeof getErrands>>>();
    getMetadataMock.mockResolvedValue({});
    getErrandsMock
      .mockResolvedValueOnce({
        content: [{ id: 'errand-id', errandNumber: 'ERRAND-1' }],
        totalElements: 2,
        totalPages: 2,
      })
      .mockReturnValueOnce(stalePage.promise);

    const { result, unmount } = renderHook(() => useOverviewErrands({ mode: 'mobile' }));

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });
    const rowsBeforeUnmount = result.current.rows;

    unmount();
    await act(async () => {
      stalePage.resolve({
        content: [{ id: 'late-errand-id', errandNumber: 'LATE-2' }],
        totalElements: 2,
        totalPages: 2,
      });
      await stalePage.promise;
    });

    expect(result.current.rows).toBe(rowsBeforeUnmount);
  });
});

describe('status count API error state', () => {
  it('updates successful counts and preserves the failed count', async () => {
    useErrandCountStore.setState({ newErrandCount: 8, closedErrandCount: 9 });
    getErrandsCountMock.mockImplementation((query) => {
      const [status] = query?.statuses ?? [];
      if (status === 'NEW') return Promise.reject(new Error('new count unavailable'));
      return Promise.resolve({ count: 2 });
    });

    const { result } = renderHook(() => useStatusButtons());

    await waitFor(() => {
      expect(result.current.error).toBe('api_errors.counts');
      expect(result.current.isLoading).toBe(false);
    });

    expect(useErrandCountStore.getState().newErrandCount).toBe(8);
    expect(useErrandCountStore.getState().closedErrandCount).toBe(2);
    expect(result.current.statusButtons.find((button) => button.statuses.includes('NEW'))?.errandsCount).toBe(8);
  });
});
