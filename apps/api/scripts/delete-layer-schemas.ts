import 'reflect-metadata';
import { AppDataSource } from '../src/common/database/cli.data-source';

const TABLES = {
  layerSchemas: 'layer_schemas',
  layerSchemaColors: 'layer_schemas_colors',
  searchConfig: 'search_config',
} as const;

type Counts = {
  layerSchemasTotal: number;
  layerSchemasActive: number;
  layerSchemasSoftDeleted: number;
  layerSchemaColors: number;
  searchConfigLinked: number;
};

const hasFlag = (flag: string): boolean => process.argv.slice(2).includes(flag);

const countRows = async (query: string): Promise<number> => {
  const result = await AppDataSource.query(query);
  return Number(result[0]?.count ?? 0);
};

const getCounts = async (): Promise<Counts> => {
  return {
    layerSchemasTotal: await countRows(
      `SELECT COUNT(*)::bigint AS count FROM "${TABLES.layerSchemas}"`,
    ),
    layerSchemasActive: await countRows(
      `SELECT COUNT(*)::bigint AS count FROM "${TABLES.layerSchemas}" WHERE "deletedAt" IS NULL`,
    ),
    layerSchemasSoftDeleted: await countRows(
      `SELECT COUNT(*)::bigint AS count FROM "${TABLES.layerSchemas}" WHERE "deletedAt" IS NOT NULL`,
    ),
    layerSchemaColors: await countRows(
      `SELECT COUNT(*)::bigint AS count FROM "${TABLES.layerSchemaColors}"`,
    ),
    searchConfigLinked: await countRows(
      `SELECT COUNT(*)::bigint AS count FROM "${TABLES.searchConfig}" WHERE "layerSchemaId" IS NOT NULL`,
    ),
  };
};

const printCounts = (label: string, counts: Counts): void => {
  console.log(`\n${label}:`);
  console.log(`  layer_schemas (total): ${counts.layerSchemasTotal}`);
  console.log(`  layer_schemas (ativas): ${counts.layerSchemasActive}`);
  console.log(
    `  layer_schemas (soft-deleted): ${counts.layerSchemasSoftDeleted}`,
  );
  console.log(`  layer_schemas_colors: ${counts.layerSchemaColors}`);
  console.log(
    `  search_config vinculadas a layerSchema: ${counts.searchConfigLinked}`,
  );
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
      : 'MODO DESTRUTIVO (HARD DELETE): Todos os layer schemas e cores associadas serão excluídos permanentemente.',
  );

  AppDataSource.setOptions({ entities: [] });
  await AppDataSource.initialize();

  try {
    const before = await getCounts();
    printCounts('Contagens antes da operação', before);

    if (dryRun) {
      console.log(
        '\n[DRY-RUN] Nada foi alterado. Para executar a limpeza definitiva (hard delete), execute com a flag --confirm.',
      );
      return;
    }

    await AppDataSource.transaction(async (manager) => {
      // 1. Desvincular referências de layerSchema em search_config se houver
      await manager.query(
        `UPDATE "${TABLES.searchConfig}" SET "layerSchemaId" = NULL WHERE "layerSchemaId" IS NOT NULL`,
      );

      // 2. Remover cores associadas
      await manager.query(`DELETE FROM "${TABLES.layerSchemaColors}"`);

      // 3. Remover todos os layer schemas
      await manager.query(`DELETE FROM "${TABLES.layerSchemas}"`);
    });

    const after = await getCounts();
    printCounts('Contagens depois da operação', after);

    if (
      after.layerSchemasTotal !== 0 ||
      after.layerSchemaColors !== 0 ||
      after.searchConfigLinked !== 0
    ) {
      throw new Error(
        `Erro: a verificação final encontrou registros restantes: ` +
          `layer_schemas=${after.layerSchemasTotal}, colors=${after.layerSchemaColors}, search_config=${after.searchConfigLinked}`,
      );
    }

    console.log(
      '\nLimpeza concluída com sucesso! Todos os layer schemas foram removidos permanentemente.',
    );
  } finally {
    await AppDataSource.destroy();
  }
};

main().catch((error: unknown) => {
  console.error(
    '\nFalha ao limpar layer schemas:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
