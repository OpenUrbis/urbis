import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'shared/shared.module';
import { QuestionTab } from 'support/entities/question-tab.entity';
import { QuestionTabController } from './question-tab.controller';
import { QuestionTabService } from './question-tab.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionTab]), SharedModule],
  controllers: [QuestionTabController],
  providers: [QuestionTabService],
})
export class QuestionTabModule {}
