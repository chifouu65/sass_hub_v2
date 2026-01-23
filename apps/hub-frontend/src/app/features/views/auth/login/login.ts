import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@sass-hub-v2/auth-client';
import { AuthLoginRequest } from '@sass-hub-v2/shared-types';
import { firstValueFrom } from 'rxjs';

type OAuthProvider = 'google' | 'github' | 'microsoft';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isLoading = false;
  errorMessage = '';

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: AuthLoginRequest = this.loginForm.value as AuthLoginRequest;
    try {
      const response = await firstValueFrom(this.authService.login(credentials));
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      if (returnUrl) {
        const separator = returnUrl.includes('?') ? '&' : '?';
        window.location.href = `${returnUrl}${separator}token=${response.accessToken}&refreshToken=${response.refreshToken}`;
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message || 'Une erreur est survenue lors de la connexion';
    } finally {
      this.isLoading = false;
    }
  }

  loginWithOAuth(provider: OAuthProvider): void {
    const backendUrl = 'http://localhost:4200/api'; 
    window.location.href = `${backendUrl}/auth/${provider}`;
  }
}
