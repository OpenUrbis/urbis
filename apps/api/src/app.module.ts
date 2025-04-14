import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [SharedModule, DatabaseModule.forRoot([])],
  controllers: [],
  providers: [],
})
export class AppModule {}
