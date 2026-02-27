import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { AvailableApplicationView, ApplicationStatus } from '@sass-hub-v2/shared-types';

@Component({
  selector: 'app-organization-marketplace-app-card',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div class="flex items-start justify-between mb-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <i class="mdi mdi-cube-outline text-2xl"></i>
        </div>
        <span [class]="statusBadgeClass(app().status) + ' px-2.5 py-0.5 rounded-full text-xs font-medium'">
          {{ app().status | titlecase }}
        </span>
      </div>

      <h3 class="text-lg font-semibold text-slate-900 mb-1">{{ app().name }}</h3>
      
      @if (app().category) {
        <span class="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
          {{ app().category }}
        </span>
      }

      <p class="text-sm text-slate-600 mb-6 flex-grow line-clamp-3">
        {{ app().description || 'Aucune description disponible pour cette application.' }}
      </p>

      <button
        type="button"
        class="w-full btn btn-primary flex items-center justify-center gap-2"
        [disabled]="processing()"
        (click)="install.emit(app())"
      >
        @if (processing()) {
          <i class="mdi mdi-loading mdi-spin"></i>
        } @else {
          <i class="mdi mdi-download"></i>
        }
        Installer
      </button>
    </div>
  `
})
export class OrganizationMarketplaceAppCardComponent {
  readonly app = input.required<AvailableApplicationView>();
  readonly processing = input(false);
  readonly install = output<AvailableApplicationView>();

  statusBadgeClass(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.ACTIVE:
        return 'bg-green-100 text-green-700';
      case ApplicationStatus.BETA:
        return 'bg-purple-100 text-purple-700';
      case ApplicationStatus.INACTIVE:
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }
}
