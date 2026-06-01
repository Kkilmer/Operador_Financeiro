# Fase 2 — Endurecimento de `userId`

## Objetivo

Endurecer o isolamento multiusuário nas tabelas financeiras sem perder dados existentes e sem usar operações destrutivas.

## Models com `userId` opcional hoje

- `Person`
- `FinancialAccount`
- `Category`
- `PaymentMethodOption`
- `FinancialEntry`
- `InstallmentPurchase`
- `Installment`

## Risco atual

Enquanto `userId` permanece opcional:

- scripts antigos ou inserts futuros podem criar registros órfãos
- validações de ownership continuam dependendo só da aplicação
- migrations futuras não garantem isolamento completo no banco

## Estratégia segura

### 1. Verificar órfãos e divergências

Rode primeiro:

```bash
npm run prisma:check-ownership
```

O script:

- conta registros com `userId = null`
- gera amostras dos registros órfãos
- aponta contagens de divergência entre `userId` do registro e `userId` das relações principais

### 2. Corrigir órfãos em dry-run

```bash
npm run prisma:backfill-orphans
```

Por padrão ele não altera nada.

### 3. Aplicar backfill apenas se a saída estiver correta

```bash
$env:APPLY='true'; npm run prisma:backfill-orphans
```

Opcionalmente, para outro admin alvo:

```bash
$env:TARGET_ADMIN_EMAIL='kevin@operador.local'; $env:APPLY='true'; npm run prisma:backfill-orphans
```

### 4. Confirmar que não restou nenhum `userId = null`

Rode novamente:

```bash
npm run prisma:check-ownership
```

### 5. Só depois endurecer o schema

Mudanças recomendadas no Prisma:

- trocar `userId String?` por `userId String`
- trocar `user User?` por `user User`
- alterar `onDelete: SetNull` para `onDelete: Restrict`

`Restrict` é o comportamento mais seguro para este domínio porque evita apagar usuário que ainda tem dados financeiros vinculados.

## Migration SQL proposta

> Não aplicar antes de zerar órfãos e validar o check de ownership.

```sql
ALTER TABLE "Person" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "FinancialAccount" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "PaymentMethodOption" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "FinancialEntry" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "InstallmentPurchase" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Installment" ALTER COLUMN "userId" SET NOT NULL;
```

Além disso, a migration final deve recriar as foreign keys dessas tabelas para remover `SET NULL` e usar `RESTRICT`.

## Checklist antes da migration

- backup atualizado do banco
- `npm run prisma:check-ownership` sem órfãos
- nenhuma divergência relevante de ownership entre relações
- admin alvo correto para eventual backfill
- app apontando para PostgreSQL correto
- sem `migrate reset`
- sem seed destrutivo

## Checklist depois da migration

- `npx prisma generate`
- `npm run build`
- login funcionando
- dashboard funcionando
- lançamentos funcionando
- parcelas funcionando
- suporte funcionando
- admin funcionando
- nenhum create/update falhando por `userId`
