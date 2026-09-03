import { PartialType } from '@nestjs/swagger';
import { CreateQuestionTabDto } from './create-question-tab.dto';

export class UpdateQuestionTabDto extends PartialType(CreateQuestionTabDto) {}
