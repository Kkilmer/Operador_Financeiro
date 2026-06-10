# PostgreSQL Baseline e Deploy Seguro

## Por que esta mudança existe

O projeto já está modelado em PostgreSQL, mas o histórico ativo de migrations vinha de uma trilha antiga que começou em SQLite. Isso impede um `prisma migrate deploy` confiável em ambientes novos, porque o Prisma tenta reconciliar um histórico que não representa mais o banco real de produção.

## O que mudou no repositório

- `prisma/migrations` agora contém apenas a baseline PostgreSQL ativa.
- o histórico antigo foi arquivado em `prisma/migrations_sqlite_legacy/`
- `migration_lock.toml` passa a declarar `provider = "postgresql"`
- o container de produção executa `prisma migrate deploy` antes de subir o Next.js

## O que NÃO foi feito

- nenhum banco foi apagado
- nenhum dado foi alterado
- nenhum `migrate reset` foi usado
- nenhuma seed destrutiva foi executada

## Como tratar bancos PostgreSQL que já existem e já têm dados

Se o banco atual já está no estado correto do schema, a baseline deve ser marcada como aplicada:

```bash
npx prisma migrate resolve --applied 0_postgres_baseline
```

Esse comando apenas registra a baseline na tabela `_prisma_migrations`. Ele não recria tabelas e não apaga dados.

## Como subir um banco PostgreSQL novo

Em um ambiente novo, basta aplicar:

```bash
npx prisma migrate deploy
```

Como a baseline já representa o estado atual completo do schema, o ambiente sobe sem intervenção manual de SQL.

## Fluxo recomendado para produção com PostgreSQL

1. Criar um banco PostgreSQL e manter a connection string em `DATABASE_URL`.
2. Configurar `APP_URL` com a URL pública do app.
3. Gerar o Prisma Client com `npx prisma generate`.
4. Aplicar migrations com `npx prisma migrate deploy`.
5. Subir o app com `npm run start` ou com o container Docker.

O script `scripts/start-production.mjs` executa `prisma migrate deploy` antes de iniciar o servidor standalone do Next.js quando usado no container.

## Comandos principais

Gerar client:

```bash
npx prisma generate
```

Aplicar baseline em banco já existente:

```bash
npx prisma migrate resolve --applied 0_postgres_baseline
```

Aplicar migrations pendentes em ambiente novo:

```bash
npx prisma migrate deploy
```

Build da aplicação:

```bash
npm run build
```

Testes automatizados atuais:

```bash
npm test
npm run test:e2e -- --grep "não autenticado"
```
