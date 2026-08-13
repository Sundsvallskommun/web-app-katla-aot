import dayjs from 'dayjs';
import type { TFunction } from 'i18next';

/**
 * Formaterar en tidpunkt relativt idag. `t` är obligatorisk – med en valfri svensk
 * reservtext hade en glömd inkoppling gett svenska ord i ett engelskt gränssnitt utan
 * att något test eller någon typkontroll märkt det.
 */
export function prettyTime(time: string, t: TFunction) {
  if (!time) {
    return '';
  }
  const d = dayjs(time);
  const clock = d.format('HH:mm');
  // check if today
  if (d.isSame(dayjs(), 'day')) {
    return t('common:time.today', { time: clock });
  } else if (d.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return t('common:time.yesterday', { time: clock });
  } else {
    return d.format('YYYY-MM-DD HH:mm');
  }
}
