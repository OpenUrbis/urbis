import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'common/mail/mail.module';
import { SharedModule } from 'shared/shared.module';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket]),
    SharedModule,
    MailModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
