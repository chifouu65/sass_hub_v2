import { normalizeEmail, normalizePageRequest, slugify } from './utils';

describe('utils', () => {
  it('should slugify strings', () => {
    expect(slugify('Gestion des Rôles')).toEqual('gestion-des-roles');
    expect(slugify('  Hello World  ')).toEqual('hello-world');
    expect(slugify('Déjà vu!')).toEqual('deja-vu');
    expect(slugify(null)).toEqual('');
  });

  it('should normalize emails', () => {
    expect(normalizeEmail('  USER@Example.COM  ')).toEqual('user@example.com');
    expect(normalizeEmail(undefined)).toEqual('');
  });

  it('should normalize pagination parameters with defaults', () => {
    expect(normalizePageRequest()).toEqual({
      page: 1,
      perPage: 25,
      search: null,
    });
  });

  it('should coerce invalid pagination values', () => {
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

  it('should keep valid pagination values', () => {
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
