import { createSaasHubSdk, HttpError } from './sdk';

const buildMockResponse = ({
  ok,
  status,
  statusText = 'OK',
  jsonBody,
  textBody,
}: {
  ok: boolean;
  status: number;
  statusText?: string;
  jsonBody?: unknown;
  textBody?: string;
}): Response => {
  const headers = new Headers({ 'content-type': 'application/json' });
  return {
    ok,
    status,
    statusText,
    headers,
    json: jest.fn().mockResolvedValue(jsonBody),
    text: jest.fn().mockResolvedValue(textBody ?? ''),
  } as unknown as Response;
};

describe('SaasHubSdk', () => {
  const mockFetch = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('invokes the auth login endpoint with the provided payload', async () => {
    const sdk = createSaasHubSdk({
      baseUrl: 'http://localhost:3000',
      fetch: mockFetch,
    });

    const responseBody = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: '2025-11-09T00:00:00.000Z',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        organizations: [],
        roles: [],
        permissions: [],
        createdAt: '2025-11-09T00:00:00.000Z',
        updatedAt: '2025-11-09T00:00:00.000Z',
      },
    };

    mockFetch.mockResolvedValue(buildMockResponse({ ok: true, status: 200, jsonBody: responseBody }));

    const result = await sdk.auth.login({
      email: 'user@example.com',
      password: 'secret',
    });

    expect(result).toEqual(responseBody);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
      }),
    );
  });

  it('throws an HttpError when the API responds with a failure status', async () => {
    const sdk = createSaasHubSdk({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch,
    });

    mockFetch.mockResolvedValue(
      buildMockResponse({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        jsonBody: { message: 'Forbidden action' },
      }),
    );

    await expect(
      sdk.auth.login({
        email: 'user@example.com',
        password: 'secret',
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('appends query parameters when listing organizations', async () => {
    const sdk = createSaasHubSdk({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch,
    });

    mockFetch.mockResolvedValue(
      buildMockResponse({
        ok: true,
        status: 200,
        jsonBody: {
          data: [],
          meta: { totalItems: 0, totalPages: 0, page: 2, perPage: 10 },
        },
      }),
    );

    await sdk.tenants.listOrganizations({ page: 2, perPage: 10 });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/organizations?page=2&perPage=10',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });
});
