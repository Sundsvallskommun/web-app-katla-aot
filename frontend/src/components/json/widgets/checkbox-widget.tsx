'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Checkbox, FormControl } from '@sk-web-gui/react';

import { getCommonProps } from './types';

const DEFAULT_CLASS = 'w-full';

export function CheckboxWidget(props: WidgetProps) {
  const {
    id,
    value,
    disabled,
    readonly,
    required,
    invalid,
    describedBy,
    label,
    hideLabel,
    className,
    onChange,
    onBlur,
    onFocus,
  } = getCommonProps(props, DEFAULT_CLASS);

  return (
    <FormControl className={className} invalid={invalid}>
      <Checkbox
        id={id}
        checked={!!value}
        disabled={disabled || readonly}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onBlur={onBlur}
        onFocus={onFocus}
        onChange={(e) => {
          onChange(e.currentTarget.checked);
        }}
      >
        <span className={hideLabel ? 'sr-only' : undefined}>{label}</span>
      </Checkbox>
    </FormControl>
  );
}
