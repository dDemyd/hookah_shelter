export function normalizeUkrainianPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s\-()]/g, "");
  if (!compact) return null;

  if (/^\+380\d{9}$/.test(compact)) return compact;
  if (/^380\d{9}$/.test(compact)) return `+${compact}`;
  if (/^0\d{9}$/.test(compact)) return `+38${compact}`;

  return null;
}

export function isUkrainianPhone(value: string): boolean {
  return normalizeUkrainianPhone(value) !== null;
}
