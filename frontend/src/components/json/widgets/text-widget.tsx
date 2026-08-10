'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Input } from '@sk-web-gui/react';

import { getCommonProps, getWidgetOptions } from './types';

const DEFAULT_CLASS = 'w-full';

export function TextWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, className, onChange } = getCommonProps(props, DEFAULT_CLASS);
  const placeholder = (props.uiSchema?.['ui:placeholder'] ?? '') || getWidgetOptions(props.options).placeholder;

  return (
    <Input
      id={id}
      className={className}
      placeholder={placeholder}
      value={(value as string) ?? ''}
      disabled={disabled || readonly}
      onChange={(e) => {
        const val = e.currentTarget.value;
        onChange(val === '' ? undefined : val);
      }}
    />
  );
}
