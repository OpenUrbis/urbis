# Urbis API Backend (`@open-urbis/map-api`)

Backend REST API da plataforma Urbis construído com **NestJS**, **TypeORM**, **PostgreSQL**, **Redis**, **MinIO S3** e provedor **OIDC**.

---

## 🚀 Execução Rápida

A partir da raiz do monorepo:

```bash
# 1. Configurar variáveis de ambiente
cp apps/api/.env.example apps/api/.env

# 2. Iniciar infraestrutura Docker (Postgres, Redis, MinIO)
pnpm composer:up

# 3. Executar migrations e seeds
pnpm --filter @open-urbis/map-api migration:run
pnpm --filter @open-urbis/map-api seed:run

# 4. Iniciar API em modo de desenvolvimento (watch)
pnpm --filter @open-urbis/map-api dev
```

A API estará acessível em: `http://localhost:3000`

---

## 📖 Endpoints e Documentação Interativa

- **Swagger OpenAPI Docs**: [http://localhost:3000/swagger/docs](http://localhost:3000/swagger/docs)
- **Health Check**: `GET /api/health` ou `GET /`

---

## 🗄️ Utilitários de Banco de Dados

Todos os comandos devem ser executados com o filtro do workspace:

```bash
# Executar migrations pendentes
pnpm --filter @open-urbis/map-api migration:run

# Reverter a última migration aplicada
pnpm --filter @open-urbis/map-api migration:revert

# Gerar uma nova migration a partir das entidades alteradas
pnpm --filter @open-urbis/map-api migration:generate src/common/database/migrations/NomeDaMigration

# Criar uma migration vazia
pnpm --filter @open-urbis/map-api migration:create src/common/database/migrations/NomeDaMigration

# Executar seeds (camadas, configurações e usuário admin)
pnpm --filter @open-urbis/map-api seed:run

# Reset completo do banco (drop schema + run migrations + run seeds)
pnpm --filter @open-urbis/map-api db:reset
```

---

## 🧪 Testes

```bash
# Testes unitários
pnpm --filter @open-urbis/map-api test

# Testes com cobertura
pnpm --filter @open-urbis/map-api test:cov

# Testes end-to-end (e2e)
pnpm --filter @open-urbis/map-api test:e2e
```
