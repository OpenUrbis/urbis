import { PartialType } from '@nestjs/swagger';
import { CreateQuestionAnswerDto } from './create-question-answer.dto';

export class UpdateQuestionAnswerDto extends PartialType(CreateQuestionAnswerDto) {}
