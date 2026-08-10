import { StakeholderCard } from '@components/card/stakeholder-card.component';
import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { StakeholderList } from '@components/misc/stakeholder.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { Checkbox, Spinner } from '@sk-web-gui/react';
import { getReporterStakeholder } from '@utils/stakeholder';
import { User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const ReporterContent: React.FC = () => {
  const { t } = useTranslation();
  const { watch, control } = useFormContext<ErrandDTO>();
  const { stakeholders } = watch();
  const [otherReporter, setOtherReporter] = useState(false);

  const reporterIndex = stakeholders?.findIndex((s) => s.role === 'REPORTER') ?? -1;

  const { remove } = useFieldArray({
    control,
    name: 'stakeholders',
  });

  // Auto-check the checkbox if CONTACT stakeholders already exist (e.g. loading existing errand)
  useEffect(() => {
    const hasContact = stakeholders?.some((s) => s.role === 'CONTACT');
    if (hasContact && !otherReporter) {
      setOtherReporter(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakeholders]);

  const handleOtherReporterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setOtherReporter(checked);

    if (!checked) {
      // Remove CONTACT stakeholders in reverse order to preserve indices
      const indicesToRemove = (stakeholders ?? [])
        .map((s, i) => (s.role === 'CONTACT' ? i : -1))
        .filter((i) => i !== -1)
        .reverse();
      indicesToRemove.forEach((i) => remove(i));
    }
  };

  return (
    <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
      <span className="text-dark-secondary">{t('errand-information:reporter.description')}</span>
      {getReporterStakeholder(stakeholders) ?
        <>
          <StakeholderCard
            stakeholder={getReporterStakeholder(stakeholders) ?? {}}
            isEditable
            hideRemove
            editableFields={['emails', 'phoneNumbers']}
            index={reporterIndex}
            roles={['REPORTER']}
          />
          <Checkbox className="-mt-[2.4rem]" checked={otherReporter} onChange={handleOtherReporterChange}>
            Jag rapporterar åt en annan kollega
          </Checkbox>
          {otherReporter && (
            <div className="flex flex-col gap-[2.4rem]">
              <h3 className="sk-disclosure-header-title sk-disclosure-header-title-md">
                {t('errand-information:other_reporter.title')}
              </h3>
              <span className="text-dark-secondary">
                {t('errand-information:other_reporter.description')}
              </span>
              <StakeholderList roles={['CONTACT', 'SUBSTITUTEASSIGNMENT']} autoDetectSearch maxCount={1} />
            </div>
          )}
        </>
      : <Spinner />}
    </div>
  );
};

export const Reporter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandDisclosure header={t('errand-information:reporter.title')} icon={<UserIcon />} initialOpen={false}>
      <ReporterContent />
    </ErrandDisclosure>
  );
};
