import { slugify, normalizeEmail } from './utils';

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
});
