# Urbis Documentation (`@open-urbis/map-docs`)

Portal web interativo de documentação técnica da plataforma Urbis, desenvolvido com **Next.js 16**, **Fumadocs MDX**, **Tailwind CSS** e explorador de especificações **OpenAPI**.

---

## 🚀 Execução em Desenvolvimento

A partir da raiz do monorepo:

```bash
pnpm --filter @open-urbis/map-docs dev
```

A documentação estará acessível em: `http://localhost:3010`

---

## 📁 Estrutura dos Conteúdos

Os conteúdos são escritos em **MDX** e localizados no diretório `content/docs`:

- `content/docs/general/architecture/`: Arquitetura do sistema, monorepo, frontend, backend e OIDC.
- `content/docs/general/development/`: Guias de instalação, setup, contribuição, pull requests e troubleshooting.
- `content/docs/general/mapa/`: Configuração de camadas, esquemas, view templates e busca espacial.
- `content/docs/general/feature-flags.mdx`: Fonte da verdade em código para feature flags, RBAC e PostHog.
- `content/docs/openapi/`: Referência interativa dos endpoints da API REST.

---

## 🏗️ Build de Produção

```bash
pnpm --filter @open-urbis/map-docs build
```

---

## 🔍 Verificação de Tipos e Linting

```bash
# Validar tipos MDX e TypeScript
pnpm --filter @open-urbis/map-docs types:check

# Executar linter Biome
pnpm --filter @open-urbis/map-docs lint
```
