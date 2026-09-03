import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'shared/shared.module';
import { QuestionAnswer } from 'support/entities/question-answer.entity';
import { QuestionTab } from 'support/entities/question-tab.entity';
import { QuestionAnswerController } from './question-answer.controller';
import { QuestionAnswerService } from './question-answer.service';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { OrganizationModule } from 'organization/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionAnswer, QuestionTab]),
    SharedModule,
    forwardRef(() => AccessControlModule),
    forwardRef(() => OrganizationModule),
  ],
  controllers: [QuestionAnswerController],
  providers: [QuestionAnswerService],
})
export class QuestionAnswerModule {}
