import { Route } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { FeedComponent } from './features/feed/feed.component';
import { CallbackComponent } from './features/auth/callback/callback.component';
import { authGuard } from '@sass-hub-v2/auth-client';

export const appRoutes: Route[] = [
    { 
        path: '', 
        component: FeedComponent,
        canActivate: [authGuard]
    },
    { path: 'login', component: LoginComponent },
    { path: 'callback', component: CallbackComponent },
];
