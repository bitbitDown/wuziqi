import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { SocketioService } from './socketio.service';
import { CreateSocketioDto } from './dto/create-socketio.dto';
import { UpdateSocketioDto } from './dto/update-socketio.dto';

@WebSocketGateway({ cors: true })
export class SocketioGateway {
  @WebSocketServer() server;
  constructor(private readonly socketioService: SocketioService) {}
  // 接受来自客户端的棋盘状态并广播
  @SubscribeMessage('chessboard')
  chessboard(@MessageBody() { location, belongsTo }: { location: object, belongsTo: string }) {
    const updatedChessboard = this.socketioService.chessboard(location, belongsTo);
    console.log('Current connected clients:', this.server.sockets.sockets.size);
    this.server.sockets.sockets.forEach((socket) => {
      console.log('Client ID:', socket.emit);
      socket.emit('currentChessboard', updatedChessboard)
    });
    return {
      event: 'currentChessboard',
      data: { ...updatedChessboard }
    };
  }


}