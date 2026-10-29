// Posts use zoned timestamps. Date-only and legacy unzoned values keep Korean wall time.
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function parseDate(value) {
  if (value == null || value === '') return null;
  let normalized = value;
  if (typeof value === 'string') {
    normalized = value.trim();
    if (!normalized) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) normalized += 'T00:00:00+09:00';
    else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(normalized) &&
      !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)) normalized += '+09:00';
  }
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parts(value) {
  const date = parseDate(value);
  return date ? Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value])) : null;
}

export function formatDate(value) {
  const p = parts(value);
  return p ? `${p.year}-${p.month}-${p.day}` : '-';
}

export function isSeoulToday(value, now = new Date()) {
  const day = formatDate(value);
  return day !== '-' && day === formatDate(now);
}

export function formatListDate(value, now = new Date()) {
  const p = parts(value);
  if (!p) return '-';
  return isSeoulToday(value, now) ? `${p.hour}:${p.minute}` : `${p.year}-${p.month}-${p.day}`;
}

export function formatDateTime(value) {
  const p = parts(value);
  return p ? `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` : '-';
}
