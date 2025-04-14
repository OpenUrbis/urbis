import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { LayerSeedService } from './layer-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  // Run seed
  await app.get(LayerSeedService).run();

  await app.close();
};

void runSeed();
