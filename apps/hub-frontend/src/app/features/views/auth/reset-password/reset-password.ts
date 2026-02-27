import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ResetPasswordDto } from '../../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  resetPasswordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    token: ['', [Validators.required]],
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.resetPasswordForm.controls.token.setValue(token);
    }
  }

  get token(): string | null {
    return this.resetPasswordForm.controls.token.value;
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    const { newPassword, confirmPassword, token } =
      this.resetPasswordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      this.resetPasswordForm.controls.confirmPassword.setErrors({
        passwordMismatch: true,
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: ResetPasswordDto = {
      newPassword: newPassword ?? '',
      token: token ?? '',
    };

    try {
      await firstValueFrom(this.authService.resetPassword(data));
      this.successMessage = 'Mot de passe mis à jour avec succès';
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message ||
        'Une erreur est survenue lors de la mise à jour du mot de passe';
    } finally {
      this.isLoading = false;
    }
  }
}
