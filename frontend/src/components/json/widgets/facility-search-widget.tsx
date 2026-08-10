'use client';
import { FacilityInfoDTO, OrgLeafNodeDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
import type { FieldProps } from '@rjsf/utils';
import { getUserEmployments } from '@services/employee-service/employee-service';
import { getOrgLeafNodes } from '@services/organization/organization-service';
import { Check, X } from 'lucide-react';
import { Button, Combobox, FormControl, FormLabel } from '@sk-web-gui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function FacilitySearchWidget(props: FieldProps) {
  const { t } = useTranslation('forms');
  const { idSchema, formData, disabled, readonly, onChange, uiSchema } = props;
  const id = idSchema.$id;

  const uiOptions = (uiSchema?.['ui:options'] || {}) as Record<string, unknown>;
  const className = (uiOptions.className as string) || 'w-full';

  const facilityInfo = formData as FacilityInfoDTO | undefined;

  const employmentsLoadedRef = useRef(false);
  const autoSelectedRef = useRef(false);

  const [searchValue, setSearchValue] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [topOrgId, setTopOrgId] = useState<number | null>(null);
  const [leafNodes, setLeafNodes] = useState<OrgLeafNodeDTO[]>([]);
  const [isLoadingLeafNodes, setIsLoadingLeafNodes] = useState(false);

  const selectFacility = useCallback(
    (employment: UserEmploymentDTO) => {
      onChange({
        orgId: employment.orgId,
        orgName: employment.orgName,
        manager:
          employment.manager ?
            {
              personId: employment.manager.personId ?? undefined,
              givenname: employment.manager.givenname ?? undefined,
              lastname: employment.manager.lastname ?? undefined,
              emailAddress: employment.manager.emailAddress ?? undefined,
            }
          : undefined,
      });
    },
    [onChange]
  );

  useEffect(() => {
    if (disabled || readonly || employmentsLoadedRef.current) return;

    const loadEmployments = async () => {
      try {
        const employments = await getUserEmployments();
        employmentsLoadedRef.current = true;

        if (employments.length > 0) {
          setTopOrgId(employments[0].topOrgId ?? null);

          if (!autoSelectedRef.current && !formData?.orgId) {
            autoSelectedRef.current = true;
            selectFacility(employments[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load employments:', error);
      }
    };

    loadEmployments();
  }, [disabled, readonly, formData?.orgId, selectFacility]);

  const handleRemove = useCallback(async () => {
    onChange(undefined);
    setSearchValue('');
    setIsConfirmed(false);

    if (topOrgId) {
      setIsLoadingLeafNodes(true);
      try {
        const nodes = await getOrgLeafNodes(topOrgId);
        setLeafNodes(nodes);
      } catch (error) {
        console.error('Failed to load leaf nodes:', error);
      } finally {
        setIsLoadingLeafNodes(false);
      }
    }
  }, [onChange, topOrgId]);

  const handleSelectOrg = useCallback(
    (e: { target: { value: unknown } }) => {
      const selectedOrgId = Number(e.target.value);
      const selectedNode = leafNodes.find((n) => n.orgId === selectedOrgId);

      if (selectedNode) {
        onChange({
          orgId: selectedNode.orgId,
          orgName: selectedNode.orgName,
          parentOrgId: selectedNode.parentId,
        });
        setSearchValue('');
      }
    },
    [leafNodes, onChange]
  );

  const filteredLeafNodes = useMemo(() => {
    if (!searchValue.trim()) return leafNodes;
    const searchLower = searchValue.toLowerCase();
    return leafNodes.filter((n) => n.orgName.toLowerCase().includes(searchLower));
  }, [leafNodes, searchValue]);

  const hasSelection = !!facilityInfo?.orgId;

  return (
    <div className={className}>
      <h2 className="hidden md:block text-xl font-bold mb-6">{t('facility_search.section_title', 'Mer information om platsen')}</h2>

      <FormControl disabled={disabled || readonly || hasSelection || isLoadingLeafNodes} className="w-full">
        <FormLabel className="font-bold">
          {t('facility_search.add_label', 'Lägg till plats där avvikelsen inträffat')}
        </FormLabel>
        <Combobox
          id={id}
          className="w-full"
          value={hasSelection ? String(facilityInfo.orgId) : ''}
          onChange={handleSelectOrg}
        >
          <Combobox.Input
            placeholder={
              isLoadingLeafNodes ?
                t('facility_search.loading', 'Laddar...')
              : t('facility_search.search_placeholder', 'Sök organisation...')
            }
            className="w-full"
            value={hasSelection ? facilityInfo.orgName || '' : undefined}
          />
          <Combobox.List>
            {filteredLeafNodes.map((node) => (
              <Combobox.Option key={node.orgId} value={String(node.orgId)}>
                {node.orgName}
              </Combobox.Option>
            ))}
          </Combobox.List>
        </Combobox>
      </FormControl>

      {hasSelection && (
        <div className="border-1 rounded-12 bg-background-content w-full mt-16">
          <div className="rounded-t-12 bg-vattjom-background-200 h-[4rem] flex items-center">
            <strong className="px-[1rem]">{t('facility_search.card_header', 'Plats där avvikelsen inträffat')}</strong>
          </div>
          <div className="p-[1rem]">
            <div className="flex flex-col gap-12">
              <div className="min-w-0">
                <p className="text-[1.6rem] font-semibold break-words">{facilityInfo.orgName}</p>
              </div>

              <div className="flex gap-8 justify-center">
                {disabled || readonly || isConfirmed ?
                  <>
                    <span className="flex items-center gap-4 text-gronsta-surface-primary">
                      <Check size={16} />
                      {t('facility_search.confirmed', 'Bekräftat')}
                    </span>
                    {!disabled && !readonly && (
                      <Button type="button" variant="tertiary" size="sm" onClick={() => setIsConfirmed(false)} className="flex-1">
                        {t('facility_search.edit', 'Ändra')}
                      </Button>
                    )}
                  </>
                : <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      leftIcon={<Check size={16} />}
                      onClick={() => setIsConfirmed(true)}
                      className="flex-1"
                    >
                      {t('facility_search.confirm', 'Bekräfta')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<X size={16} />}
                      onClick={handleRemove}
                      className="flex-1"
                    >
                      {t('facility_search.remove', 'Ta bort')}
                    </Button>
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
