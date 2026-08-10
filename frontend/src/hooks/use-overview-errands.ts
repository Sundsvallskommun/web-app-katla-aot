import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getErrands, getMetadata } from '@services/errand-service/errand-service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useSortStore } from 'src/stores/sort-store';

interface UseOverviewErrandsOptions {
  mode?: 'desktop' | 'mobile';
}

export function useOverviewErrands({ mode = 'desktop' }: UseOverviewErrandsOptions = {}) {
  const { sortColumn, sortOrder, page, size } = useSortStore();
  const { statuses } = useFilterStore();
  const { setMetadata } = useMetadataStore();

  const [rows, setRows] = useState<ErrandDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mobilePageRef = useRef(0);
  // Spegelvärde av mobilePageRef för läsning under rendering (react-hooks/refs)
  const [mobilePage, setMobilePage] = useState(0);

  // Desktop uses the store's page, mobile always starts from 0
  const effectivePage = mode === 'mobile' ? 0 : page;

  useEffect(() => {
    void getMetadata().then((res) => {
      setMetadata(res);
    });
  }, []);

  // Main fetch — triggered by store changes (sort, filter, pagination)
  // Mobile always fetches from page 0 and resets accumulated rows
  useEffect(() => {
    mobilePageRef.current = 0;
    setMobilePage(0);
    setIsLoading(true);
    void getErrands({ sortColumn, sortOrder, page: effectivePage, size, statuses })
      .then((data) => {
        setRows(data.content ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sortColumn, sortOrder, effectivePage, size, statuses]);

  const hasMore = mode === 'mobile' ? mobilePage + 1 < totalPages : page + 1 < totalPages;

  const loadMore = useCallback(() => {
    if (isLoading) return;
    const nextPage = mobilePageRef.current + 1;
    if (nextPage >= totalPages) return;

    mobilePageRef.current = nextPage;
    setMobilePage(nextPage);
    setIsLoading(true);
    void getErrands({ sortColumn, sortOrder, page: nextPage, size, statuses })
      .then((data) => {
        setRows((prev) => [...prev, ...(data.content ?? [])]);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoading, totalPages, sortColumn, sortOrder, size, statuses]);

  return { rows, isLoading, totalPages, totalElements, hasMore, loadMore, page };
}
