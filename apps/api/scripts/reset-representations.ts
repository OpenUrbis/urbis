import 'reflect-metadata';
import { AppDataSource } from '../src/common/database/cli.data-source';

const TABLES = {
  representations: 'representations',
  comments: 'representation_comments',
  history: 'representation_history',
  users: 'users',
  organizations: 'organizations',
} as const;

type Counts = {
  representations: number;
  comments: number;
  history: number;
  users: number;
  organizations: number;
};

const hasFlag = (flag: string): boolean => process.argv.slice(2).includes(flag);

const countRows = async (table: string): Promise<number> => {
  const result = await AppDataSource.query(
    `SELECT COUNT(*)::bigint AS count FROM "${table}"`,
  );

  return Number(result[0].count);
};

const getCounts = async (): Promise<Counts> => ({
  representations: await countRows(TABLES.representations),
  comments: await countRows(TABLES.comments),
  history: await countRows(TABLES.history),
  users: await countRows(TABLES.users),
  organizations: await countRows(TABLES.organizations),
});

const printCounts = (label: string, counts: Counts): void => {
  console.log(`\n${label}`);
  console.log(`  representations: ${counts.representations}`);
  console.log(`  representation_comments: ${counts.comments}`);
  console.log(`  representation_history: ${counts.history}`);
  console.log(`  users (preservados): ${counts.users}`);
  console.log(`  organizations (preservadas): ${counts.organizations}`);
};

const getDatabaseTarget = (): string => {
  const options = AppDataSource.options as {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
  };

  return `${options.host ?? 'host não informado'}:${options.port ?? 'porta não informada'}/${options.database ?? 'database não informado'} (usuário: ${options.username ?? 'não informado'})`;
};

const assertNoUnknownArguments = (): void => {
  const validArguments = new Set(['--confirm', '--dry-run']);
  const unknownArguments = process.argv
    .slice(2)
    .filter((argument) => !validArguments.has(argument));

  if (unknownArguments.length > 0) {
    throw new Error(
      `Argumento(s) desconhecido(s): ${unknownArguments.join(', ')}. Use --dry-run ou --confirm.`,
    );
  }
};

const main = async (): Promise<void> => {
  assertNoUnknownArguments();

  const confirm = hasFlag('--confirm');
  const dryRun = hasFlag('--dry-run') || !confirm;

  if (confirm && hasFlag('--dry-run')) {
    throw new Error('Use apenas um modo: --dry-run ou --confirm.');
  }

  console.log(`Banco alvo: ${getDatabaseTarget()}`);
  console.log(
    dryRun
      ? 'Modo dry-run: nenhuma linha será removida.'
      : 'MODO DESTRUTIVO: representações e dados relacionados serão removidos.',
  );

  // Este script usa apenas SQL; carregar todas as entidades da API é desnecessário
  // e pode impedir a inicialização em ambientes com o bundle completo da aplicação.
  AppDataSource.setOptions({ entities: [] });
  await AppDataSource.initialize();
  try {
    const before = await getCounts();
    printCounts('Contagens antes da operação', before);

    if (dryRun) {
      console.log(
        '\nNada foi alterado. Para executar a limpeza, rode novamente com --confirm.',
      );
      return;
    }

    await AppDataSource.transaction(async (manager) => {
      await manager.query(`DELETE FROM "${TABLES.comments}"`);
      await manager.query(`DELETE FROM "${TABLES.history}"`);
      await manager.query(`DELETE FROM "${TABLES.representations}"`);
    });

    const after = await getCounts();
    printCounts('Contagens depois da operação', after);

    if (
      after.representations !== 0 ||
      after.comments !== 0 ||
      after.history !== 0
    ) {
      throw new Error(
        'A verificação final encontrou dados de representação restantes.',
      );
    }

    if (
      after.users !== before.users ||
      after.organizations !== before.organizations
    ) {
      throw new Error(
        'A verificação final detectou alteração em usuários ou organizações.',
      );
    }

    console.log(
      '\nLimpeza concluída. Usuários e organizações foram preservados.',
    );
  } finally {
    await AppDataSource.destroy();
  }
};

main().catch((error: unknown) => {
  console.error(
    '\nFalha ao resetar representações:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
