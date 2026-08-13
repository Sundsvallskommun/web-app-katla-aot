import { isRadioWidgetName } from '@components/json/widgets/radio-widget-names';
import { ariaDescribedByIds, descriptionId, errorId, type FieldTemplateProps, titleId } from '@rjsf/utils';
import { FormControl, FormErrorMessage, FormLabel } from '@sk-web-gui/react';
import { INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import { useTranslation } from 'react-i18next';

import { sanitizeFieldDescription } from './sanitize-field-description';

export function FieldTemplate(props: FieldTemplateProps) {
  const { t } = useTranslation('forms');
  const { id, label, required, displayLabel, help, children, uiSchema, rawErrors, schema, disabled, readonly } = props;

  const hideLabel = uiSchema?.['ui:options']?.hideLabel;
  const hideDescription = uiSchema?.['ui:options']?.hideDescription;
  const descriptionBelow = uiSchema?.['ui:options']?.descriptionBelow;
  const classNameOption = uiSchema?.['ui:options']?.className;
  const className = typeof classNameOption === 'string' ? classNameOption : undefined;
  const isHiddenWidget = uiSchema?.['ui:widget'] === 'hidden';

  if (isHiddenWidget) {
    return <>{children}</>;
  }

  const hasError = Boolean(rawErrors?.length);
  const formControlClassName = className ? `form-row ${className}` : 'form-row w-full';
  const isRadioGroup = isRadioWidgetName(uiSchema?.['ui:widget']);
  // Märker fältet så att felnavigeringen hittar det, oavsett var i formuläret det ligger.
  const invalidFieldProps = hasError ? { [INVALID_FIELD_ATTRIBUTE]: id } : {};

  const uiDescription = uiSchema?.['ui:description'];
  const descriptionText = typeof uiDescription === 'string' ? uiDescription : (schema.description ?? '');
  const newTabAnnouncementId = `${descriptionId(id)}__new-tab`;
  const sanitizedDescription = sanitizeFieldDescription(descriptionText, newTabAnnouncementId);

  const renderDescription = (position: 'above' | 'below') => {
    if (!sanitizedDescription.html || hideDescription) return null;
    const marginClass = position === 'above' ? 'mb-2' : 'mt-2';
    return (
      <>
        <div
          id={descriptionId(id)}
          className={`text-xs text-muted-foreground ${marginClass} [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4`}
          dangerouslySetInnerHTML={{ __html: sanitizedDescription.html }}
        />
        {sanitizedDescription.hasNewTabLink && (
          <span id={newTabAnnouncementId} className="sr-only">
            {t('field_description.new_tab_announcement')}
          </span>
        )}
      </>
    );
  };

  const fieldContent = (
    <>
      {displayLabel && (
        <FormLabel
          id={titleId(id)}
          {...(isRadioGroup ? { as: 'legend' } : { htmlFor: id })}
          className={hideLabel ? 'sr-only' : undefined}
        >
          {label}
        </FormLabel>
      )}

      {!descriptionBelow && renderDescription('above')}

      {children}

      {descriptionBelow && renderDescription('below')}

      {hasError && (
        <FormErrorMessage id={errorId(id)} className="text-error">
          {rawErrors?.[0]}
        </FormErrorMessage>
      )}

      {help}
    </>
  );

  if (isRadioGroup) {
    return (
      <FormControl
        className={formControlClassName}
        required={required}
        invalid={hasError}
        disabled={disabled || readonly}
        readOnly={readonly}
        {...invalidFieldProps}
      >
        <fieldset
          id={id}
          className="m-0 min-w-0 w-full border-0 p-0"
          disabled={disabled || readonly}
          aria-describedby={ariaDescribedByIds(id)}
          aria-invalid={hasError}
        >
          {fieldContent}
        </fieldset>
      </FormControl>
    );
  }

  return (
    <FormControl
      className={formControlClassName}
      required={required}
      invalid={hasError}
      disabled={disabled}
      readOnly={readonly}
      {...invalidFieldProps}
    >
      {fieldContent}
    </FormControl>
  );
}
