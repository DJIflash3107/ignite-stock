import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export function formatDate(date: string | number | Date | null | undefined, format = 'DD MMM YYYY'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | number | Date | null | undefined, format = 'DD MMM YYYY, HH:mm'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function timeAgo(date: string | number | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).fromNow();
}

export { dayjs };
export default dayjs;
