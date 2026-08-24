import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { runSystemSeed } from './system';
import { LayerSeedService } from './layer-seed.service';
import { LegisSeedService } from './legis-seed.service';
import { MapConfigSeedService } from './map-config-seed.service';
import { SearchConfigSeedService } from './search-config-seed.service';
import { UserSeedService } from './user-seed/user-seed.service';
import { QuestionSeedService } from './question-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  // Run seed
  await runSystemSeed(app);

  await app.get(LayerSeedService).run();
  await app.get(MapConfigSeedService).run();
  await app.get(SearchConfigSeedService).run();
  await app.get(UserSeedService).run();
  await app.get(QuestionSeedService).run();
  await app.get(LegisSeedService).run();

  await app.close();
};

void runSeed();
