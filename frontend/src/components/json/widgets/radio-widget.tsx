'use client';
import type { WidgetProps } from '@rjsf/utils';
import { FormControl, RadioButton } from '@sk-web-gui/react';
import { useId } from 'react';

import { getCommonProps, getWidgetOptions } from './types';

const DEFAULT_CLASS = 'w-full';

export function RadiobuttonWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, className, onChange } = getCommonProps(props, DEFAULT_CLASS);
  const { enumOptions = [] } = getWidgetOptions(props.options);
  const uid = useId();
  const groupName = id || `radio-${uid}`;

  return (
    <FormControl className={className}>
      <div className="flex flex-wrap gap-12" id={groupName} role="radiogroup" aria-labelledby={`${groupName}-label`}>
        {enumOptions.map((option) => (
          <RadioButton
            key={String(option.value)}
            name={groupName}
            value={String(option.value)}
            checked={value === option.value}
            disabled={disabled || readonly}
            onChange={() => {
              onChange(option.value);
            }}
          >
            {option.label}
          </RadioButton>
        ))}
      </div>
    </FormControl>
  );
}
