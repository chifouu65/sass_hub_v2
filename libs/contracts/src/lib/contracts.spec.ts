import { normalizePageRequest } from './pagination';

describe('normalizePageRequest', () => {
  it('should fallback to defaults when empty', () => {
    expect(normalizePageRequest()).toEqual({
      page: 1,
      perPage: 25,
      search: null,
    });
  });

  it('should coerce invalid values', () => {
    expect(
      normalizePageRequest({
        page: -5,
        perPage: 500,
        search: 'demo',
      }),
    ).toEqual({
      page: 1,
      perPage: 100,
      search: 'demo',
    });
  });

  it('should keep valid numeric parameters', () => {
    expect(
      normalizePageRequest({
        page: '2',
        perPage: 10,
      }),
    ).toEqual({
      page: 2,
      perPage: 10,
      search: null,
    });
  });
});
