export interface PageRequest
  extends Record<
    string,
    string | number | boolean | null | undefined | readonly (string | number | boolean | null | undefined)[]
  > {
  page?: number | string;
  perPage?: number | string;
  search?: string | null;
}

export interface PaginatedMeta {
  totalItems: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
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

export function normalizePageRequest(request: PageRequest = {}): Required<PageRequest> {
  const page = toPositiveInteger(request.page, DEFAULT_PAGE);
  const perPage = Math.min(toPositiveInteger(request.perPage, DEFAULT_PER_PAGE), MAX_PER_PAGE);

  return {
    page,
    perPage,
    search: request.search ?? null,
  };
}

