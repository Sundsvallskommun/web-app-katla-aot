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
    setIsLoading(true);
    const promises = [
      getErrandsCount({ statuses: ['NEW'] }).then((data) => {
        setNewErrandCount(data.count || 0);
      }),
      getErrandsCount({ statuses: ['SOLVED'] }).then((data) => {
        setClosedErrandCount(data.count || 0);
      }),
    ];
    if (draftEnabled) {
      promises.push(
        getErrandsCount({ statuses: ['DRAFT'] }).then((data) => {
          setDraftErrandCount(data.count || 0);
        })
      );
    }
    void Promise.all(promises).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const onSelectStatus = (button: StatusButton) => {
    setActiveStatus(button.label);
    setStatuses(button.statuses);
    reset();
  };

  return { statusButtons, activeStatus, onSelectStatus, isLoading };
}
