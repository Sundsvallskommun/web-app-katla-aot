'use client';

import { getErrandsCount } from '@services/errand-service/errand-service';
import { CircleCheckBig, ClipboardPen, SquarePen } from 'lucide-react';
import { createElement, ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useErrandCountStore } from 'src/stores/errand-count-store';
import { useFilterStore } from 'src/stores/filter-store';
import { useSortStore } from 'src/stores/sort-store';

export interface StatusButton {
  label: string;
  statuses: string[];
  icon: ReactElement;
  errandsCount: number;
}

export function useStatusButtons() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { activeStatus, setActiveStatus, setStatuses } = useFilterStore();
  const {
    newErrandCount,
    draftErrandCount,
    closedErrandCount,
    setNewErrandCount,
    setDraftErrandCount,
    setClosedErrandCount,
  } = useErrandCountStore();
  const { reset } = useSortStore();
  const draftEnabled = appConfig.features.draftEnabled;

  useEffect(() => {
    if (!activeStatus) {
      setActiveStatus(t('filtering:errands.open'));
    }
  }, [t, activeStatus, setActiveStatus]);

  const allStatusButtons: StatusButton[] = [
    {
      label: t('filtering:errands.open'),
      statuses: ['NEW'],
      icon: createElement(ClipboardPen),
      errandsCount: newErrandCount,
    },
    {
      label: t('filtering:errands.draft'),
      statuses: ['DRAFT'],
      icon: createElement(SquarePen),
      errandsCount: draftErrandCount,
    },
    {
      label: t('filtering:errands.closed'),
      statuses: ['SOLVED'],
      icon: createElement(CircleCheckBig),
      errandsCount: closedErrandCount,
    },
  ];

  const statusButtons =
    draftEnabled ? allStatusButtons : allStatusButtons.filter((button) => !button.statuses.includes('DRAFT'));

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const requests: { status: string; apply: (count: number) => void }[] = [
      { status: 'NEW', apply: setNewErrandCount },
      { status: 'SOLVED', apply: setClosedErrandCount },
    ];
    if (draftEnabled) {
      requests.push({ status: 'DRAFT', apply: setDraftErrandCount });
    }

    void Promise.allSettled(requests.map(({ status }) => getErrandsCount({ statuses: [status] })))
      .then((results) => {
        if (!active) return;
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') requests[index]?.apply(result.value.count);
        });
        setError(results.some((result) => result.status === 'rejected') ? t('api_errors.counts') : null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [draftEnabled, setClosedErrandCount, setDraftErrandCount, setNewErrandCount, t]);

  const onSelectStatus = (button: StatusButton) => {
    setActiveStatus(button.label);
    setStatuses(button.statuses);
    reset();
  };

  return { statusButtons, activeStatus, onSelectStatus, isLoading, error };
}
