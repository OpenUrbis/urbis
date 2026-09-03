import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'user/entities/user.entity';
import { Forgot } from './entities/forgot.entity';
import { ForgotService } from './forgot.service';

@Module({
  imports: [TypeOrmModule.forFeature([Forgot, User])],
  providers: [ForgotService],
  exports: [ForgotService],
})
export class ForgotModule {}
