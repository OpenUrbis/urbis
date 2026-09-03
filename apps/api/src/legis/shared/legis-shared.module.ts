import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'user/entities/user.entity';
import { LegisUsersService } from './legis-users.service';

/**
 * Cross-cutting Legis providers. Kept separate from `UserModule` so Legis can
 * read user profiles without pulling in Redis/mail/role dependencies.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [LegisUsersService],
  exports: [LegisUsersService],
})
export class LegisSharedModule {}
