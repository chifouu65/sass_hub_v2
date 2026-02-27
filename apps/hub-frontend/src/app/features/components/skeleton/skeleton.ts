import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'app-skeleton',
  imports: [CommonModule],
  template: '',
  styleUrl: './skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.borderRadius]': 'borderRadius()',
  },
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly borderRadius = input('0.75rem');
}
