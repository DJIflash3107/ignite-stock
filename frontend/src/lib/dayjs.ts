import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

/**
 * Parse a backend timestamp into a dayjs instance.
 *
 * The API returns UTC datetimes with no timezone suffix (e.g.
 * "2026-10-01T16:03:03.202853") because SQLite drops the offset. `dayjs`
 * would otherwise treat those as *local* time, shifting them by the local
 * UTC offset (7 hours for WIB) and making recent items look hours old.
 *
 * We normalise such naive datetime strings to UTC by appending "Z", while
 * leaving values that already carry an explicit offset and date-only values
 * (e.g. "2026-10-01") untouched.
 */
function parseDate(date: string | number | Date): dayjs.Dayjs {
  if (typeof date === 'string') {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(date);
    const isNaiveDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(date) && !hasTimezone;
    if (isNaiveDateTime) {
      return dayjs(`${date}Z`);
    }
  }
  return dayjs(date);
}

export function formatDate(date: string | number | Date | null | undefined, format = 'DD MMM YYYY'): string {
  if (!date) return '-';
  return parseDate(date).format(format);
}

export function formatDateTime(date: string | number | Date | null | undefined, format = 'DD MMM YYYY, HH:mm'): string {
  if (!date) return '-';
  return parseDate(date).format(format);
}

export function timeAgo(date: string | number | Date | null | undefined): string {
  if (!date) return '-';
  return parseDate(date).fromNow();
}

export { dayjs };
export default dayjs;
