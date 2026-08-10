import { Checkbox } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

const Filtering: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex gap-16 items-center max-w-screen-desktop-max w-full my-16">
        <div className="flex flex-col md:flex-row justify-start items-center p-10 gap-4 bg-background-200 rounded-groups flex-wrap">
          <div className="relative max-md:w-full">SOME FILTER</div>
        </div>
        <div className="min-w-fit">
          <Checkbox>{t('filtering:my_errands')}</Checkbox>
        </div>
      </div>
      <div className="mt-16">{/* <SupportManagementFilterTags administrators={administrators} /> */}</div>
    </>
  );
};

export default Filtering;
