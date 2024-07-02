import { Module } from '@nestjs/common';
import { SocketioService } from './socketio.service';
import { SocketioGateway } from './socketio.gateway';

@Module({
  providers: [SocketioGateway, SocketioService],
})
export class SocketioModule {}
