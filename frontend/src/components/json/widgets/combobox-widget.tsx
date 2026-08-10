'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Combobox } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

import { getCommonProps, getWidgetOptions } from './types';

const DEFAULT_CLASS = 'w-full';

export function ComboboxWidget(props: WidgetProps) {
  const { t } = useTranslation('forms');
  const { id, value, disabled, readonly, className, onChange } = getCommonProps(props, DEFAULT_CLASS);
  const { enumOptions = [], placeholder: customPlaceholder, multiple: optMultiple } = getWidgetOptions(props.options);

  const schemaRecord = props.schema as Record<string, unknown>;
  const multiple = optMultiple ?? schemaRecord.type === 'array';
  const placeholder = (customPlaceholder ?? '') || t('combobox_placeholder');
  const currentValue: string | string[] =
    multiple ?
      Array.isArray(value) ? value.map(String)
      : typeof value === 'string' || typeof value === 'number' ? [String(value)]
      : []
    : typeof value === 'string' ? value
    : '';

  const handleChange = (e: { target: { value: unknown } }) => {
    const raw = e?.target?.value;
    if (multiple) {
      const arr = Array.isArray(raw) ? raw : [raw];
      onChange(arr.filter((x) => x !== undefined && x !== null && x !== ''));
    } else {
      onChange(raw ?? '');
    }
  };

  return (
    <Combobox
      id={id}
      className={className}
      multiple={multiple}
      value={currentValue}
      disabled={disabled || readonly}
      onChange={handleChange}
    >
      <Combobox.Input placeholder={placeholder} className="w-full" />
      <Combobox.List>
        {enumOptions.map((option) => (
          <Combobox.Option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </Combobox.Option>
        ))}
      </Combobox.List>
    </Combobox>
  );
}
