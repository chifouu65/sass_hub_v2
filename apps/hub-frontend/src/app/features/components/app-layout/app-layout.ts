import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  path: string;
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-layout.html',
})
export class AppLayoutComponent {
  private readonly authService = inject(AuthService);

  navLinks: NavLink[] = [
    { path: 'dashboard', label: 'Tableau de bord', exact: true },
    { path: 'organizations', label: 'Organisations' },
  ];

  currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}

