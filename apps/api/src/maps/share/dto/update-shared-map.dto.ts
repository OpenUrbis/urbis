import { PartialType } from '@nestjs/swagger';
import { CreateSharedMapDto } from './create-shared-map.dto';

export class UpdateSharedMapDto extends PartialType(CreateSharedMapDto) {}
