import { Input, Pagination, Select } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { useSortStore } from 'src/stores/sort-store';

export const ErrandTableFooter: React.FC<{ totalPages: number }> = ({ totalPages }) => {
  const { t } = useTranslation();
  const { page, size, rowHeight, setRowHeight } = useSortStore();
  const setPage = useSortStore((s) => s.setPage);
  const setSize = useSortStore((s) => s.setSize);

  return (
    <>
      <div className="sk-table-bottom-section">
        <label className="sk-table-bottom-section-label" htmlFor="pageSize">
          {t('common:errand-table.rows_per_page')}
        </label>
        <Input
          size="sm"
          id="pageSize"
          type="number"
          min={1}
          max={100}
          className="max-w-[6rem]"
          value={size}
          onChange={(e) => {
            const v = Number(e.target.value) || 1;
            setSize(v);
          }}
        />
      </div>
      <div className="sk-table-paginationwrapper">
        <Pagination
          showFirst
          showLast
          pagesBefore={1}
          pagesAfter={1}
          showConstantPages={true}
          fitContainer
          pages={totalPages}
          activePage={page + 1}
          changePage={(p: number) => {
            setPage(p - 1);
          }}
        />
      </div>
      <div className="sk-table-bottom-section">
        <label className="sk-table-bottom-section-label" htmlFor="rowHeight">
          {t('common:errand-table.row_height')}
        </label>
        <Select
          size="sm"
          id="rowHeight"
          variant="tertiary"
          onChange={(e) => {
            setRowHeight(e.target.value);
          }}
          value={rowHeight}
        >
          <Select.Option value="normal">{t('common:errand-table.row_height_normal')}</Select.Option>
          <Select.Option value="dense">{t('common:errand-table.row_height_dense')}</Select.Option>
        </Select>
      </div>
    </>
  );
};
