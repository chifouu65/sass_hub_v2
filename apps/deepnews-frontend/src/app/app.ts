import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@sass-hub-v2/auth-client';
import { FeedComponent } from './features/feed/feed.component';
import { ModalService, ConfirmModalComponent } from '@sass-hub-v2/ui-kit';
import { firstValueFrom } from 'rxjs';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  authService = inject(AuthService);
  private modalService = inject(ModalService);
  title = 'DeepNews AI';
  feed?: FeedComponent;

  onActivate(component: any) {
    if (component instanceof FeedComponent) {
        this.feed = component;
    } else {
        this.feed = undefined;
    }
  }

  async logout() {
    const ref = this.modalService.open(ConfirmModalComponent, {
      data: {
        title: 'Déconnexion',
        description: 'Êtes-vous sûr de vouloir vous déconnecter ?',
        confirmLabel: 'Se déconnecter',
        cancelLabel: 'Annuler'
      },
      host: {
        title: 'Confirmation'
      }
    });

    const confirmed = await firstValueFrom(ref.afterClosed());
    if (confirmed) {
      this.authService.logout();
    }
  }
}
