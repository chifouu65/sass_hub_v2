import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, from, Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const EMPTY_STATE: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #API_URL = '/api/auth';

  readonly #state = signal<AuthState>(EMPTY_STATE);
  readonly #restoring = signal<boolean>(false);
  readonly #error = signal<string | null>(null);
  readonly #router = inject(Router);

  #refreshPromise: Promise<AuthResponse> | null = null;

  currentUser = computed(() => this.#state().user);
  accessToken = computed(() => this.#state().accessToken);
  isAuthenticated = computed(() => this.#state().user !== null);
  restoring = computed(() => this.#restoring());
  error = computed(() => this.#error());

  async initialize(): Promise<void> {
    this.#restoring.set(true);
    this.#error.set(null);

    try {
      const restored = await this.#restoreAuthState();
      this.#state.set(restored);

      if (restored.refreshToken) {
        await firstValueFrom(this.refreshTokens());
        this.#error.set(null);
      }
    } catch (error) {
      this.#error.set(this.#resolveError(error));
    } finally {
      this.#restoring.set(false);
    }
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.#http
      .post<AuthResponse>(`${this.#API_URL}/login`, credentials)
      .pipe(tap((response) => this.#setAuthData(response)));
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.#http
      .post<AuthResponse>(`${this.#API_URL}/register`, data)
      .pipe(tap((response) => this.#setAuthData(response)));
  }

  logout(): void {
    this.#state.set(EMPTY_STATE);
    this.#error.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.#router.navigate(['/login']);
  }

  setTokensAndUser(user: User, accessToken: string, refreshToken: string): void {
    this.#setAuthData({ user, accessToken, refreshToken });
  }

  forgotPassword(data: ForgotPasswordDto): Observable<MessageResponse> {
    return this.#http.post<MessageResponse>(
      `${this.#API_URL}/forgot-password`,
      data,
    );
  }

  resetPassword(data: ResetPasswordDto): Observable<MessageResponse> {
    return this.#http.post<MessageResponse>(
      `${this.#API_URL}/reset-password`,
      data,
    );
  }

  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = this.#state().refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('Aucun refresh token disponible'));
    }

    if (!this.#refreshPromise) {
      this.#refreshPromise = firstValueFrom(
        this.#http
          .post<AuthResponse>(`${this.#API_URL}/refresh`, {
            refreshToken,
          })
          .pipe(
            tap((response) => this.#setAuthData(response)),
            catchError((error) => {
              this.logout();
              return throwError(() => error);
            }),
          ),
      ).finally(() => {
        this.#refreshPromise = null;
      });
    }

    return from(this.#refreshPromise);
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.#state().accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

   #setAuthData(response: AuthResponse): void {
    const nextState: AuthState = {
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    } satisfies AuthState;

    this.#state.set(nextState);
    this.#error.set(null);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  async #restoreAuthState(): Promise<AuthState> {
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedRefresh = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        return EMPTY_STATE;
      }

      const parsedUser: User = JSON.parse(storedUser);
      return {
        user: parsedUser,
        accessToken: storedToken,
        refreshToken: storedRefresh ?? null,
      } satisfies AuthState;
    } catch {
      return EMPTY_STATE;
    }
  }

  #resolveError(error: unknown): string | null {
    if (!error) {
      return null;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return 'Impossible de restaurer l’état d’authentification.';
  }
}
