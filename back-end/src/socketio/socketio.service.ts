import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketioService {
  chessboard(location:object,belongsTo:string){
    return {location,belongsTo}
  }
}
