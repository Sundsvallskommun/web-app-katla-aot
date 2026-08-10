import type { FieldTemplateProps } from '@rjsf/utils';
import { FormControl, FormErrorMessage, FormLabel } from '@sk-web-gui/react';

export function FieldTemplate(props: FieldTemplateProps) {
  const { id, label, required, displayLabel, help, children, uiSchema, rawErrors, schema } = props;

  const hideLabel = uiSchema?.['ui:options']?.hideLabel;
  const hideDescription = uiSchema?.['ui:options']?.hideDescription;
  const descriptionBelow = uiSchema?.['ui:options']?.descriptionBelow;
  const classNameOption = uiSchema?.['ui:options']?.className;
  const className = typeof classNameOption === 'string' ? classNameOption : undefined;
  const isHiddenWidget = uiSchema?.['ui:widget'] === 'hidden';

  if (isHiddenWidget) {
    return <>{children}</>;
  }

  const hasError = rawErrors && rawErrors.length > 0;
  const formControlClassName = className ? `form-row ${className}` : 'form-row w-full';

  // Get description from ui:description or schema.description
  const descriptionText = (uiSchema?.['ui:description'] ?? '') || (schema.description ?? '');

  const renderDescription = (position: 'above' | 'below') => {
    if (!descriptionText || hideDescription) return null;
    const marginClass = position === 'above' ? 'mb-2' : 'mt-2';
    return (
      <div
        id={`${id}-desc`}
        className={`text-xs text-muted-foreground ${marginClass} [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4`}
        dangerouslySetInnerHTML={{ __html: descriptionText }}
      />
    );
  };

  return (
    <FormControl className={formControlClassName} invalid={hasError}>
      {displayLabel && !hideLabel && (
        <FormLabel htmlFor={id}>
          {label}
          {required ? ' *' : ''}
        </FormLabel>
      )}

      {!descriptionBelow && renderDescription('above')}

      {children}

      {descriptionBelow && renderDescription('below')}

      {hasError && <FormErrorMessage className="text-error">{rawErrors[0]}</FormErrorMessage>}

      {help}
    </FormControl>
  );
}
