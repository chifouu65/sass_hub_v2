import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  TrackByFunction,
  computed,
  input,
} from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton';

export interface GenericTableHeader {
  key?: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  srOnly?: boolean;
  widthClass?: string;
}

interface TableRowContext<T> {
  $implicit: T;
  index: number;
}

@Component({
  selector: 'app-generic-table',
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './generic-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericTableComponent<T = unknown> {
  readonly headers = input<GenericTableHeader[]>([]);
  readonly rowTemplate = input.required<TemplateRef<TableRowContext<T>>>();
  readonly data = input<readonly T[] | null>([]);
  readonly loading = input(false);
  readonly skeletonRows = input(3);
  readonly skeletonTemplate = input<TemplateRef<unknown> | undefined>(
    undefined
  );
  readonly emptyTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  readonly loadingTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  readonly footerTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  readonly trackBy = input<TrackByFunction<T> | undefined>(undefined);
  readonly showToolbar = input(true);

  readonly skeletonArray = computed(() =>
    Array.from(
      { length: Math.max(this.skeletonRows(), 1) },
      (_, index) => index
    )
  );

  readonly colspan = computed(() => {
    const length = this.headers()?.length ?? 0;
    return Math.max(length, 1);
  });

  getHeaderClass(header: GenericTableHeader): string[] {
    const classes = ['px-4', 'py-3'];
    switch (header.align) {
      case 'center':
        classes.push('text-center');
        break;
      case 'right':
        classes.push('text-right');
        break;
      default:
        classes.push('text-left');
    }

    if (header.widthClass) {
      classes.push(header.widthClass);
    }

    return classes;
  }

  trackByWrapper(index: number, item: T): unknown {
    const trackBy = this.trackBy();
    return trackBy ? trackBy(index, item) : index;
  }
}

