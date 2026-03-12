import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'shared/shared.module';
import { QuestionAnswer } from 'support/entities/question-answer.entity';
import { QuestionTab } from 'support/entities/question-tab.entity';
import { QuestionAnswerController } from './question-answer.controller';
import { QuestionAnswerService } from './question-answer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionAnswer, QuestionTab]),
    SharedModule,
  ],
  controllers: [QuestionAnswerController],
  providers: [QuestionAnswerService],
})
export class QuestionAnswerModule {}
