import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth';
import { SkeletonComponent } from './shared/ui/skeleton/skeleton';

@Component({
  imports: [CommonModule, RouterModule, SkeletonComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'hub-frontend';
  protected readonly auth = inject(AuthService);
  protected readonly appSkeletonLines = Array.from({ length: 6 });
}
