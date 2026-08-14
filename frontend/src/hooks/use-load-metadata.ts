'use client';

import { getMetadata } from '@services/errand-service/errand-service';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

/**
 * Fyller metadatastoren.
 *
 * Metadata bär rollnamn, kategorier och platsstrukturen som platsväljaren
 * bygger sitt träd av. Varje yta som behöver den måste därför hämta den
 * själv — storen är inte längre persistad, så det som inte hämtas finns inte.
 */
export function useLoadMetadata(): { metadataError: string | null } {
  const { t } = useTranslation();
  const setMetadata = useMetadataStore((state) => state.setMetadata);
  const [metadataError, setMetadataError] = useState<string | null>(null);

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

  return { metadataError };
}
