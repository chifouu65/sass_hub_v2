import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('auth/refresh') && !req.url.includes('auth/login')) {
        return authService.refreshTokens().pipe(
          switchMap((response) => {
            const newReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` },
            });
            return next(newReq);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

