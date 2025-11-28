import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NewsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(NewsGateway.name);

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  notifyNewArticle(article: any) {
    this.server.emit('news.new', article);
    this.logger.log(`Broadcasted new article: ${article.title}`);
  }
}

