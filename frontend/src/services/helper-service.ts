import dayjs from 'dayjs';

export function prettyTime(time: string) {
  if (!time) {
    return '';
  }
  const d = dayjs(time);
  // check if today
  if (d.isSame(dayjs(), 'day')) {
    return `Idag ${d.format('HH:mm')}`;
  } else if (d.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return `Igår ${d.format('HH:mm')}`;
  } else {
    return d.format('YYYY-MM-DD HH:mm');
  }
}
