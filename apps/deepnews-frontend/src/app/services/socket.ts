import { Injectable, ApplicationRef, inject } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Article } from './news';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NewsSocket extends Socket {
  constructor() {
    const appRef = inject(ApplicationRef);
    super({ 
        url: 'http://localhost:3333', 
        options: {
            transports: ['websocket']
        } 
    }, appRef);
  }

  onNewArticle() {
    return this.fromEvent<Article>('news.new').pipe(
        map(article => {
            return { ...article, publishedAt: new Date(article.publishedAt) };
        })
    );
  }
}
