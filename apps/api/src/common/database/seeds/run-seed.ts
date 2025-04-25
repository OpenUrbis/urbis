import { NestFactory } from '@nestjs/core';
import { LayerSeedService } from './layer-seed.service';
import { SearchConfigSeedService } from './search-config-seed.service';
import { SeedModule } from './seed.module';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  // Run seed
  await app.get(LayerSeedService).run();
  await app.get(SearchConfigSeedService).run();

  await app.close();
};

void runSeed();
