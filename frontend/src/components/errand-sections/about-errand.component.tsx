import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { Alert } from '@sk-web-gui/alert';
import { FormControl, FormErrorMessage, FormLabel, RadioButton } from '@sk-web-gui/react';
import { Info } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const AboutErrandContent: React.FC = () => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext<ErrandDTO>();
  const { showValidation } = useFormValidation();

  const parameters = watch('parameters') || [];
  const eventType = parameters.find((p) => p.key === 'eventType')?.values?.[0] ?? '';
  const eventConcerns = parameters.find((p) => p.key === 'eventConcerns')?.values?.[0] ?? '';

  const stakeholders = watch('stakeholders') || [];

  const setParameter = (key: string, value: string) => {
    const otherParams = parameters.filter((p) => p.key !== key);
    setValue('parameters', [...otherParams, { key, values: [value] }]);
  };

  const setEventConcerns = (value: string) => {
    setParameter('eventConcerns', value);
    if (value !== 'ENSKILD_BRUKARE') {
      setValue(
        'stakeholders',
        stakeholders.filter((s) => s.role !== 'PRIMARY')
      );
    }
  };

  return (
    <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
      <FormControl required id="event-type">
        <FormLabel>{t('errand-information:about.event_type_label')}</FormLabel>
        <RadioButton.Group data-cy="event-type-group" className="mb-18">
          <RadioButton
            data-cy="event-type-deviation"
            checked={eventType === 'AVVIKELSE'}
            value="AVVIKELSE"
            onChange={() => setParameter('eventType', 'AVVIKELSE')}
          >
            {t('errand-information:about.event_type_deviation')}
          </RadioButton>
          <RadioButton
            data-cy="event-type-misconduct"
            checked={eventType === 'MISSFORHALLANDE'}
            value="MISSFORHALLANDE"
            onChange={() => setParameter('eventType', 'MISSFORHALLANDE')}
          >
            {t('errand-information:about.event_type_misconduct')}
          </RadioButton>
        </RadioButton.Group>
        {showValidation && !eventType && (
          <FormErrorMessage>{t('errand-information:about.event_type_required')}</FormErrorMessage>
        )}
        {eventType === 'MISSFORHALLANDE' && (
          <Alert type="info" data-cy="misconduct-alert">
            <Alert.Icon />
            <Alert.Content>
              <Alert.Content.Title>{t('errand-information:about.misconduct_alert_title')}</Alert.Content.Title>
              <Alert.Content.Description>
                {t('errand-information:about.misconduct_alert_description')}
              </Alert.Content.Description>
            </Alert.Content>
          </Alert>
        )}
      </FormControl>

      <FormControl required id="event-concerns">
        <FormLabel>{t('errand-information:about.event_concerns_label')}</FormLabel>
        <span className="text-dark-secondary text-small mb-8">
          {t('errand-information:about.event_concerns_describe_note')}
        </span>
        <RadioButton.Group data-cy="event-concerns-group" className="mb-18">
          <RadioButton
            data-cy="event-concerns-individual"
            checked={eventConcerns === 'ENSKILD_BRUKARE'}
            value="ENSKILD_BRUKARE"
            onChange={() => setEventConcerns('ENSKILD_BRUKARE')}
          >
            {t('errand-information:about.event_concerns_individual')}
          </RadioButton>
          <RadioButton
            data-cy="event-concerns-group-activity"
            checked={eventConcerns === 'GRUPP_VERKSAMHET'}
            value="GRUPP_VERKSAMHET"
            onChange={() => setEventConcerns('GRUPP_VERKSAMHET')}
          >
            {t('errand-information:about.event_concerns_group')}
          </RadioButton>
          <RadioButton
            data-cy="event-concerns-other"
            checked={eventConcerns === 'ANNAT'}
            value="ANNAT"
            onChange={() => setEventConcerns('ANNAT')}
          >
            {t('errand-information:about.event_concerns_other')}
          </RadioButton>
        </RadioButton.Group>
        {showValidation && !eventConcerns && (
          <FormErrorMessage>{t('errand-information:about.event_concerns_required')}</FormErrorMessage>
        )}
      </FormControl>
    </div>
  );
};

export const AboutErrand: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandDisclosure header={t('errand-information:about.title')} icon={<Info />}>
      <AboutErrandContent />
    </ErrandDisclosure>
  );
};
