import { Test, TestingModule } from '@nestjs/testing';
import { SocketioService } from './socketio.service';

describe('SocketioService', () => {
  let service: SocketioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocketioService],
    }).compile();

    service = module.get<SocketioService>(SocketioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
