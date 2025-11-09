import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from './types';

export const AUTH_SERVICE_BASE_URL = 'AUTH_SERVICE_BASE_URL';
export const AUTH_SERVICE_INTERNAL_API_KEY = 'AUTH_SERVICE_INTERNAL_API_KEY';

@Injectable()
export class AuthServiceClient {
  private readonly logger = new Logger(AuthServiceClient.name);

  constructor(
    private readonly http: HttpService,
    @Inject(AUTH_SERVICE_BASE_URL) private readonly baseUrl: string,
    @Inject(AUTH_SERVICE_INTERNAL_API_KEY)
    private readonly internalApiKey: string | null,
  ) {}

  register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>('POST', '/auth/register', dto);
  }

  login(dto: LoginDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>('POST', '/auth/login', dto);
  }

  refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>('POST', '/auth/refresh', dto);
  }

  forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      'POST',
      '/auth/forgot-password',
      dto,
    );
  }

  resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      'POST',
      '/auth/reset-password',
      dto,
    );
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.request<User>(
        'GET',
        `/auth/internal/users/${userId}`,
        undefined,
        this.buildInternalHeaders(),
      );
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 404) {
        return null;
      }
      throw error;
    }
  }

  buildOAuthAuthorizeUrl(provider: string): string {
    return `${this.baseUrl}/auth/${provider}`;
  }

  buildOAuthCallbackUrl(provider: string, queryString?: string): string {
    const suffix = queryString ? `?${queryString}` : '';
    return `${this.baseUrl}/auth/${provider}/callback${suffix}`;
  }

  private buildInternalHeaders(): AxiosRequestConfig {
    if (this.internalApiKey && this.internalApiKey.length > 0) {
      return {
        headers: {
          'x-internal-api-key': this.internalApiKey,
        },
      };
    }

    return {};
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await lastValueFrom<AxiosResponse<T>>(
        this.http.request<T>({
          method,
          url: `${this.baseUrl}${path}`,
          data,
          ...(config ?? {}),
        }),
      );

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (this.isAxiosError(error)) {
        const status =
          error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
        const message = this.extractErrorMessage(error);

        if (status >= 500) {
          this.logger.error(
            `Auth service error ${status} on ${method} ${path}: ${message}`,
          );
        }

        throw new HttpException(message, status);
      }

      throw new HttpException(
        'Erreur interne lors de la communication avec le auth service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private isAxiosError(
    error: unknown,
  ): error is AxiosError<{ message?: unknown } | string | undefined> {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      Boolean((error as { isAxiosError?: boolean }).isAxiosError)
    );
  }

  private extractErrorMessage(
    error: AxiosError<{ message?: unknown } | string | undefined>,
  ): string {
    const responseData = error.response?.data;

    if (typeof responseData === 'string') {
      return responseData.trim().length > 0
        ? responseData
        : error.message || 'Erreur inconnue du auth service';
    }

    if (responseData && typeof responseData === 'object') {
      const rawMessage = (responseData as { message?: unknown }).message;

      if (Array.isArray(rawMessage)) {
        return rawMessage.join('; ');
      }

      if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
        return rawMessage;
      }
    }

    if (!responseData) {
      return error.message || 'Erreur inconnue du auth service';
    }

    return error.message || 'Erreur inconnue du auth service';
  }
}


