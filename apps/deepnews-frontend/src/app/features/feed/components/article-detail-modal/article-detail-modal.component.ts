import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ModalRef, MODAL_DATA } from '@sass-hub-v2/ui-kit';
import { Article } from '../../../../services/news';

@Component({
  selector: 'app-article-detail-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">{{ article.source }}</span>
                <span class="text-sm text-gray-500">{{ article.publishedAt | date:'medium' }}</span>
            </div>
            <!-- Close button handled by host but we can add another one or just rely on host -->
        </div>

        <h2 class="text-2xl font-bold text-gray-900 leading-tight">
            {{ article.title }}
        </h2>

        <div class="prose prose-blue max-w-none text-gray-600 leading-relaxed">
            <p>{{ article.content || article.summary }}</p>
        </div>

        <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
            @for (tag of article.tags; track tag) {
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    #{{ tag }}
                </span>
            }
        </div>

        <div class="flex justify-end gap-3 pt-4">
            <button (click)="close()" class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                Fermer
            </button>
            <a [href]="article.link" target="_blank" class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 shadow-sm shadow-blue-200">
                Lire l'article original
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
        </div>
    </div>
  `
})
export class ArticleDetailModalComponent {
  article = inject<Article>(MODAL_DATA);
  private modalRef = inject(ModalRef);

  close() {
    this.modalRef.close();
  }
}

