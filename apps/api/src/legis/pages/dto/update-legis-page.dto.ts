import { PartialType } from '@nestjs/swagger';
import { CreateLegisPageDto } from './create-legis-page.dto';

export class UpdateLegisPageDto extends PartialType(CreateLegisPageDto) {}