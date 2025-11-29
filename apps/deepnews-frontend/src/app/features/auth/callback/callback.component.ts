import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@sass-hub-v2/auth-client';
import { AuthenticatedUserView } from '@sass-hub-v2/shared-types';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.component.html'
})
export class CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    const sub = this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const refreshToken = params['refreshToken'];

      if (token && refreshToken) {
        // 1. CLEAN URL IMMEDIATELY to hide tokens from browser history/shoulder surfing
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
             // 2. SAFE DECODE
             const payload: any = jwtDecode(token);
             
             // 3. VALIDATE EXPIRATION (Basic check)
             const now = Math.floor(Date.now() / 1000);
             if (payload.exp && payload.exp < now) {
                 throw new Error('Token expired');
             }

             // 4. MAP USER
             const user: AuthenticatedUserView = {
                 id: payload.sub,
                 email: payload.email,
                 firstName: payload.firstName || payload.email?.split('@')[0] || 'User',
                 lastName: payload.lastName || '',
                 roles: payload.roles || [],
                 organizations: [],
                 permissions: [],
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
             };

             // 5. STORE
             this.authService.setTokensAndUser(user, token, refreshToken);
             
             // 6. REDIRECT
             this.router.navigate(['/']);
             
        } catch (e) {
            console.error('Login processing failed:', e);
            this.router.navigate(['/login']);
        }
      } else {
        // No tokens found, redirect to login
        this.router.navigate(['/login']);
      }
      
      // Unsubscribe to prevent leaks (though mostly handled by router destruction)
      sub.unsubscribe();
    });
  }
}
