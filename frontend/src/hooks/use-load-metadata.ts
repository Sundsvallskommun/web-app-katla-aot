'use client';

import { getMetadata } from '@services/errand-service/errand-service';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

type MetadataLoadState = 'error' | 'loading' | 'ready';

interface UseLoadMetadataResult {
  metadataError: string | null;
  metadataLoadState: MetadataLoadState;
}

/**
 * Fyller metadatastoren.
 *
 * Metadata bär rollnamn, kategorier och platsstrukturen som platsväljaren
 * bygger sitt träd av. Varje yta som behöver den måste därför hämta den
 * själv — storen är inte längre persistad, så det som inte hämtas finns inte.
 * Statusen beskriver just den här hookinstansens request; data som redan ligger
 * i storen gör alltså inte en ny hämtning redo i förtid.
 */
export function useLoadMetadata(): UseLoadMetadataResult {
  const { t } = useTranslation();
  const setMetadata = useMetadataStore((state) => state.setMetadata);
  const [metadataLoadState, setMetadataLoadState] = useState<MetadataLoadState>('loading');

  useEffect(() => {
    let active = true;
    setMetadataLoadState('loading');

    void getMetadata()
      .then((res) => {
        if (!active) return;
        setMetadata(res);
        setMetadataLoadState('ready');
      })
      .catch(() => {
        if (active) setMetadataLoadState('error');
      });

    return () => {
      active = false;
    };
  }, [setMetadata, t]);

  return {
    metadataError: metadataLoadState === 'error' ? t('api_errors.metadata') : null,
    metadataLoadState,
  };
}
