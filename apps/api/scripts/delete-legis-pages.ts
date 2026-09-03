import 'reflect-metadata';
import { AppDataSource } from '../src/common/database/cli.data-source';

const TABLE_NAME = 'legis_pages';

type PageCounts = {
  total: number;
  active: number;
  softDeleted: number;
};

const hasFlag = (flag: string): boolean => process.argv.slice(2).includes(flag);

const getPageCounts = async (): Promise<PageCounts> => {
  const totalRes = await AppDataSource.query(
    `SELECT COUNT(*)::bigint AS count FROM "${TABLE_NAME}"`,
  );
  const activeRes = await AppDataSource.query(
    `SELECT COUNT(*)::bigint AS count FROM "${TABLE_NAME}" WHERE "deletedAt" IS NULL`,
  );
  const softDeletedRes = await AppDataSource.query(
    `SELECT COUNT(*)::bigint AS count FROM "${TABLE_NAME}" WHERE "deletedAt" IS NOT NULL`,
  );

  return {
    total: Number(totalRes[0]?.count ?? 0),
    active: Number(activeRes[0]?.count ?? 0),
    softDeleted: Number(softDeletedRes[0]?.count ?? 0),
  };
};

const printCounts = (label: string, counts: PageCounts): void => {
  console.log(`\n${label}:`);
  console.log(`  Total de páginas: ${counts.total}`);
  console.log(`  Páginas ativas: ${counts.active}`);
  console.log(`  Páginas em soft delete (deletedAt): ${counts.softDeleted}`);
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
      : 'MODO DESTRUTIVO (HARD DELETE): TODAS as páginas da tabela legis_pages serão excluídas permanentemente.',
  );

  AppDataSource.setOptions({ entities: [] });
  await AppDataSource.initialize();

  try {
    const before = await getPageCounts();
    printCounts('Contagens antes da operação', before);

    if (dryRun) {
      console.log(
        '\n[DRY-RUN] Nada foi alterado. Para executar a limpeza definitiva (hard delete), execute com a flag --confirm.',
      );
      return;
    }

    await AppDataSource.transaction(async (manager) => {
      await manager.query(`DELETE FROM "${TABLE_NAME}"`);
    });

    const after = await getPageCounts();
    printCounts('Contagens depois da operação', after);

    if (after.total !== 0) {
      throw new Error(
        `Erro: a verificação final encontrou ${after.total} página(s) restante(s).`,
      );
    }

    console.log(
      '\nLimpeza concluída com sucesso! Todas as páginas do Legis foram removidas permanentemente (HARD DELETE).',
    );
  } finally {
    await AppDataSource.destroy();
  }
};

main().catch((error: unknown) => {
  console.error(
    '\nFalha ao limpar páginas do Legis:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
