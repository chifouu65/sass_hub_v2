import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './callback.html',
  styleUrl: './callback.css',
})
export class Callback implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    // Récupérer les tokens depuis les query params
    const token = this.route.snapshot.queryParams['token'];
    const refreshToken = this.route.snapshot.queryParams['refreshToken'];

    if (!token || !refreshToken) {
      this.errorMessage = 'Authentification échouée : tokens manquants';
      this.isLoading = false;
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    // Stocker les tokens et les données utilisateur
    try {
      // Décoder le token pour récupérer l'utilisateur
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const userData = {
        id: payload.sub,
        email: payload.email,
        firstName: undefined,
        lastName: undefined,
      };

      // Mettre à jour le service d'authentification
      this.authService.setTokensAndUser(userData, token, refreshToken);

      // Rediriger vers le dashboard
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = 'Erreur lors du traitement de l\'authentification';
      this.isLoading = false;
      setTimeout(() => this.router.navigate(['/login']), 3000);
    }
  }
}
