export interface HttpClientConfig {
  baseUrl: string;
  defaultHeaders?: HeadersInit;
  fetch?: typeof fetch;
}

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface HttpClient {
  request<TResponse>(options: HttpRequestOptions): Promise<TResponse>;
}

export class HttpError<TBody = unknown> extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: TBody,
  ) {
    super(`Request failed with status ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

export class FetchHttpClient implements HttpClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeadersInit | undefined;

  constructor(private readonly config: HttpClientConfig) {
    this.fetchFn = config.fetch ?? globalThis.fetch;
    if (!this.fetchFn) {
      throw new Error(
        'FetchHttpClient requires a fetch implementation. Provide one via config.fetch or ensure globalThis.fetch is available.',
      );
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = config.defaultHeaders;
  }

  async request<TResponse>(options: HttpRequestOptions): Promise<TResponse> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.mergeHeaders(options.headers);
    const init: RequestInit = {
      method: options.method,
      headers,
      signal: options.signal,
    };

    if (options.body !== undefined && options.method !== 'GET' && options.method !== 'HEAD') {
      const existingContentType = this.getHeader(headers, 'content-type');
      if (!existingContentType) {
        this.setHeader(headers, 'Content-Type', 'application/json');
      }
      init.body = this.serializeBody(options.body, this.getHeader(headers, 'content-type'));
    }

    const response = await this.fetchFn(url, init);
    const payload = await this.parseResponse(response);

    if (!response.ok) {
      throw new HttpError(response.status, response.statusText, payload);
    }

    return payload as TResponse;
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const base = `${this.baseUrl}${normalizedPath}`;

    if (!query || Object.keys(query).length === 0) {
      return base;
    }

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, String(item)));
        return;
      }

      params.append(key, String(value));
    });

    const queryString = params.toString();
    return queryString ? `${base}?${queryString}` : base;
  }

  private mergeHeaders(headers?: HeadersInit): Headers {
    const result = new Headers();

    if (this.defaultHeaders) {
      new Headers(this.defaultHeaders).forEach((value, key) => {
        result.set(key, value);
      });
    }

    if (headers) {
      new Headers(headers).forEach((value, key) => {
        result.set(key, value);
      });
    }

    return result;
  }

  private serializeBody(body: unknown, contentType?: string | null): BodyInit {
    if (!contentType || contentType.includes('application/json')) {
      return JSON.stringify(body ?? {});
    }

    if (contentType.includes('application/x-www-form-urlencoded') && typeof body === 'object' && body) {
      const params = new URLSearchParams();
      Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, String(item)));
          return;
        }
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      return params;
    }

    return body as BodyInit;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const status = response.status;
    if (status === 204 || status === 205) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }

    return await response.text();
  }

  private getHeader(headers: Headers, name: string): string | null {
    return headers.get(name) ?? headers.get(name.toLowerCase());
  }

  private setHeader(headers: Headers, name: string, value: string): void {
    headers.set(name, value);
  }
}

