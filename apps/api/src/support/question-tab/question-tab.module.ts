import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { OrganizationModule } from 'organization/organization.module';
import { SharedModule } from 'shared/shared.module';
import { QuestionTab } from 'support/entities/question-tab.entity';
import { QuestionTabController } from './question-tab.controller';
import { QuestionTabService } from './question-tab.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionTab]),
    SharedModule,
    forwardRef(() => AccessControlModule),
    forwardRef(() => OrganizationModule),
  ],
  controllers: [QuestionTabController],
  providers: [QuestionTabService],
})
export class QuestionTabModule {}
