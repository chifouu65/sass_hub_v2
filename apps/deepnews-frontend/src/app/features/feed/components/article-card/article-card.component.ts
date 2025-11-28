import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Article } from '../../../../services/news';

@Component({
  selector: 'app-article-card',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './article-card.component.html'
})
export class ArticleCardComponent {
  article = input.required<Article>();
  onTagClick = output<string>();

  getDomain(url: string): string {
    try { return new URL(url).hostname; } catch { return ''; }
  }

  getTagClass(tag: string): string {
      const colors: any = {
          'btc': 'bg-orange-50 text-orange-600 border-orange-100',
          'crypto': 'bg-orange-50 text-orange-600 border-orange-100',
          'eth': 'bg-purple-50 text-purple-600 border-purple-100',
          'defi': 'bg-indigo-50 text-indigo-600 border-indigo-100',
          'ai': 'bg-emerald-50 text-emerald-600 border-emerald-100',
          'tech': 'bg-blue-50 text-blue-600 border-blue-100',
          'finance': 'bg-green-50 text-green-600 border-green-100',
          'manuel': 'bg-gray-100 text-gray-600 border-gray-200',
      };
      return colors[tag.toLowerCase()] || 'bg-gray-50 text-gray-500 border-gray-100';
  }
}

