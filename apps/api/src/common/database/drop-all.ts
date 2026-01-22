import { AppDataSource } from './cli.data-source';

async function dropAll() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  console.log('Dropping all tables, sequences and functions...');

  // No PostgreSQL, dropar e recriar o schema public é a forma mais limpa
  await AppDataSource.query('DROP SCHEMA public CASCADE');
  await AppDataSource.query('CREATE SCHEMA public');
  await AppDataSource.query('GRANT ALL ON SCHEMA public TO public');

  console.log('Schema cleaned successfully.');

  await AppDataSource.destroy();
}

dropAll().catch((err) => {
  console.error('Error during schema clean:', err);
  process.exit(1);
});
