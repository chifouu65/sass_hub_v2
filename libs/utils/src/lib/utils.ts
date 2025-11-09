export function slugify(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}
