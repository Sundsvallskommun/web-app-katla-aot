'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Input } from '@sk-web-gui/react';

import { getCommonProps } from './types';

const DEFAULT_CLASS = 'w-full';

/**
 * Ett nativt tidsfält lämnar HH:mm, men JSON Schemas `time`-format kräver sekunder.
 * Sekunder läggs därför bara till när schemat faktiskt kräver dem, så att fält utan
 * format behåller exakt det värde användaren valde.
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
