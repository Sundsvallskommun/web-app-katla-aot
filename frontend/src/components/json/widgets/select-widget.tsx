'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Select } from '@sk-web-gui/react';

import { getCommonProps, getWidgetOptions } from './types';

const DEFAULT_CLASS = 'w-full';

export function SelectWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const { enumOptions = [] } = getWidgetOptions(props.options);

  const currentValue = value ?? '';

  return (
    <Select
      className={className}
      id={id}
      value={currentValue as string | number}
      onChange={(e) => {
        onChange(e.currentTarget.value || undefined);
      }}
      disabled={disabled || readonly}
      aria-readonly={readonly}
      required={required}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      onBlur={onBlur}
      onFocus={onFocus}
    >
      {enumOptions.map((option) => (
        <Select.Option key={String(option.value)} value={option.value as string | number}>
          {option.label}
        </Select.Option>
      ))}
    </Select>
  );
}
