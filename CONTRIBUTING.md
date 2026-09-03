# 🤝 Guia de Contribuição — Urbis Map

Obrigado por seu interesse em contribuir com o **Urbis Map**! Este documento fornece diretrizes para colaborar de forma produtiva, organizada e segura.

---

## 🏗️ Estrutura do Monorepo (Turborepo + pnpm)

```plaintext
apps/
├── api/          # Backend NestJS (REST API, PostGIS, Auth OIDC, GeoServer Proxy)
├── web/          # Frontend Principal (Mapa Interativo, Deck.gl, MapLibre)
├── site/         # Portal Institucional Mosaico (Next.js)
├── legis/        # Portal de Legislação Urbana (Next.js / Vite)
├── docs/         # Documentação Técnica e Guias
└── accounts/     # Gerenciador de Identidades e Contas (Angular)

packages/
├── shared/       # Utilitários compartilhados (PostHog, Types, Constants)
├── ui/           # Design System e componentes de interface React/Tailwind
└── eslint-config/# Configurações compartilhadas de linter
```

---

## 🚀 Fluxo de Desenvolvimento Local

### 1. Pré-requisitos
- Node.js 20+
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Docker & Docker Compose

### 2. Instalação e Execução
```bash
# 1. Instalar dependências de todos os pacotes
pnpm install

# 2. Configurar variáveis de ambiente (.env)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Subir infraestrutura local (PostgreSQL PostGIS, Redis, MinIO)
pnpm composer:up

# 4. Executar migrations do banco
pnpm --filter @open-urbis/map-api migration:run

# 5. Iniciar todos os aplicativos em modo de desenvolvimento
pnpm dev
```

---

## 📋 Padrões de Commit e Pull Requests

### Conventional Commits
Utilizamos o padrão de Conventional Commits para rastreabilidade e geração automática de changelog:
- `feat: <descrição>`: Nova funcionalidade para o usuário.
- `fix: <descrição>`: Correção de bug.
- `docs: <descrição>`: Alterações em documentações.
- `refactor: <descrição>`: Refatoração de código sem alteração de comportamento.
- `test: <descrição>`: Adição ou correção de testes.
- `chore: <descrição>`: Tarefas de build, dependências ou CI.

### Pull Requests Coesos
- Mantenha cada PR focado em um único objetivo bem delimitado.
- Sempre rode linter e testes antes de submeter: `pnpm lint` e `pnpm test`.
- Certifique-se de que a pipeline de CI e o scanner do **Gitleaks** passem sem advertências.
