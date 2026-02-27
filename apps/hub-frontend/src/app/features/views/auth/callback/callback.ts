import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@sass-hub-v2/auth-client';
import { AuthenticatedUserView } from '@sass-hub-v2/shared-types';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './callback.html',
  styleUrl: './callback.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Callback implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    const refreshToken = this.route.snapshot.queryParams['refreshToken'];

    if (!token || !refreshToken) {
      this.errorMessage = 'Authentification échouée : tokens manquants';
      this.isLoading = false;
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const user: AuthenticatedUserView = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        roles: payload.roles || [],
        organizations: [],
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.authService.setTokensAndUser(user, token, refreshToken);

      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = "Erreur lors du traitement de l'authentification";
      this.isLoading = false;
      setTimeout(() => this.router.navigate(['/login']), 3000);
    }
  }
}
