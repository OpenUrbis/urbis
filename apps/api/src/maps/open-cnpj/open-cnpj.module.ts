import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AccessControlModule } from '../../common/guards/access-control/access-control.module';
import { OpenCnpjController } from './open-cnpj.controller';
import { OpenCnpjService } from './open-cnpj.service';

@Module({
  imports: [HttpModule, forwardRef(() => AccessControlModule)],
  controllers: [OpenCnpjController],
  providers: [OpenCnpjService],
  exports: [OpenCnpjService],
})
export class OpenCnpjModule {}
