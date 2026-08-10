import { StakeholderCard } from '@components/card/stakeholder-card.component';
import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { yupResolver } from '@hookform/resolvers/yup';
import { getStakeholderUsingPersonNumber } from '@services/citizen/citizen-service';
import { getEmployeeByPersonNumber, getEmployeeStakeholderFromApi } from '@services/employee-service/employee-service';
import { Pen, Plus } from 'lucide-react';
import {
  Button,
  cx,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  RadioButton,
  SearchField,
  Select,
} from '@sk-web-gui/react';
import {
  emptyStakeholder,
  phoneNumberFormatter,
  shouldShowContactDetails,
  stakeholderSchema,
} from '@utils/stakeholder';
import { useEffect, useState } from 'react';
import { FormProvider, Resolver, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';
import { StakeholderFormModal } from './stakeholder-modal.component';

export const StakeholderList: React.FC<{
  roles: string[];
  employeeSearch?: boolean;
  autoDetectSearch?: boolean;
  maxCount?: number;
  hideRoleSelect?: boolean;
}> = ({ roles, employeeSearch = false, autoDetectSearch = false, maxCount, hideRoleSelect = false }) => {
  const [searchMode, setSearchMode] = useState<string>('PERSON');
  const [query, setQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<boolean>(false);
  const [emptyResult, setEmptyResult] = useState<boolean>(false);
  const [manualEntryOpen, setManualEntryOpen] = useState<boolean>(false);
  const { metadata } = useMetadataStore();
  const { t } = useTranslation();

  const context = useFormContext<ErrandDTO>();
  const { stakeholders } = context.watch();

  const { append, remove } = useFieldArray({
    control: context.control,
    name: 'stakeholders',
  });

  const method = useForm<StakeholderDTO>({
    defaultValues: emptyStakeholder,
    mode: 'onSubmit',
    resolver: yupResolver(stakeholderSchema) as unknown as Resolver<StakeholderDTO>,
  });

  const { handleSubmit, register, watch, reset, trigger, setValue, formState } = method;
  const { firstName, lastName, personNumber, address, city, title, department } = watch();

  //Used for resetting form when adding multiple stakeholders
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.isSubmitSuccessful]);

  const hasPrimaryStakeholder = stakeholders?.some((s) => s.role?.includes('PRIMARY'));
  const hasPrimaryRole = roles.includes('PRIMARY');
  const matchingCount = stakeholders?.filter((s) => roles.includes(s.role ?? '')).length ?? 0;
  const maxCountReached = maxCount !== undefined && matchingCount >= maxCount;
  const showAddButton = !maxCountReached && (!hasPrimaryRole || (hasPrimaryRole && !hasPrimaryStakeholder));

  const clearStakeholderForm = () => {
    setQuery('');
    setSearchResult(false);
    setEmptyResult(false);
    reset(emptyStakeholder);
  };

  const onSearchHandler = async (query: string) => {
    const effectiveMode =
      autoDetectSearch ?
        /^\d{8}-?\d{4}$/.test(query) ?
          'PERSON'
        : 'EMPLOYEE'
      : searchMode;

    if (effectiveMode === 'PERSON') {
      setValue('personNumber', query);
      const isValid = await trigger('personNumber');
      if (!isValid) {
        return;
      }
      const searchFn = autoDetectSearch ? getEmployeeByPersonNumber : getStakeholderUsingPersonNumber;
      searchFn(query)
        .then((res) => {
          if (res.status === 200) {
            reset(res.data);
            setEmptyResult(false);
            setSearchResult(true);
          } else {
            setEmptyResult(true);
          }
        })
        .catch(() => {
          setEmptyResult(true);
        });
    }
    if (effectiveMode === 'EMPLOYEE') {
      getEmployeeStakeholderFromApi(query)
        .then((res) => {
          if (res.status === 200) {
            reset(res.data);
            setEmptyResult(false);
            setSearchResult(true);
          } else {
            setEmptyResult(true);
          }
        })
        .catch(() => {
          setEmptyResult(true);
        });
    }
  };

  const addStakeholderToErrand = (stakeholder: StakeholderDTO) => {
    if (hideRoleSelect && metadata) {
     stakeholder.role = roles[0];
    }
    append({ ...stakeholder, phoneNumbers: [phoneNumberFormatter(stakeholder?.phoneNumbers?.[0])] });
    clearStakeholderForm();
  };

  return (
    <div>
      <FormProvider {...method}>
        {showAddButton && (
          <FormControl className="w-full">
            {employeeSearch && !autoDetectSearch && (
              <RadioButton.Group className="mb-18" inline>
                <RadioButton
                  data-cy="radiobutton-person"
                  checked={searchMode === 'PERSON'}
                  value={'PERSON'}
                  onChange={(e) => {
                    setSearchMode(e.target.value);
                    clearStakeholderForm();
                  }}
                >
                  Person
                </RadioButton>
                <RadioButton
                  data-cy="radiobutton-employee"
                  checked={searchMode === 'EMPLOYEE'}
                  value={'EMPLOYEE'}
                  onChange={(e) => {
                    setSearchMode(e.target.value);
                    clearStakeholderForm();
                  }}
                >
                  Anställd
                </RadioButton>
              </RadioButton.Group>
            )}
            <FormLabel>{t(`errand-information:search.${autoDetectSearch ? 'AUTODETECT' : searchMode}`)}</FormLabel>
            <SearchField
              data-cy="person-number-input"
              size="md"
              className="max-w-[52.5rem]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onSearch={onSearchHandler}
              onReset={() => {
                clearStakeholderForm();
              }}
              readOnly={searchResult}
            />
            {formState.errors.personNumber && (
              <FormErrorMessage data-cy="person-number-error">
                {formState.errors.personNumber?.message}
              </FormErrorMessage>
            )}
            {emptyResult && <FormErrorMessage data-cy="empty-person-error">Ingen person hittades</FormErrorMessage>}
          </FormControl>
        )}

        {searchResult && (
          <div data-cy="search-result" className="border-1 rounded-12 bg-background-content w-max-[52.5rem] my-15">
            <div className="px-16 py-8">
              <span className="text-[1.6rem] font-semibold py-10">
                {firstName} {lastName}
              </span>

              <div className="flex text-md mb-10">
                <div className="flex flex-col">
                  {title ?
                    <span>{title}</span>
                  : <span className={cx(!personNumber && 'italic text-text-secondary')}>
                      {personNumber || 'Personnummer saknas'}
                    </span>
                  }
                  {department ?
                    <span>{department}</span>
                  : <span className={cx((!address || !city) && 'italic text-text-secondary')}>
                      {`${address}, ${city}` || 'Adress saknas'}
                    </span>
                  }
                </div>
              </div>
              {shouldShowContactDetails(roles) && (
                <div className="flex flex-col sm:flex-row py-10 gap-10 w-full">
                  <FormControl className="w-full">
                    <FormLabel>E-postadress</FormLabel>
                    <Input
                      {...register('emails.0')}
                      data-cy="stakeholder-email-input"
                      placeholder="Ange e-postadress"
                    />
                    {formState.errors.emails?.[0]?.message && (
                      <FormErrorMessage data-cy="email-input-error">
                        {formState.errors.emails[0].message}
                      </FormErrorMessage>
                    )}
                  </FormControl>
                  <FormControl className="w-full">
                    <FormLabel>Telefonnummer</FormLabel>
                    <Input
                      {...register('phoneNumbers.0')}
                      data-cy="stakeholder-mobilephone-input"
                      placeholder="Ange telefonnummer"
                    />
                    {formState.errors.phoneNumbers?.[0]?.message && (
                      <FormErrorMessage data-cy="phone-number-input-error">
                        {formState.errors.phoneNumbers[0].message}
                      </FormErrorMessage>
                    )}
                  </FormControl>
                </div>
              )}

              {!hideRoleSelect && (
                <FormControl required className="w-full sm:w-[calc(50%-10px)]">
                  <FormLabel>Personens roll</FormLabel>
                  <Select data-cy="stakeholder-role-select" className="w-full" {...register('role')}>
                    {metadata?.roles?.map(
                      (role) =>
                        roles?.includes(role.name) && (
                          <Select.Option key={role.name} value={role.name}>
                            {role.displayName}
                          </Select.Option>
                        )
                    )}
                  </Select>
                </FormControl>
              )}
              <div className="py-10">
                <Button
                  data-cy="add-stakeholder-button"
                  leftIcon={<Plus size={16} />}
                  variant="primary"
                  onClick={handleSubmit(addStakeholderToErrand)}
                  className="w-full lg:w-auto"
                >
                  Lägg till person
                </Button>
              </div>
            </div>
          </div>
        )}
      </FormProvider>

      {stakeholders?.map((stakeholder, index) => {
        if (!roles.includes(stakeholder.role ?? '')) return null;
        return (
          <StakeholderCard
            index={index}
            key={index}
            stakeholder={stakeholder}
            isEditable
            roles={roles}
            onRemove={() => remove(index)}
          />
        );
      })}

      {showAddButton && (
        <Button
          data-cy="add-manual-person-button"
          variant="primary"
          size="sm"
          color="vattjom"
          inverted={true}
          className="mt-6 w-fit"
          leftIcon={<Pen />}
          onClick={() => {
            setManualEntryOpen(true);
          }}
        >
          Lägg till manuellt
        </Button>
      )}

      <StakeholderFormModal roles={roles} show={manualEntryOpen} onClose={() => setManualEntryOpen(false)} editableFields={roles.includes('EMPLOYEE') || roles.includes('SUBSTITUTEASSIGNMENT') ? ['personNumber', 'firstName', 'lastName', 'emails', 'phoneNumbers', 'role'] : ['personNumber', 'firstName', 'lastName', 'emails', 'phoneNumbers']} />
    </div>
  );
};
