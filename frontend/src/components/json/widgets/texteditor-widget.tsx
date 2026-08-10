'use client';
import type { WidgetProps } from '@rjsf/utils';
import dynamic from 'next/dynamic';

import { getCommonProps, getWidgetOptions } from './types';

const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), { ssr: false });

const DEFAULT_CLASS = 'w-full h-[22rem]';

export function TexteditorWidget(props: WidgetProps) {
  const { value, className, onChange } = getCommonProps(props, DEFAULT_CLASS);
  const { disableToolbar } = getWidgetOptions(props.options);
  const showToolbar = disableToolbar === false;

  return (
    <TextEditor
      className={className}
      disableToolbar={!showToolbar}
      value={{ markup: value as string }}
      onChange={(event) => {
        onChange(event.target.value.markup ?? '');
      }}
    />
  );
}
