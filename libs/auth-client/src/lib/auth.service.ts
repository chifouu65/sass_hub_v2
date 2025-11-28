import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, from, Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  AuthLoginRequest, 
  AuthLoginResponse, 
  AuthRefreshRequest,
  AuthRefreshResponse,
  AuthenticatedUserView 
} from '@sass-hub-v2/shared-types';

// Interfaces locales pour le state si besoin, ou adaptation
interface AuthState {
  user: AuthenticatedUserView | null;
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
  readonly #API_URL = '/api/auth'; // Via Proxy

  readonly #state = signal<AuthState>(EMPTY_STATE);
  readonly #restoring = signal<boolean>(false);
  readonly #error = signal<string | null>(null);
  readonly #router = inject(Router);

  #refreshPromise: Promise<AuthRefreshResponse> | null = null;

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
        // Optionnel: rafraîchir au démarrage
        // await firstValueFrom(this.refreshTokens());
        this.#error.set(null);
      }
    } catch (error) {
      this.#error.set(this.#resolveError(error));
    } finally {
      this.#restoring.set(false);
    }
  }

  login(credentials: AuthLoginRequest): Observable<AuthLoginResponse> {
    return this.#http
      .post<AuthLoginResponse>(`${this.#API_URL}/login`, credentials)
      .pipe(tap((response) => this.#setAuthData(response)));
  }

  register(data: any): Observable<AuthLoginResponse> {
    // TODO: Ajouter AuthRegisterRequest dans shared-types si manquant
    return this.#http
      .post<AuthLoginResponse>(`${this.#API_URL}/register`, data)
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

  refreshTokens(): Observable<AuthRefreshResponse> {
    const refreshToken = this.#state().refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('Aucun refresh token disponible'));
    }

    if (!this.#refreshPromise) {
      this.#refreshPromise = firstValueFrom(
        this.#http
          .post<AuthRefreshResponse>(`${this.#API_URL}/refresh`, {
            refreshToken,
          } as AuthRefreshRequest)
          .pipe(
            tap((response) => {
                // Le refresh ne renvoie pas forcément le user complet, on garde l'ancien
                const currentUser = this.#state().user;
                // On cast la réponse de refresh en AuthLoginResponse partielle pour setAuthData
                // Ou on gère le cas spécifique
                this.#state.update(s => ({ 
                    ...s, 
                    accessToken: response.accessToken,
                    // Si le refresh renvoie un nouveau refresh token (rotation)
                    // refreshToken: response.refreshToken ?? s.refreshToken 
                }));
                localStorage.setItem('accessToken', response.accessToken);
            }),
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

  setTokensAndUser(user: AuthenticatedUserView, accessToken: string, refreshToken: string): void {
    const nextState: AuthState = {
      user,
      accessToken,
      refreshToken,
    } satisfies AuthState;

    this.#state.set(nextState);
    this.#error.set(null);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  #setAuthData(response: AuthLoginResponse): void {
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

      const parsedUser: AuthenticatedUserView = JSON.parse(storedUser);
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
    return 'Erreur inconnue.';
  }
}
