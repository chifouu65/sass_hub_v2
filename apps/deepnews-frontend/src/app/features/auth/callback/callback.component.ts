import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@sass-hub-v2/auth-client';
import { AuthenticatedUserView } from '@sass-hub-v2/shared-types';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.component.html'
})
export class CallbackComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  authService = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const refreshToken = params['refreshToken'];

      if (token && refreshToken) {
        try {
             const base64Url = token.split('.')[1];
             const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
             const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
             }).join(''));

             const payload = JSON.parse(jsonPayload);
             
             const user: AuthenticatedUserView = {
                 id: payload.sub,
                 email: payload.email,
                 firstName: payload.firstName || payload.email.split('@')[0],
                 lastName: payload.lastName || '',
                 roles: payload.roles || [],
                 organizations: [],
                 permissions: [],
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
             };

             this.authService.setTokensAndUser(user, token, refreshToken);
             
             setTimeout(() => this.router.navigate(['/']), 500);
             
        } catch (e) {
            console.error('Token invalide', e);
            this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
