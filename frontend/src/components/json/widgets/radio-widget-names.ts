/**
 * The widget registry names that render the radio group. FieldTemplate needs to know which
 * fields are groups so it can give them fieldset/legend rather than a label pointing at a single
 * id, and the registry is the only truth about which names lead there. Add new aliases here and
 * in the registry.
 */
export const RADIO_WIDGET_NAMES = ['radio', 'RadioWidget'] as const;

export const isRadioWidgetName = (widget: unknown): boolean =>
  typeof widget === 'string' && RADIO_WIDGET_NAMES.some((name) => name === widget);
