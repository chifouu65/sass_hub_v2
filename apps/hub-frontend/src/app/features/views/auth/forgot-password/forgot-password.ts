import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ForgotPasswordDto } from '../../../../core/services/auth.service';

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

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: ForgotPasswordDto =
      this.forgotPasswordForm.value as ForgotPasswordDto;

    this.authService.forgotPassword(data).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage =
          "Si cet email existe, un lien de réinitialisation a été envoyé";
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Une erreur est survenue';
      },
    });
  }
}
