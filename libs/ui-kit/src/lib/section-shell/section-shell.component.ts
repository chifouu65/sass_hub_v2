import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'lib-section-shell',
  imports: [CommonModule],
  template: `
    <div [ngClass]="containerClass">
      <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <ng-content select="[section-title]"></ng-content>
          </div>
          <ng-content select="[section-subtitle]"></ng-content>
        </div>
        <div class="flex items-center gap-2 md:justify-end">
          <ng-content select="[section-actions]"></ng-content>
        </div>
      </div>

      <ng-content select="[section-search]"></ng-content>

      <ng-content select="[section-body]"></ng-content>
    </div>
  `,
})
export class SectionShellComponent {
  @Input() containerClass = 'space-y-6';
}
