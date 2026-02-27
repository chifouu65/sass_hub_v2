import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styleUrl: './skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'width',
    '[style.height]': 'height',
    '[style.borderRadius]': 'borderRadius',
  },
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() borderRadius = '0.75rem';
}

