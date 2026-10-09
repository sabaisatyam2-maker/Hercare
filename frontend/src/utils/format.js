// Local calendar date as YYYY-MM-DD (NOT UTC) - the backend stores the date the user sees.
export const toLocalISODate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (isoDate, n) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return toLocalISODate(new Date(y, m - 1, d + n));
};

export const prettyDate = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
};

export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK' || (err?.request && !err?.response)) {
    return 'Cannot reach the server. Please check that the backend is running.';
  }
  return fallback;
};

export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
export const humanize = (s = '') => cap(String(s).replace(/-/g, ' ')).replace(/\bpcos\b/i, 'PCOS');
