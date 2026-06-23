# Urbis

![Capa do Repositório](apps/docs/public/cover.png)

[![CI Pipeline](https://github.com/OpenUrbis/urbis-map/actions/workflows/lint-and-test.yaml/badge.svg)](https://github.com/OpenUrbis/urbis-map/actions/workflows/lint-and-test.yaml)
[![Docker Build and Push - API](https://github.com/OpenUrbis/urbis-map/actions/workflows/docker-deploy-api.yml/badge.svg)](https://github.com/OpenUrbis/urbis-map/actions/workflows/docker-deploy-api.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Version](https://img.shields.io/github/v/release/OpenUrbis/urbis-map)](https://github.com/OpenUrbis/urbis-map/releases)
[![Contribute](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/OpenUrbis/urbis-map/blob/main/docs/CONTRIBUTING.md)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/OpenUrbis/urbis-map)](https://github.com/OpenUrbis/urbis-map/pulls)

Urbis is an open-source platform designed to support city governments in mapping and managing public resources, services, and infrastructure. It provides flexible, modular tools to enhance transparency, optimize decision-making, and improve municipal governance.

This is a community-maintained project. If you encounter an issue, please submit a pull request with a fix. GitHub Issues will be closed.

---

## Overview

Urbis is an open-source monorepo created to empower municipal administrations with a robust mapping system for public management. It enables cities to visualize and manage urban data, streamline resource allocation, and foster data-driven governance.

- **Website**: [mapa.urbis.prefeitura.sp.gov.br](http://mapa.urbis.prefeitura.sp.gov.br/)
- **GitHub Repository**: [github.com/OpenUrbis/urbis-map](https://github.com/OpenUrbis/urbis-map)

---

## Installation

To get started with Urbis, install the dependencies using pnpm:

```bash
pnpm install
```

---

## Environment Setup

Before running the application, you need to set up the environment variables.

### API (`apps/api`)

Copy `apps/api/.env.example` to `apps/api/.env`:

```bash
cp apps/api/.env.example apps/api/.env
```

Ensure the following variables are set correctly in `apps/api/.env`:

- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME`: PostgreSQL configuration.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis configuration.
- `AUTH_SECRET`, `AUTH_API_KEY`: Secrets for authentication.
- `MAIL_SENDGRID_API_KEY`, `MAIL_FROM`: Email configuration.

### Web (`apps/web`)

Copy `apps/web/.env.example` to `apps/web/.env`:

```bash
cp apps/web/.env.example apps/web/.env
```

Required variables:

- `VITE_PUBLIC_MAPBOX_ACCESS_TOKEN`: Mapbox token for map rendering.
- `VITE_API_URL`: URL of the backend API (default: `http://localhost:3000`).

### Accounts (`apps/accounts`)

To run the Accounts app locally with SSL (required for full OIDC support), follow these steps:

1.  **SSL Certificates**: Ensure you have `conta.urbis.prefeitura.sp.gov.br.pem` and `conta.urbis.prefeitura.sp.gov.br-key.pem` in `apps/accounts/`.
2.  **Hosts File**: Add `127.0.0.1 conta.urbis.prefeitura.sp.gov.br` to your systems hosts file.
3.  **Run**: Use the following command to start both Angular and the SSL proxy:
    ```bash
    pnpm --filter @open-urbis/map-accounts dev:ssl
    ```

---

## Usage

To start the infrastructure (PostgreSQL and Redis) using Docker:

```bash
pnpm composer:up
```

> **Note:** The `composer:up` command requires the database environment variables. Ensure you have them exported or in a `.env` file in the root directory, or update the script to load them from `apps/api/.env`.

To start the development server:

```bash
pnpm dev
```

This will launch the local development environment, allowing you to test and explore the mapping system.

For production builds:

```bash
pnpm build
```

---

## Database Management

We use TypeORM for database interactions. To manage the database schema and data, you can use the following commands:

### Migrations

To run pending migrations:

```bash
pnpm --filter @open-urbis/map-api migration:run
```

To revert the last applied migration:

```bash
pnpm --filter @open-urbis/map-api migration:revert
```

### Seeds

To populate the database with initial data:

```bash
pnpm --filter @open-urbis/map-api seed:run
```

---

## Local Development

To contribute to Urbis, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/OpenUrbis/urbis-map.git
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start the development server**:

   ```bash
   pnpm dev
   ```

4. Open your browser and visit `http://localhost:5173`.

---

## Contribution

We welcome community contributions! Read our [Contributing Guidelines](CONTRIBUTING.md) to learn how to submit pull requests, report issues, or suggest improvements.

- Found a bug? Submit a pull request with a fix.
- Want to add a feature? Open a pull request with your proposal.

---

## License

Urbis is licensed under the [AGPL v3](https://www.gnu.org/licenses/agpl-3.0). You are free to use, modify, and distribute this software under the terms of the AGPL v3, ensuring that any derivative works remain open source.

---

## Community

We’re building a community around Urbis! Join the conversation and help us improve the project:

Stay tuned for updates on our official channels (coming soon). For now, feel free to reach out via [contas@urbis.prefeitura.sp.gov.br](mailto:contas@urbis.prefeitura.sp.gov.br) or open a discussion in the repository.

---

## Contributors

A huge thanks to all our contributors! Your efforts make Urbis better for everyone.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
   <tbody>
      <tr>
         <td align="center" valign="top" width="14.28%"><a href="https://github.com/h-pgy"><img src="https://avatars.githubusercontent.com/u/41967884?v=4?s=100" width="100px;" alt="Henrique Pougy"/><br /><sub><b>Henrique Pougy</b></sub></a><br /><a href="https://github.com/OpenUrbis/urbis-map/commits?author=h-pgy" title="Documentation">📖</a> <a href="#maintenance-h-pgy" title="Maintenance">🚧</a></td>
         <td align="center" valign="top" width="14.28%"><a href="https://github.com/mauryascm"><img src="https://avatars.githubusercontent.com/u/166533566?v=4?s=100" width="100px;" alt="mauryascm"/><br /><sub><b>mauryascm</b></sub></a><br /><a href="https://github.com/OpenUrbis/urbis-map/commits?author=mauryascm" title="Documentation">📖</a> <a href="#maintenance-mauryascm" title="Maintenance">🚧</a> <a href="https://github.com/OpenUrbis/urbis-map/commits?author=mauryascm" title="Tests">⚠️</a> <a href="#projectManagement-mauryascm" title="Project Management">📆</a></td>
         <td align="center" valign="top" width="14.28%"><a href="https://github.com/RenanTashiro"><img src="https://avatars.githubusercontent.com/u/13706026?v=4?s=100" width="100px;" alt="Renan Tashiro"/><br /><sub><b>Renan Tashiro</b></sub></a><br /><a href="https://github.com/OpenUrbis/urbis-map/commits?author=RenanTashiro" title="Code">💻</a> <a href="#projectManagement-RenanTashiro" title="Project Management">📆</a> <a href="https://github.com/OpenUrbis/urbis-map/commits?author=RenanTashiro" title="Documentation">📖</a> <a href="#maintenance-RenanTashiro" title="Maintenance">🚧</a></td>
         <td align="center" valign="top" width="14.28%"><a href="https://github.com/FernandoDorstSilva"><img src="https://avatars.githubusercontent.com/u/112201931?v=4?s=100" width="100px;" alt="Fernando Dorst"/><br /><sub><b>Fernando Dorst</b></sub></a><br /><a href="https://github.com/OpenUrbis/urbis-map/commits?author=FernandoDorstSilva" title="Code">💻</a> <a href="https://github.com/OpenUrbis/urbis-map/commits?author=FernandoDorstSilva" title="Documentation">📖</a></td>
         <td align="center" valign="top" width="14.28%"><a href="https://github.com/douglasgc"><img src="https://avatars.githubusercontent.com/u/32394842?v=4?s=100" width="100px;" alt="Douglas Gabriel Cardoso"/><br /><sub><b>Douglas Gabriel Cardoso</b></sub></a><br /><a href="https://github.com/OpenUrbis/urbis-map/commits?author=douglasgc" title="Code">💻</a> <a href="https://github.com/OpenUrbis/urbis-map/commits?author=douglasgc" title="Documentation">📖</a> <a href="#maintenance-douglasgc" title="Maintenance">🚧</a></td>
         <td align="center" valign="top" width="14.28%"><a href="https://github.com/laysmorimoto"><img src="https://avatars.githubusercontent.com/u/171581826?v=4?s=100" width="100px;" alt="laysmorimoto"/><br /><sub><b>laysmorimoto</b></sub></a><br /><a href="https://github.com/OpenUrbis/urbis-map/commits?author=laysmorimoto" title="Documentation">📖</a></td>
         <td align="center" valign="top" width="14.28%"><a href="https://github.com/junior-anzolin"><img src="https://avatars.githubusercontent.com/u/32394862?v=4?s=100" width="100px;" alt="Junior Anzolin"/><br /><sub><b>Junior Anzolin</b></sub></a><br /><a href="https://github.com/OpenUrbis/urbis-map/commits?author=junior-anzolin" title="Code">💻</a> <a href="https://github.com/OpenUrbis/urbis-map/commits?author=junior-anzolin" title="Documentation">📖</a> <a href="#maintenance-douglasgc" title="Maintenance">🚧</a></td>
      </tr>
   </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=OpenUrbis/urbis-map&type=Date)](https://star-history.com/#OpenUrbis/urbis-map&Date)

---

## Contact

For questions, feedback, or support, reach out to us at [contas@urbis.prefeitura.sp.gov.br](mailto:contas@urbis.prefeitura.sp.gov.br).
