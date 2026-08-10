import { SortMode, Table } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { useSortStore } from 'src/stores/sort-store';

export const ErrandTableHeader: React.FC = () => {
  const sortOrders: Record<string, 'ascending' | 'descending'> = {
    asc: 'ascending',
    desc: 'descending',
  };

  const { t } = useTranslation();
  const { sortColumn, sortOrder, setSort } = useSortStore();

  const headers = [
    {
      label: t('errand-table.header.status'),
      property: 'status',
      sortable: true,
      screenReaderOnly: false,
      sticky: true,
    },
    {
      label: t('errand-table.header.errandNumber'),
      property: 'errandNumber',
      sortable: true,
      screenReaderOnly: false,
      sticky: false,
    },
    {
      label: t('errand-table.header.classificationType'),
      property: 'classification.type',
      sortable: true,
      screenReaderOnly: false,
      sticky: false,
    },
    {
      label: t('errand-table.header.created'),
      property: 'created',
      sortable: true,
      screenReaderOnly: false,
      sticky: false,
    },
  ];

  return (
    <Table.Header>
      {headers.map((header, index) => {
        const isActive = sortColumn === header.property;

        return (
          <Table.HeaderColumn key={`header-${index}`} sticky={header.sticky}>
            {header.screenReaderOnly ?
              <span className="sr-only">{header.label}</span>
            : header.sortable ?
              <Table.SortButton
                isActive={isActive}
                sortOrder={isActive ? (sortOrders[sortOrder] as SortMode) : null}
                onClick={() => {
                  setSort(header.property);
                }}
              >
                {header.label}
              </Table.SortButton>
            : header.label}
          </Table.HeaderColumn>
        );
      })}
    </Table.Header>
  );
};
