import 'dayjs/locale/sv';
import 'dayjs/locale/en';

import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(updateLocale);

// Versala månadsnamn är husets stil; dayjs svenska locale skriver dem gement.
// Engelskans månadsnamn är redan versala och behöver ingen motsvarande justering.
dayjs.updateLocale('sv', {
  months: [
    'Januari',
    'Februari',
    'Mars',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'Augusti',
    'September',
    'Oktober',
    'November',
    'December',
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
});

/**
 * Håller dayjs globala locale i takt med gränssnittets språk. Designsystemets datumfält
 * formaterar via dayjs, så utan den här synkroniseringen skulle de fortsätta visa svenska
 * månads- och veckodagsnamn i ett engelskt gränssnitt.
 */
export const setDayjsLocale = (locale: string): void => {
  dayjs.locale(locale);
};
