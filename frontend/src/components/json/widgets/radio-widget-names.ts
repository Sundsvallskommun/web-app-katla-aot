/**
 * De namn i widgetregistret som renderar radiogruppen. FieldTemplate måste veta
 * vilka fält som är grupper för att ge dem fieldset/legend i stället för en
 * label som pekar på ett enskilt id, och registret är enda sanningen om vilka
 * namn som faktiskt leder dit. Nya alias läggs till här och i registret.
 */
export const RADIO_WIDGET_NAMES = ['radio', 'RadioWidget'] as const;

export const isRadioWidgetName = (widget: unknown): boolean =>
  typeof widget === 'string' && RADIO_WIDGET_NAMES.some((name) => name === widget);
