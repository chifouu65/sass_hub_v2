import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Article } from '../../../../services/news';

@Component({
  selector: 'app-article-card',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './article-card.component.html',
})
export class ArticleCardComponent {
  article = input.required<Article>();
  tagClick = output<string>();
  articleClick = output<Article>();

  getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  getProcessedTags(): string[] {
    const rawTags = this.article().tags || [];
    const processed = new Set<string>();

    rawTags.forEach((tag) => {
      if (tag.includes(':')) {
        const parts = tag.split(':');
        parts.forEach((p) => processed.add(p));
      } else {
        processed.add(tag);
      }
    });

    return Array.from(processed);
  }

  getTagClass(tag: string): string {
    const lowerTag = tag.toLowerCase();

    // Fixed category colors
    const categoryColors: Record<string, string> = {
      // Tech
      tech: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      ai: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      crypto:
        'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      cybersecurity:
        'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',

      // Finance
      finance:
        'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      markets: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',

      // Science & Health
      science:
        'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
      space:
        'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      health: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',

      // Politics & Society
      politics: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      policy: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',

      // General
      environment: 'bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100',
      culture: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
      entertainment:
        'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
      sports: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',

      // Meta
      manuel: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200',
    };

    return (
      categoryColors[lowerTag] ||
      'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
    );
  }

  handleTitleClick(event: Event) {
    event.preventDefault();
    this.articleClick.emit(this.article());
  }
}
