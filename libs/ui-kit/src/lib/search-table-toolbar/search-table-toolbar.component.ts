import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lib-search-table-toolbar',
  imports: [CommonModule],
  template: `
    <form
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      role="search"
      (submit)="$event.preventDefault()"
    >
      <div [ngClass]="wrapperClass">
        <label class="sr-only" [for]="searchId">{{ label }}</label>
        @if (showIcon) {
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"
        >
          <i class="mdi mdi-magnify text-lg"></i>
        </div>
        }
        <input
          [id]="searchId"
          type="search"
          class="form-input w-full pr-3"
          [ngClass]="[showIcon ? 'pl-10' : 'pl-3', inputClass]"
          [placeholder]="placeholder"
          [name]="name || searchId"
          autocomplete="off"
          [value]="value"
          (input)="valueChange.emit($any($event.target).value)"
        />
        <ng-content select="[search-suffix]"></ng-content>
      </div>
      <div [ngClass]="rightClass">
        <ng-content select="[search-right]"></ng-content>
      </div>
    </form>
  `,
})
export class SearchTableToolbarComponent {
  @Input({ required: true }) searchId = '';
  @Input({ required: true }) label = '';
  @Input({ required: true }) placeholder = '';
  @Input() name = '';
  @Input() value = '';
  @Input() showIcon = true;
  @Input() wrapperClass = 'relative w-full md:max-w-md';
  @Input() rightClass = 'text-sm text-slate-500 md:text-right';
  @Input() inputClass = '';

  @Output() readonly valueChange = new EventEmitter<string>();
}
