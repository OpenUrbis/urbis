import { NestFactory } from '@nestjs/core';
import { SeedModule } from '../src/common/database/seeds/seed.module';
import { SystemRoleSeedService } from '../src/common/database/seeds/system/system-role.seed';
import { UserRoleAssignment } from '../src/role/entities/user-role-assignment.entity';
import { SYSTEM_ROLES } from '../src/common/constants/system-roles.const';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function run() {
  const app = await NestFactory.create(SeedModule, { logger: ['error', 'warn', 'log'] });
  console.log('--- Iniciando seed de cargos e permissões do sistema ---');
  
  const seedService = app.get(SystemRoleSeedService);
  await seedService.run();

  const userRoleAssignmentRepo = app.get<Repository<UserRoleAssignment>>(
    getRepositoryToken(UserRoleAssignment),
  );

  const assignments = await userRoleAssignmentRepo.find({
    where: { roleId: SYSTEM_ROLES.user },
    relations: ['user', 'role'],
  });

  console.log(`--- Total de usuários com o cargo 'Usuário' agora: ${assignments.length} ---`);
  assignments.forEach((a) => {
    console.log(`- Usuário: ${a.user?.email || a.userId} | Cargo: ${a.role?.name} (${a.roleId})`);
  });

  await app.close();
  console.log('--- Seed concluída com sucesso! ---');
}

run().catch((err) => {
  console.error('Erro ao rodar seed:', err);
  process.exit(1);
});
