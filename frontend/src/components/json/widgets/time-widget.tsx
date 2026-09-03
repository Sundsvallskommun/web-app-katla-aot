'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Input } from '@sk-web-gui/react';

import { getCommonProps } from './types';

const DEFAULT_CLASS = 'w-full';

/**
 * A native time field gives HH:mm, but JSON Schema's `time` format requires seconds. Seconds
 * are therefore only added when the schema actually demands them, so fields without a format
 * keep exactly the value the user picked.
 */
function toSchemaValue(value: string, requiresSeconds: boolean): string | undefined {
  if (value === '') return undefined;
  return requiresSeconds && value.split(':').length === 2 ? `${value}:00` : value;
}

export function TimeWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const requiresSeconds = props.schema.format === 'time';

  return (
    <Input
      id={id}
      className={className}
      type="time"
      value={(value as string) ?? ''}
      disabled={disabled}
      readOnly={readonly}
      required={required}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      onBlur={onBlur}
      onFocus={onFocus}
      onChange={(e) => {
        onChange(toSchemaValue(e.currentTarget.value, requiresSeconds));
      }}
    />
  );
}
