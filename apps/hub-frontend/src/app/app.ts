import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@sass-hub-v2/auth-client';
import { SkeletonComponent } from './features/components/skeleton/skeleton';
import { ToastContainerComponent } from './features/services/toast/toast-container.component';

@Component({
  imports: [CommonModule, RouterModule, SkeletonComponent, ToastContainerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'hub-frontend';
  protected readonly auth = inject(AuthService);
  protected readonly appSkeletonLines = Array.from({ length: 6 });
}
