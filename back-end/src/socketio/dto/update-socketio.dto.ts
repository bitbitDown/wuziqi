import { PartialType } from '@nestjs/mapped-types';
import { CreateSocketioDto } from './create-socketio.dto';

export class UpdateSocketioDto extends PartialType(CreateSocketioDto) {
  id: number;
}
