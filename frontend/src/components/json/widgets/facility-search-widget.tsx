'use client';
import { FacilityInfoDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
import { ariaDescribedByIds, type FieldProps } from '@rjsf/utils';
import { getUserEmployments } from '@services/employee-service/employee-service';
import { Button, Combobox, FormControl, FormLabel, RadioButton } from '@sk-web-gui/react';
import {
  findPlaceNode,
  findPlaceNodeByKey,
  getPlaceNodes,
  getSubPlaceNodes,
  isDescendantOrSelf,
  isSameLabel,
  placeKey,
  placeLabelChainText,
  placeName,
  PlaceNode,
  placeParentName,
  placePathText,
} from '@utils/label-structure';
import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

/** Fler underenheter än så blir en ohanterlig radioknappsgrupp — då används sökning istället */
const MAX_RADIO_SUB_PLACES = 6;

export function FacilitySearchWidget(props: FieldProps<FacilityInfoDTO>) {
  const { t } = useTranslation('forms');
  const { idSchema, formData, disabled, readonly, required, rawErrors, onBlur, onChange, onFocus, uiSchema } = props;
  const id = idSchema.$id;
  const searchLabelId = `${id}__search-label`;
  const subPlaceLabelId = `${id}__sub-place-label`;
  const describedBy = ariaDescribedByIds(id);
  const invalid = Boolean(rawErrors?.length);

  const uiOptions = (uiSchema?.['ui:options'] ?? {}) as Record<string, unknown>;
  const className = (uiOptions.className as string) || 'w-full';

  const metadata = useMetadataStore((state) => state.metadata);
  const placeNodes = useMemo(() => getPlaceNodes(metadata?.labels?.labelStructure), [metadata?.labels?.labelStructure]);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const employmentMatchRef = useRef<{ node: PlaceNode; employment: UserEmploymentDTO } | null>(null);
  const prefillDoneRef = useRef(false);

  const isEditable = !disabled && !readonly;

  const selectedNode = useMemo(
    () => findPlaceNode(placeNodes, formData?.orgName, formData?.parentOrgName),
    [placeNodes, formData?.orgName, formData?.parentOrgName]
  );
  const subPlaceNodes = useMemo(
    () => (selectedNode ? getSubPlaceNodes(placeNodes, selectedNode) : []),
    [placeNodes, selectedNode]
  );
  const needsSubPlaceChoice = subPlaceNodes.length > 0;

  const selectPlace = useCallback(
    (node: PlaceNode) => {
      const match = employmentMatchRef.current;
      const isEmploymentPlace = !!match && isSameLabel(node.label, match.node.label);
      const withinEmploymentBranch = !!match && isDescendantOrSelf(node, match.node);

      onChange({
        orgId: isEmploymentPlace ? match.employment.orgId : undefined,
        orgName: placeName(node),
        parentOrgName: placeParentName(node),
        manager: withinEmploymentBranch ? match.employment.manager : undefined,
      });
      setIsConfirmed(false);
    },
    [onChange]
  );

  // Förpopulera från användarens anställning. Anställningen används bara för att hitta rätt nod i
  // labelstrukturen — har noden underenheter måste användaren själv välja en av dem.
  useEffect(() => {
    if (!isEditable || prefillDoneRef.current || placeNodes.length === 0) return;
    if (formData?.orgName) {
      prefillDoneRef.current = true;
      return;
    }

    prefillDoneRef.current = true;

    const prefillFromEmployment = async () => {
      try {
        const employments = await getUserEmployments();
        for (const employment of employments) {
          const node = findPlaceNode(placeNodes, employment.orgName);
          if (node) {
            employmentMatchRef.current = { node, employment };
            selectPlace(node);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load employments:', error);
      }
    };

    void prefillFromEmployment();
  }, [isEditable, placeNodes, formData?.orgName, selectPlace]);

  const handleSelectPlace = useCallback(
    (key: string) => {
      const node = findPlaceNodeByKey(placeNodes, key);
      if (node) {
        selectPlace(node);
      }
    },
    [placeNodes, selectPlace]
  );

  const handleRemove = useCallback(() => {
    onChange(undefined);
    setIsConfirmed(false);
  }, [onChange]);

  const sectionTitle = <h2 className="hidden md:block text-xl font-bold mb-6">{t('facility_search.section_title')}</h2>;

  if (!metadata) {
    return (
      <div className={className}>
        {sectionTitle}
        <p className="text-text-secondary">{t('facility_search.loading')}</p>
      </div>
    );
  }

  if (placeNodes.length === 0) {
    return (
      <div className={className}>
        {sectionTitle}
        <p className="text-error" data-cy="facility-structure-missing">
          {t('facility_search.no_place_structure')}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {sectionTitle}

      {!selectedNode && (
        <FormControl disabled={!isEditable} invalid={invalid} required={required} className="w-full">
          <FormLabel id={searchLabelId} htmlFor={id} className="font-bold">
            {t('facility_search.add_label')}
          </FormLabel>
          <Combobox
            id={`${id}__combobox`}
            className="w-full"
            value=""
            aria-labelledby={searchLabelId}
            aria-describedby={describedBy}
            onChange={(e: { target: { value: unknown } }) => {
              handleSelectPlace(String(e.target.value));
            }}
            data-cy="facility-search"
          >
            <Combobox.Input
              id={id}
              placeholder={t('facility_search.placeholder')}
              className="w-full"
              disabled={!isEditable}
              readOnly={!!readonly}
              required={required}
              aria-labelledby={searchLabelId}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              onBlur={() => {
                onBlur(id, formData);
              }}
              onFocus={() => {
                onFocus(id, formData);
              }}
            />
            <Combobox.List>
              {placeNodes.map((node) => (
                <Combobox.Option key={placeKey(node)} value={placeKey(node)}>
                  {placePathText(node)}
                </Combobox.Option>
              ))}
            </Combobox.List>
          </Combobox>
          <span className="text-small text-text-secondary mt-4">{t('facility_search.label_hint')}</span>
        </FormControl>
      )}

      {selectedNode && (
        <div className="border-1 rounded-12 bg-background-content w-full mt-16" data-cy="facility-card">
          <div className="rounded-t-12 bg-vattjom-background-200 h-[4rem] flex items-center">
            <strong className="px-[1rem]">{t('facility_search.card_header')}</strong>
          </div>
          <div className="p-[1rem]">
            <div className="flex flex-col gap-12">
              <div className="min-w-0">
                <p className="text-[1.6rem] font-semibold break-words" data-cy="facility-name">
                  {placeName(selectedNode)}
                </p>
                <p className="text-small text-text-secondary break-words">{placePathText(selectedNode)}</p>
              </div>

              {needsSubPlaceChoice ?
                <FormControl disabled={!isEditable} required className="w-full">
                  <FormLabel id={subPlaceLabelId} className="font-bold">
                    {t('facility_search.select_sub_place', { place: placeName(selectedNode) })}
                  </FormLabel>
                  {subPlaceNodes.length <= MAX_RADIO_SUB_PLACES ?
                    <RadioButton.Group aria-labelledby={subPlaceLabelId} data-cy="facility-sub-place-options">
                      {subPlaceNodes.map((node) => (
                        <RadioButton
                          key={placeKey(node)}
                          name="facility-sub-place"
                          value={placeKey(node)}
                          checked={false}
                          disabled={!isEditable}
                          onChange={(e) => {
                            handleSelectPlace(e.target.value);
                          }}
                        >
                          {placeName(node)}
                        </RadioButton>
                      ))}
                    </RadioButton.Group>
                  : <Combobox
                      className="w-full"
                      value=""
                      aria-labelledby={subPlaceLabelId}
                      onChange={(e: { target: { value: unknown } }) => {
                        handleSelectPlace(String(e.target.value));
                      }}
                      data-cy="facility-sub-place-options"
                    >
                      <Combobox.Input placeholder={t('facility_search.placeholder')} className="w-full" />
                      <Combobox.List>
                        {subPlaceNodes.map((node) => (
                          <Combobox.Option key={placeKey(node)} value={placeKey(node)}>
                            {placeName(node)}
                          </Combobox.Option>
                        ))}
                      </Combobox.List>
                    </Combobox>
                  }
                  <span className="text-small mt-4" data-cy="facility-sub-place-required">
                    {t('facility_search.sub_place_required')}
                  </span>
                </FormControl>
              : <div className="text-small text-text-secondary break-words" data-cy="facility-label-preview">
                  {t('facility_search.label_preview')} {placeLabelChainText(selectedNode)}
                </div>
              }

              <div className="flex gap-8 justify-center">
                {needsSubPlaceChoice ?
                  isEditable && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<X size={16} />}
                      onClick={handleRemove}
                      className="flex-1"
                      data-cy="facility-remove-button"
                    >
                      {t('facility_search.remove')}
                    </Button>
                  )
                : <>
                    {disabled || readonly || isConfirmed ?
                      <>
                        <span className="flex items-center gap-4 text-gronsta-surface-primary">
                          <Check size={16} />
                          {t('facility_search.confirmed')}
                        </span>
                        {isEditable && (
                          <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            onClick={() => {
                              setIsConfirmed(false);
                            }}
                            className="flex-1"
                          >
                            {t('facility_search.edit')}
                          </Button>
                        )}
                      </>
                    : <>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          leftIcon={<Check size={16} />}
                          onClick={() => {
                            setIsConfirmed(true);
                          }}
                          className="flex-1"
                          data-cy="facility-confirm-button"
                        >
                          {t('facility_search.confirm')}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          leftIcon={<X size={16} />}
                          onClick={handleRemove}
                          className="flex-1"
                          data-cy="facility-remove-button"
                        >
                          {t('facility_search.remove')}
                        </Button>
                      </>
                    }
                  </>
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
