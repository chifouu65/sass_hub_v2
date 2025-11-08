import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ResetPasswordDto } from '../../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  resetPasswordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token = '';

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.token = this.route.snapshot.queryParams['token'] || '';
    
    if (!this.token) {
      this.errorMessage = 'Token de réinitialisation manquant';
    }

    // Ajouter une validation personnalisée pour vérifier que les mots de passe correspondent
    this.resetPasswordForm.get('confirmPassword')?.addValidators([
      Validators.required,
      () => {
        const password = this.resetPasswordForm.get('newPassword')?.value;
        const confirmPassword = this.resetPasswordForm.get('confirmPassword')?.value;
        
        if (password !== confirmPassword) {
          return { passwordMismatch: true };
        }
        
        return null;
      }
    ]);
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: ResetPasswordDto = {
      token: this.token,
      newPassword: this.resetPasswordForm.get('newPassword')?.value || '',
    };

    this.authService.resetPassword(data).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Votre mot de passe a été réinitialisé avec succès';
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue';
      },
    });
  }
}
