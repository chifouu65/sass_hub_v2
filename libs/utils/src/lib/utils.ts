import { NormalizedPageRequest, PageRequest } from '@sass-hub-v2/shared-types';

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

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 25;
const MAX_PER_PAGE = 100;

function toPositiveInteger(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  if (Number.isFinite(numberValue) && numberValue > 0) {
    return Math.floor(numberValue);
  }
  return fallback;
}

export function normalizePageRequest(request: PageRequest = {}): NormalizedPageRequest {
  const page = toPositiveInteger(request.page, DEFAULT_PAGE);
  const perPage = Math.min(toPositiveInteger(request.perPage, DEFAULT_PER_PAGE), MAX_PER_PAGE);

  return {
    page,
    perPage,
    search: request.search ?? null,
  };
}
