import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  provideAppInitializer,
  inject
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { authInterceptor, AuthService } from '@sass-hub-v2/auth-client';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const socketConfig: SocketIoConfig = { url: 'http://localhost:3333', options: { transports: ['websocket'] } };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(SocketIoModule.forRoot(socketConfig)),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.initialize();
    }),
  ],
};
