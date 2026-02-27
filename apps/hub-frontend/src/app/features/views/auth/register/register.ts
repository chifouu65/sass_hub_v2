import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterDto } from '@sass-hub-v2/auth-client';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: [''],
    lastName: [''],
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: RegisterDto = this.registerForm.value as RegisterDto;

    try {
      await firstValueFrom(this.authService.register(data));
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message ||
        'Une erreur est survenue lors de la création du compte';
    } finally {
      this.isLoading = false;
    }
  }
}
