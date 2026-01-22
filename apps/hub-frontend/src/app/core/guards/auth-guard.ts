import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@sass-hub-v2/auth-client';

/**
 * Guard pour protéger les routes nécessitant une authentification
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const urlTree = router.parseUrl(state.url);
  const token = urlTree.queryParams['token'];
  const refreshToken = urlTree.queryParams['refreshToken'];

  console.log('authGuard:isAuthenticated', authService.isAuthenticated());
  console.log('authGuard:restoring', authService.restoring());
  console.log('authGuard:url', state.url);
  console.log('authGuard:queryTokens', {
    token: Boolean(token),
    refreshToken: Boolean(refreshToken),
    tokenLength: token?.length ?? 0,
    refreshTokenLength: refreshToken?.length ?? 0,
  });
  console.log('authGuard:localStorage', {
    hasAccessToken: Boolean(localStorage.getItem('accessToken')),
    hasRefreshToken: Boolean(localStorage.getItem('refreshToken')),
    hasUser: Boolean(localStorage.getItem('user')),
  });

  if (authService.isAuthenticated()) {
    return true;
  }

  if (token && refreshToken) {
    return router.createUrlTree(['/auth/callback'], {
      queryParams: { token, refreshToken },
    });
  }

  // Rediriger vers la page de connexion avec le retour prévu
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
