import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { MapConfigSeedService } from './map-config-seed.service';

const runMapConfigSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  console.info('Updating MapConfig and templates...');
  await app.get(MapConfigSeedService).run();
  console.info('MapConfig and templates updated successfully.');
  await app.close();
};

void runMapConfigSeed();
