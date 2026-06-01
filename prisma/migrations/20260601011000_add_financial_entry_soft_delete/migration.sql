ALTER TABLE "FinancialEntry"
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "FinancialEntry_userId_deletedAt_idx"
  ON "FinancialEntry"("userId", "deletedAt");
