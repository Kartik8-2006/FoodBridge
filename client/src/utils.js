export const dashboardPath = (role) => `/dashboard/${role || 'donor'}`;

export function formatDate(value) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function titleCase(value = '') {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
