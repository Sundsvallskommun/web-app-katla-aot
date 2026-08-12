import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getErrands, getMetadata } from '@services/errand-service/errand-service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useSortStore } from 'src/stores/sort-store';

interface UseOverviewErrandsOptions {
  mode?: 'desktop' | 'mobile';
}

interface RequestTracker {
  generation: number;
  pending: number;
}

export function useOverviewErrands({ mode = 'desktop' }: UseOverviewErrandsOptions = {}) {
  const { t } = useTranslation();
  const { sortColumn, sortOrder, page, size } = useSortStore();
  const { statuses } = useFilterStore();
  const { setMetadata } = useMetadataStore();

  const [rows, setRows] = useState<ErrandDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errandsError, setErrandsError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const mobilePageRef = useRef(0);
  const requestGenerationRef = useRef(0);
  const requestTrackerRef = useRef<RequestTracker>({ generation: 0, pending: 0 });
  // Spegelvärde av mobilePageRef för läsning under rendering (react-hooks/refs)
  const [mobilePage, setMobilePage] = useState(0);

  const beginRequest = useCallback((generation: number): boolean => {
    if (requestGenerationRef.current !== generation) return false;

    if (requestTrackerRef.current.generation !== generation) {
      requestTrackerRef.current = { generation, pending: 0 };
    }
    requestTrackerRef.current.pending += 1;
    setIsLoading(true);
    return true;
  }, []);

  const finishRequest = useCallback((generation: number): void => {
    if (requestGenerationRef.current !== generation || requestTrackerRef.current.generation !== generation) return;

    requestTrackerRef.current.pending = Math.max(0, requestTrackerRef.current.pending - 1);
    if (requestTrackerRef.current.pending === 0) setIsLoading(false);
  }, []);

  // Desktop använder sidan från storen, mobil börjar alltid på 0
  const effectivePage = mode === 'mobile' ? 0 : page;

  useEffect(() => {
    let active = true;
    void getMetadata()
      .then((res) => {
        if (!active) return;
        setMetadata(res);
        setMetadataError(null);
      })
      .catch(() => {
        if (active) setMetadataError(t('api_errors.metadata'));
      });

    return () => {
      active = false;
    };
  }, [setMetadata, t]);

  // Huvudhämtningen — utlöses av ändringar i storen (sortering, filter, paginering).
  // Mobil hämtar alltid från sida 0 och nollställer ackumulerade rader.
  useEffect(() => {
    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;
    requestTrackerRef.current = { generation, pending: 0 };
    mobilePageRef.current = 0;
    setMobilePage(0);
    // Rader och totaler hör till exakt denna queryidentitet. Rensa dem för både
    // desktop och mobil innan en ny sida/filter/sortering/storlek begärs, så att
    // en misslyckad ersättning aldrig kan visas som resultat för den nya queryn.
    setRows([]);
    setTotalPages(1);
    setTotalElements(0);
    setErrandsError(null);
    beginRequest(generation);
    let active = true;
    void getErrands({ sortColumn, sortOrder, page: effectivePage, size, statuses })
      .then((data) => {
        if (!active || requestGenerationRef.current !== generation) return;
        setRows(data.content ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
        setErrandsError(null);
      })
      .catch(() => {
        if (active && requestGenerationRef.current === generation) setErrandsError(t('api_errors.errands'));
      })
      .finally(() => {
        if (active) finishRequest(generation);
      });

    return () => {
      active = false;
      if (requestGenerationRef.current === generation) {
        const invalidatedGeneration = generation + 1;
        requestGenerationRef.current = invalidatedGeneration;
        requestTrackerRef.current = { generation: invalidatedGeneration, pending: 0 };
      }
    };
  }, [beginRequest, finishRequest, sortColumn, sortOrder, effectivePage, size, statuses, t]);

  const hasMore = mode === 'mobile' ? mobilePage + 1 < totalPages : page + 1 < totalPages;

  const loadMore = useCallback(() => {
    if (mode !== 'mobile') return;

    const generation = requestGenerationRef.current;
    if (requestTrackerRef.current.generation !== generation || requestTrackerRef.current.pending > 0) return;

    const previousPage = mobilePageRef.current;
    const nextPage = previousPage + 1;
    if (nextPage >= totalPages) return;
    if (!beginRequest(generation)) return;

    mobilePageRef.current = nextPage;
    setMobilePage(nextPage);
    void getErrands({ sortColumn, sortOrder, page: nextPage, size, statuses })
      .then((data) => {
        if (requestGenerationRef.current !== generation) return;
        setRows((prev) => [...prev, ...(data.content ?? [])]);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
        setErrandsError(null);
      })
      .catch(() => {
        if (requestGenerationRef.current !== generation) return;
        // Rulla tillbaka sidmarkören så att användaren kan försöka med samma sida igen.
        mobilePageRef.current = previousPage;
        setMobilePage(previousPage);
        setErrandsError(t('api_errors.errands'));
      })
      .finally(() => {
        finishRequest(generation);
      });
  }, [beginRequest, finishRequest, mode, totalPages, sortColumn, sortOrder, size, statuses, t]);

  return { rows, isLoading, totalPages, totalElements, hasMore, loadMore, page, errandsError, metadataError };
}
