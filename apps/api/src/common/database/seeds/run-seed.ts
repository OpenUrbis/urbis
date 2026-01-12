import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { runSystemSeed } from './system';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  // Run seed
  await runSystemSeed(app);

  await app.close();
};

void runSeed();
