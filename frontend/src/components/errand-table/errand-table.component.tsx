'use client';

import { StatusLabel } from '@components/misc/status-label.component';
import { CenterDiv } from '@layouts/center-div.component';
import { getTypeDisplayName } from '@utils/errand-helpers';
import { Spinner, Table } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useSortStore } from 'src/stores/sort-store';
import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';
import { useRouter } from 'next/navigation';
import { useOverviewErrands } from 'src/hooks/use-overview-errands';

export const ErrandTable: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { rowHeight } = useSortStore();
  const { rows, isLoading, totalPages } = useOverviewErrands();

  if (isLoading && rows.length === 0)
    return (
      <CenterDiv className="mt-[20rem]">
        <Spinner />
      </CenterDiv>
    );

  if (rows.length === 0) return <CenterDiv className="mt-[20rem]">{t('errand-information:no_errands')}</CenterDiv>;

  return (
    <Table data-cy="errand-table" dense={rowHeight === 'dense'} className="px-40">
      <ErrandTableHeader />

      {rows.map((errand, index) => (
        <Table.Row
          className="cursor-pointer"
          key={`errand-row-${index}`}
          tabIndex={0}
          onClick={() => router.push(`/arende/${errand.errandNumber}/grundinformation`)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              router.push(`/arende/${errand.errandNumber}/grundinformation`);
            }
          }}
        >
          <Table.Column>
            <StatusLabel status={errand?.status} />
          </Table.Column>
          <Table.Column>{errand.errandNumber}</Table.Column>
          <Table.Column>{getTypeDisplayName(errand)}</Table.Column>
          <Table.Column>{dayjs(errand.touched).format('YYYY-MM-DD HH:mm')}</Table.Column>
        </Table.Row>
      ))}

      <Table.Footer>
        <ErrandTableFooter totalPages={totalPages} />
      </Table.Footer>
    </Table>
  );
};
