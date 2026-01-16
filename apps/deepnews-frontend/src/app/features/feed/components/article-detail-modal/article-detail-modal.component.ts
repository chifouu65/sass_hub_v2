import { Component, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ModalRef, MODAL_DATA } from '@sass-hub-v2/ui-kit';
import { Article } from '../../../../services/news';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  transform(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

@Component({
  selector: 'app-article-detail-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, SafeHtmlPipe],
  template: `
    <div class="space-y-6">
        @if (article.imageUrl) {
            <div class="rounded-xl overflow-hidden -mt-2 mb-6 h-64 relative shadow-sm">
                <img [src]="article.imageUrl" class="w-full h-full object-cover" alt="Cover Image">
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
        }

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

        @if (article.keyPoints && article.keyPoints.length > 0) {
            <div class="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h3 class="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Points Clés
                </h3>
                <ul class="space-y-2">
                    @for (point of article.keyPoints; track point) {
                        <li class="flex items-start gap-2 text-blue-800 text-sm leading-relaxed">
                            <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                            {{ point }}
                        </li>
                    }
                </ul>
            </div>
        }

        <div class="prose prose-blue max-w-none text-gray-600 leading-relaxed">
            @if (article.summary) {
                <p class="font-medium text-gray-800 mb-4">{{ article.summary }}</p>
            }
            <div [innerHTML]="article.content | safeHtml"></div>
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

