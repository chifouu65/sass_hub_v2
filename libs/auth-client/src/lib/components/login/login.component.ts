import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'lib-auth-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">{{ title }}</h2>
          <p *ngIf="subtitle" class="mt-2 text-center text-sm text-gray-600">{{ subtitle }}</p>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="login()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email-address" class="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autocomplete="email" required [(ngModel)]="email"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Email address">
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input id="password" name="password" type="password" autocomplete="current-password" required [(ngModel)]="password"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Password">
            </div>
          </div>

          <div *ngIf="error" class="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
            {{ error }}
          </div>

          <div>
            <button type="submit" [disabled]="isLoading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              <span *ngIf="isLoading" class="mr-2">...</span>
              Sign in
            </button>
          </div>
        </form>
        <div class="text-center">
            <slot name="footer"></slot>
        </div>
      </div>
    </div>
  `
})
export class LibLoginComponent {
  @Input() title = 'Sign in';
  @Input() subtitle = '';
  @Input() redirectTo = '/';

  email = '';
  password = '';
  error = '';
  isLoading = false;
  
  authService = inject(AuthService);
  router = inject(Router);

  login() {
    this.error = '';
    this.isLoading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate([this.redirectTo]);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Identifiants incorrects ou problème serveur.';
        console.error(err);
      }
    });
  }
}

