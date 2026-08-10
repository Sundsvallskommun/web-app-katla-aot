'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Checkbox, FormControl } from '@sk-web-gui/react';

import { getCommonProps } from './types';

const DEFAULT_CLASS = 'w-full';

export function CheckboxWidget(props: WidgetProps) {
  const { id, value, className, onChange } = getCommonProps(props, DEFAULT_CLASS);

  return (
    <FormControl className={className}>
      <Checkbox
        id={id}
        checked={!!value}
        onChange={(e) => {
          onChange(e.currentTarget.checked);
        }}
      />
    </FormControl>
  );
}
