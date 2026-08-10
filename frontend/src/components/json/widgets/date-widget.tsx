'use client';
import type { WidgetProps } from '@rjsf/utils';
import { DatePicker } from '@sk-web-gui/react';

import { getCommonProps, getWidgetOptions } from './types';

const DEFAULT_CLASS = 'w-full';

export function DateWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, className, onChange } = getCommonProps(props, DEFAULT_CLASS);
  const placeholder = (props.uiSchema?.['ui:placeholder'] ?? '') || getWidgetOptions(props.options).placeholder;

  return (
    <DatePicker
      className={className}
      id={id}
      type="date"
      placeholder={placeholder}
      value={(value as string) ?? ''}
      disabled={disabled}
      readOnly={readonly}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  );
}
