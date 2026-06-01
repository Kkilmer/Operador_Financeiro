ALTER TABLE "Person" DROP CONSTRAINT "Person_userId_fkey";
ALTER TABLE "FinancialAccount" DROP CONSTRAINT "FinancialAccount_userId_fkey";
ALTER TABLE "Category" DROP CONSTRAINT "Category_userId_fkey";
ALTER TABLE "PaymentMethodOption" DROP CONSTRAINT "PaymentMethodOption_userId_fkey";
ALTER TABLE "FinancialEntry" DROP CONSTRAINT "FinancialEntry_userId_fkey";
ALTER TABLE "InstallmentPurchase" DROP CONSTRAINT "InstallmentPurchase_userId_fkey";
ALTER TABLE "Installment" DROP CONSTRAINT "Installment_userId_fkey";

ALTER TABLE "Person" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "FinancialAccount" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "PaymentMethodOption" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "FinancialEntry" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "InstallmentPurchase" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Installment" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Person"
  ADD CONSTRAINT "Person_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialAccount"
  ADD CONSTRAINT "FinancialAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentMethodOption"
  ADD CONSTRAINT "PaymentMethodOption_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry"
  ADD CONSTRAINT "FinancialEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InstallmentPurchase"
  ADD CONSTRAINT "InstallmentPurchase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Installment"
  ADD CONSTRAINT "Installment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
