import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api/auth';
  
  // Signals pour la gestion de l'état
  private _currentUser = signal<User | null>(null);
  private _accessToken = signal<string | null>(null);
  
  // Exposer les signaux
  currentUser = this._currentUser.asReadonly();
  accessToken = this._accessToken.asReadonly();
  isAuthenticated = computed(() => this._currentUser() !== null);
  
  // Exposer les setters pour la manipulation externe
  get currentUserSignal() {
    return this._currentUser;
  }

  constructor() {
    // Restaurer l'utilisateur depuis localStorage au démarrage
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      this._accessToken.set(storedToken);
      this._currentUser.set(JSON.parse(storedUser));
    }
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  logout(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private setAuthData(response: AuthResponse): void {
    this._currentUser.set(response.user);
    this._accessToken.set(response.accessToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  setTokensAndUser(user: User, accessToken: string, refreshToken: string): void {
    this._currentUser.set(user);
    this._accessToken.set(accessToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  forgotPassword(data: ForgotPasswordDto): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordDto): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/reset-password`, data);
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this._accessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
