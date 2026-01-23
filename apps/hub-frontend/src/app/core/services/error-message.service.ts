import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorMessageService {
  getMessage(error: unknown, fallback = 'Impossible de traiter la requête.'): string {
    if (!error) {
      return 'Une erreur inattendue est survenue.';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (typeof error === 'object' && error !== null) {
      if (
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        return (error as { message: string }).message;
      }

      if ('error' in error) {
        const payload = (error as { error: unknown }).error;
        if (typeof payload === 'string' && payload.trim().length > 0) {
          return payload;
        }
        if (payload && typeof payload === 'object') {
          const message = (payload as { message?: unknown }).message;
          if (Array.isArray(message)) {
            return message.join(', ');
          }
          if (typeof message === 'string') {
            return message;
          }
        }
      }
    }

    return fallback;
  }
}
