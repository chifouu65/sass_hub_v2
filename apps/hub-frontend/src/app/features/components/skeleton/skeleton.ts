import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styleUrl: './skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() borderRadius = '0.75rem';

  @HostBinding('style.width')
  get hostWidth(): string {
    return this.width;
  }

  @HostBinding('style.height')
  get hostHeight(): string {
    return this.height;
  }

  @HostBinding('style.borderRadius')
  get hostBorderRadius(): string {
    return this.borderRadius;
  }
}

