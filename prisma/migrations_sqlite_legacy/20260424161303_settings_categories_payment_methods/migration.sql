-- AlterTable
ALTER TABLE "Category" ADD COLUMN "color" TEXT;
ALTER TABLE "Category" ADD COLUMN "icon" TEXT;

-- CreateTable
CREATE TABLE "PaymentMethodOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "behavior" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "requiresInstallments" BOOLEAN NOT NULL DEFAULT false,
    "immediateSettlement" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethodOption_paymentMethod_key" ON "PaymentMethodOption"("paymentMethod");

-- CreateIndex
CREATE INDEX "PaymentMethodOption_behavior_idx" ON "PaymentMethodOption"("behavior");

-- CreateIndex
CREATE INDEX "PaymentMethodOption_isActive_idx" ON "PaymentMethodOption"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethodOption_name_key" ON "PaymentMethodOption"("name");
