import { PartialType } from '@nestjs/swagger';
import { CreateLegisCategoryDto } from './create-legis-category.dto';

export class UpdateLegisCategoryDto extends PartialType(
  CreateLegisCategoryDto,
) {}
