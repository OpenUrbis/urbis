# Urbis Map OpenAPI

## Quick run

```bash
cd my-app/
cp .env.example .env
```

## Comfortable development

```bash
cd my-app/
cp env.example .env
```

Local use: localhost in host
Inside a docker use: postgres host

```bash
npm install

npm run migration:run

npm run seed:run

npm run start:dev
```

## Links

- Swagger: http://localhost:3000/swagger/docs

## Database utils

Generate migration

```bash
npm run migration:generate -- src/database/migrations/CreateNameTable 
```

Run migration

```bash
npm run migration:run
```

Revert migration

```bash
npm run migration:revert
```

Drop all tables in database

```bash
npm run schema:drop
```

Run seed

```bash
npm run seed:run
```

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```
