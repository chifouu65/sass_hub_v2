import {
  OrganizationStatus,
  OrganizationSummary,
} from './shared-types';

describe('shared-types', () => {
  it('should expose organization status enum', () => {
    expect(OrganizationStatus.ACTIVE).toBe('active');
  });

  it('should allow typing of organization summaries', () => {
    const organization: OrganizationSummary = {
      id: 'org-1',
      name: 'Acme Inc.',
      slug: 'acme-inc',
      databaseName: 'tenant_acme-inc',
      status: OrganizationStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(organization.slug).toBe('acme-inc');
  });
});
