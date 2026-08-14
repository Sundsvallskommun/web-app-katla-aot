'use client';
import { FacilityInfoDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
import { ariaDescribedByIds, type FieldProps } from '@rjsf/utils';
import { getUserEmployments } from '@services/employee-service/employee-service';
import { Button, Combobox, FormControl, FormLabel, RadioButton } from '@sk-web-gui/react';
import {
  findPlaceNode,
  findPlaceNodeByKey,
  getParentPlaceNode,
  getPlaceNodes,
  getPlaceSelectionPresentation,
  getSubPlaceNodes,
  hasSubPlaces,
  isDescendantOrSelf,
  isSameLabel,
  matchesPlaceSearch,
  placeKey,
  placeName,
  PlaceNode,
  placeParentName,
} from '@utils/label-structure';
import { Check, Pen } from 'lucide-react';
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
  const selectablePlaceNodes = useMemo(() => placeNodes.filter((node) => !hasSubPlaces(node)), [placeNodes]);

  const [placeSearchValue, setPlaceSearchValue] = useState('');
  const [suggestedNode, setSuggestedNode] = useState<PlaceNode | null>(null);
  const employmentMatchRef = useRef<{ node: PlaceNode; employment: UserEmploymentDTO } | null>(null);
  const prefillDoneRef = useRef(false);

  const isEditable = !disabled && !readonly;

  const selectedNode = useMemo(
    () => findPlaceNode(placeNodes, formData?.orgName, formData?.parentOrgName),
    [placeNodes, formData?.orgName, formData?.parentOrgName]
  );
  const selectedPlacePresentation = useMemo(
    () => (selectedNode ? getPlaceSelectionPresentation(selectedNode) : undefined),
    [selectedNode]
  );
  const filteredSelectablePlaceNodes = useMemo(
    () => selectablePlaceNodes.filter((node) => matchesPlaceSearch(node, placeSearchValue)),
    [placeSearchValue, selectablePlaceNodes]
  );
  const subPlaceParentNode = useMemo(() => {
    if (!selectedNode) return undefined;
    if (hasSubPlaces(selectedNode)) return selectedNode;
    return selectedPlacePresentation?.department ? getParentPlaceNode(placeNodes, selectedNode) : undefined;
  }, [placeNodes, selectedNode, selectedPlacePresentation?.department]);
  const subPlaceNodes = useMemo(
    () => (subPlaceParentNode ? getSubPlaceNodes(placeNodes, subPlaceParentNode) : []),
    [placeNodes, subPlaceParentNode]
  );
  const selectedSubPlaceKey = useMemo(
    () =>
      selectedNode && subPlaceNodes.some((node) => isSameLabel(node.label, selectedNode.label)) ?
        placeKey(selectedNode)
      : '',
    [selectedNode, subPlaceNodes]
  );
  const mustChooseSubPlace = Boolean(selectedNode && hasSubPlaces(selectedNode));
  const showSubPlaceChoice =
    mustChooseSubPlace || Boolean(selectedPlacePresentation?.department && subPlaceNodes.length > 1);

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
    },
    [onChange]
  );

  // Föreslå plats utifrån användarens anställning — men sätt den inte som vald. Platsvalet styr
  // vilka som får se ärendet, och den som rapporterar åt en annan verksamhet än sin egen ska inte
  // kunna skicka in på en plats hen aldrig tagit ställning till. Anställningen används bara för att
  // hitta rätt nod i labelstrukturen; har noden underenheter måste användaren välja en av dem.
  useEffect(() => {
    if (!isEditable || prefillDoneRef.current || placeNodes.length === 0) return;
    if (formData?.orgName) {
      prefillDoneRef.current = true;
      return;
    }

    prefillDoneRef.current = true;

    const suggestFromEmployment = async () => {
      try {
        const employments = await getUserEmployments();
        // Backend sorterar huvudanställningen först, så den föreslås före eventuella sidotjänster.
        for (const employment of employments) {
          const node = findPlaceNode(placeNodes, employment.orgName);
          if (node) {
            employmentMatchRef.current = { node, employment };
            setSuggestedNode(node);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load employments:', error);
      }
    };

    void suggestFromEmployment();
  }, [isEditable, placeNodes, formData?.orgName]);

  const suggestedPlacePresentation = useMemo(
    () => (suggestedNode ? getPlaceSelectionPresentation(suggestedNode) : undefined),
    [suggestedNode]
  );

  const handleAcceptSuggestion = useCallback(() => {
    if (suggestedNode) {
      selectPlace(suggestedNode);
      setSuggestedNode(null);
    }
  }, [selectPlace, suggestedNode]);

  const handleSelectPlace = useCallback(
    (key: string) => {
      const node = findPlaceNodeByKey(placeNodes, key);
      if (node) {
        selectPlace(node);
      }
    },
    [placeNodes, selectPlace]
  );

  const handleChangePlace = useCallback(() => {
    onChange(undefined);
    setPlaceSearchValue('');
    // Förslaget kommer inte tillbaka. Har användaren aktivt rensat platsen är anställningen
    // inte längre en rimlig gissning.
    setSuggestedNode(null);
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
            size="lg"
            value=""
            autofilter={false}
            aria-labelledby={searchLabelId}
            aria-describedby={describedBy}
            onChangeSearch={(e) => {
              setPlaceSearchValue(e.target.value);
            }}
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
            <Combobox.List style={{ maxHeight: '32rem' }}>
              {filteredSelectablePlaceNodes.map((node) => {
                const presentation = getPlaceSelectionPresentation(node);
                const optionText =
                  presentation.department ?
                    `${presentation.place} — ${t('facility_search.department_label')}: ${presentation.department}`
                  : presentation.place;

                return (
                  <Combobox.Option
                    key={placeKey(node)}
                    value={placeKey(node)}
                    style={{
                      alignItems: 'flex-start',
                      lineHeight: 1.4,
                      overflowWrap: 'anywhere',
                      paddingBlock: '0.75rem',
                      whiteSpace: 'normal',
                    }}
                  >
                    {optionText}
                  </Combobox.Option>
                );
              })}
            </Combobox.List>
          </Combobox>
          <span className="text-small text-text-secondary mt-4">{t('facility_search.label_hint')}</span>
        </FormControl>
      )}

      {!selectedNode && suggestedNode && (
        <div className="border-1 rounded-12 bg-background-content w-full mt-16" data-cy="facility-suggestion">
          <div className="rounded-t-12 bg-juniskar-background-200 px-16 py-12">
            <strong>{t('facility_search.suggestion_header')}</strong>
          </div>
          <div className="p-16 flex flex-col gap-16">
            <div className="min-w-0">
              <p className="text-[1.6rem] font-semibold break-words" data-cy="facility-suggestion-name">
                {suggestedPlacePresentation?.place}
              </p>
              {suggestedPlacePresentation?.department && (
                <p className="text-small text-text-secondary break-words">
                  <span className="font-semibold">{t('facility_search.department_label')}:</span>{' '}
                  {suggestedPlacePresentation.department}
                </p>
              )}
            </div>

            <p className="text-small text-text-secondary">{t('facility_search.suggestion_description')}</p>

            <div className="flex flex-wrap gap-8 border-t-1 border-divider pt-12">
              <Button
                type="button"
                variant="primary"
                color="vattjom"
                size="sm"
                leftIcon={<Check size={16} aria-hidden="true" />}
                onClick={handleAcceptSuggestion}
                data-cy="facility-accept-suggestion-button"
              >
                {t('facility_search.suggestion_confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedNode && (
        <div className="border-1 rounded-12 bg-background-content w-full mt-16" data-cy="facility-card">
          <div className="rounded-t-12 bg-vattjom-background-200 px-16 py-12">
            <strong>{t('facility_search.card_header')}</strong>
          </div>
          <div className="p-16">
            <div className="flex flex-col gap-16">
              <div className="min-w-0">
                <p className="text-[1.6rem] font-semibold break-words" data-cy="facility-name">
                  {selectedPlacePresentation?.place}
                </p>
                {selectedPlacePresentation?.department && (
                  <p className="text-small text-text-secondary break-words" data-cy="facility-department">
                    <span className="font-semibold">{t('facility_search.department_label')}:</span>{' '}
                    {selectedPlacePresentation.department}
                  </p>
                )}
              </div>

              {showSubPlaceChoice && subPlaceParentNode ?
                <FormControl disabled={!isEditable} required={mustChooseSubPlace} className="w-full">
                  <FormLabel id={subPlaceLabelId} className="font-bold">
                    {t('facility_search.select_sub_place', { place: placeName(subPlaceParentNode) })}
                  </FormLabel>
                  {subPlaceNodes.length <= MAX_RADIO_SUB_PLACES ?
                    <RadioButton.Group aria-labelledby={subPlaceLabelId} data-cy="facility-sub-place-options">
                      {subPlaceNodes.map((node) => (
                        <RadioButton
                          key={placeKey(node)}
                          name="facility-sub-place"
                          value={placeKey(node)}
                          checked={isSameLabel(node.label, selectedNode.label)}
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
                      value={selectedSubPlaceKey}
                      aria-labelledby={subPlaceLabelId}
                      onChange={(e: { target: { value: unknown } }) => {
                        handleSelectPlace(String(e.target.value));
                      }}
                      data-cy="facility-sub-place-options"
                    >
                      <Combobox.Input placeholder={t('facility_search.placeholder')} className="w-full" />
                      <Combobox.List style={{ maxHeight: '32rem' }}>
                        {subPlaceNodes.map((node) => (
                          <Combobox.Option
                            key={placeKey(node)}
                            value={placeKey(node)}
                            style={{ overflowWrap: 'anywhere', whiteSpace: 'normal' }}
                          >
                            {placeName(node)}
                          </Combobox.Option>
                        ))}
                      </Combobox.List>
                    </Combobox>
                  }
                  {mustChooseSubPlace && (
                    <span className="text-small mt-4" data-cy="facility-sub-place-required">
                      {t('facility_search.sub_place_required')}
                    </span>
                  )}
                </FormControl>
              : null}

              {isEditable && (
                <div className="flex flex-wrap border-t-1 border-divider pt-12">
                  <Button
                    type="button"
                    variant="tertiary"
                    color="vattjom"
                    size="sm"
                    leftIcon={<Pen size={16} aria-hidden="true" />}
                    onClick={handleChangePlace}
                    data-cy="facility-change-button"
                  >
                    {t('facility_search.change')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
