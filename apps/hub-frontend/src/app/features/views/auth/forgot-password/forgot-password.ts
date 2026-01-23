import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ForgotPasswordDto } from '../../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: ForgotPasswordDto =
      this.forgotPasswordForm.value as ForgotPasswordDto;

    try {
      await firstValueFrom(this.authService.forgotPassword(data));
      this.successMessage =
        'Si cet email existe, un lien de réinitialisation a été envoyé';
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Une erreur est survenue';
    } finally {
      this.isLoading = false;
    }
  }
}
