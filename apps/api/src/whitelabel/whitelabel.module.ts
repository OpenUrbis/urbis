import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhitelabelModuleEntities } from './index.entity';
import { WhitelabelController } from './whitelabel.controller';
import { WhitelabelService } from './whitelabel.service';

@Module({
  imports: [TypeOrmModule.forFeature([...WhitelabelModuleEntities])],
  controllers: [WhitelabelController],
  providers: [WhitelabelService],
  exports: [WhitelabelService],
})
export class WhitelabelModule {}
