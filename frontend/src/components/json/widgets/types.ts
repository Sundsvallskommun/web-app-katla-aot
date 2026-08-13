import { ariaDescribedByIds, type WidgetProps } from '@rjsf/utils';

export interface EnumOption {
  value: string | number | boolean;
  label: string;
}

/**
 * Utökade alternativ som kan skickas via ui:options i schemat
 */
export interface WidgetOptions {
  className?: string;
  placeholder?: string;
  multiple?: boolean;
  disableToolbar?: boolean;
  enumOptions?: EnumOption[];
}

export function getWidgetOptions(options: WidgetProps['options']): WidgetOptions {
  const opts = (options ?? {}) as Record<string, unknown>;
  return {
    className: opts.className as string | undefined,
    placeholder: opts.placeholder as string | undefined,
    multiple: opts.multiple as boolean | undefined,
    disableToolbar: opts.disableToolbar as boolean | undefined,
    enumOptions: opts.enumOptions as EnumOption[] | undefined,
  };
}

export interface CommonWidgetProps {
  id: string;
  value: unknown;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
  describedBy: string;
  label: string;
  hideLabel: boolean;
  className: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export function getCommonProps(props: WidgetProps, defaultClassName: string): CommonWidgetProps {
  const { id, disabled, readonly, required, rawErrors, label, hideLabel, onChange } = props;
  const value: unknown = props.value;
  const options = getWidgetOptions(props.options);

  return {
    id,
    value,
    disabled: !!disabled,
    readonly: !!readonly,
    required: !!required,
    invalid: Boolean(rawErrors?.length),
    describedBy: ariaDescribedByIds(id),
    label,
    hideLabel: !!hideLabel,
    className: (options.className ?? '') || defaultClassName,
    onChange,
    onBlur: () => {
      props.onBlur(id, value);
    },
    onFocus: () => {
      props.onFocus(id, value);
    },
  };
}

/**
 * Tar bort HTML-taggar ur en sträng för att få ren text.
 * Används för att validera textlängd utan att räkna med HTML-uppmärkning.
 */
export function stripHtml(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').trim();
  }
  // Reserv för SSR: iterativ parser i stället för regex för att undvika ReDoS
  let result = '';
  let inTag = false;
  for (const char of html) {
    if (char === '<') inTag = true;
    else if (char === '>') inTag = false;
    else if (!inTag) result += char;
  }
  return result.trim();
}
