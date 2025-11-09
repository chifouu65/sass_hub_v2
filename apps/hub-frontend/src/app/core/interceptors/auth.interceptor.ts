import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const accessToken = auth.accessToken();

  let authReq = req;

  if (accessToken && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  if (req.url.includes('/refresh')) {
    return next(authReq);
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return auth.refreshTokens().pipe(
          switchMap(() => {
            const refreshedToken = auth.accessToken();
            const retryRequest = refreshedToken
              ? authReq.clone({
                  setHeaders: {
                    Authorization: `Bearer ${refreshedToken}`,
                  },
                })
              : authReq;
            return next(retryRequest);
          }),
          catchError((refreshError) => {
            auth.logout();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
