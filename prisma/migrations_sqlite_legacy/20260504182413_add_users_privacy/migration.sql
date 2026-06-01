-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "parentCategoryId" TEXT,
    "isEssential" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Category_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("color", "createdAt", "icon", "id", "isActive", "isEssential", "name", "parentCategoryId", "type", "updatedAt") SELECT "color", "createdAt", "icon", "id", "isActive", "isEssential", "name", "parentCategoryId", "type", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE INDEX "Category_type_idx" ON "Category"("type");
CREATE INDEX "Category_userId_isActive_idx" ON "Category"("userId", "isActive");
CREATE INDEX "Category_parentCategoryId_idx" ON "Category"("parentCategoryId");
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");
CREATE UNIQUE INDEX "Category_userId_name_type_parentCategoryId_key" ON "Category"("userId", "name", "type", "parentCategoryId");
CREATE TABLE "new_FinancialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "institutionId" TEXT,
    "ownerPersonId" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "initialBalance" DECIMAL,
    "creditLimit" DECIMAL,
    "closingDay" INTEGER,
    "dueDay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialAccount_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "FinancialInstitution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialAccount_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialAccount" ("closingDay", "createdAt", "creditLimit", "currency", "dueDay", "id", "initialBalance", "institutionId", "isActive", "isShared", "name", "ownerPersonId", "type", "updatedAt") SELECT "closingDay", "createdAt", "creditLimit", "currency", "dueDay", "id", "initialBalance", "institutionId", "isActive", "isShared", "name", "ownerPersonId", "type", "updatedAt" FROM "FinancialAccount";
DROP TABLE "FinancialAccount";
ALTER TABLE "new_FinancialAccount" RENAME TO "FinancialAccount";
CREATE INDEX "FinancialAccount_institutionId_idx" ON "FinancialAccount"("institutionId");
CREATE INDEX "FinancialAccount_ownerPersonId_idx" ON "FinancialAccount"("ownerPersonId");
CREATE INDEX "FinancialAccount_userId_isActive_idx" ON "FinancialAccount"("userId", "isActive");
CREATE INDEX "FinancialAccount_type_idx" ON "FinancialAccount"("type");
CREATE INDEX "FinancialAccount_isActive_idx" ON "FinancialAccount"("isActive");
CREATE TABLE "new_FinancialEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "competenceDate" DATETIME NOT NULL,
    "personId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "settlementStatus" TEXT NOT NULL,
    "frequencyProfile" TEXT NOT NULL DEFAULT 'VARIABLE',
    "isInstallment" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialEntry" ("accountId", "amount", "categoryId", "competenceDate", "createdAt", "description", "eventDate", "frequencyProfile", "id", "isInstallment", "notes", "origin", "paymentMethod", "personId", "settlementStatus", "type", "updatedAt") SELECT "accountId", "amount", "categoryId", "competenceDate", "createdAt", "description", "eventDate", "frequencyProfile", "id", "isInstallment", "notes", "origin", "paymentMethod", "personId", "settlementStatus", "type", "updatedAt" FROM "FinancialEntry";
DROP TABLE "FinancialEntry";
ALTER TABLE "new_FinancialEntry" RENAME TO "FinancialEntry";
CREATE INDEX "FinancialEntry_userId_competenceDate_idx" ON "FinancialEntry"("userId", "competenceDate");
CREATE INDEX "FinancialEntry_personId_competenceDate_idx" ON "FinancialEntry"("personId", "competenceDate");
CREATE INDEX "FinancialEntry_accountId_competenceDate_idx" ON "FinancialEntry"("accountId", "competenceDate");
CREATE INDEX "FinancialEntry_categoryId_competenceDate_idx" ON "FinancialEntry"("categoryId", "competenceDate");
CREATE INDEX "FinancialEntry_paymentMethod_competenceDate_idx" ON "FinancialEntry"("paymentMethod", "competenceDate");
CREATE INDEX "FinancialEntry_eventDate_idx" ON "FinancialEntry"("eventDate");
CREATE TABLE "new_Installment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "installmentPurchaseId" TEXT NOT NULL,
    "financialEntryId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "competenceDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Installment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Installment_installmentPurchaseId_fkey" FOREIGN KEY ("installmentPurchaseId") REFERENCES "InstallmentPurchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Installment_financialEntryId_fkey" FOREIGN KEY ("financialEntryId") REFERENCES "FinancialEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Installment" ("amount", "competenceDate", "createdAt", "dueDate", "financialEntryId", "id", "installmentPurchaseId", "number", "status", "updatedAt") SELECT "amount", "competenceDate", "createdAt", "dueDate", "financialEntryId", "id", "installmentPurchaseId", "number", "status", "updatedAt" FROM "Installment";
DROP TABLE "Installment";
ALTER TABLE "new_Installment" RENAME TO "Installment";
CREATE UNIQUE INDEX "Installment_financialEntryId_key" ON "Installment"("financialEntryId");
CREATE INDEX "Installment_userId_competenceDate_status_idx" ON "Installment"("userId", "competenceDate", "status");
CREATE INDEX "Installment_competenceDate_status_idx" ON "Installment"("competenceDate", "status");
CREATE INDEX "Installment_dueDate_idx" ON "Installment"("dueDate");
CREATE UNIQUE INDEX "Installment_installmentPurchaseId_number_key" ON "Installment"("installmentPurchaseId", "number");
CREATE TABLE "new_InstallmentPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "description" TEXT NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "installmentCount" INTEGER NOT NULL,
    "installmentAmount" DECIMAL NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "notes" TEXT,
    "personId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallmentPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstallmentPurchase_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallmentPurchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallmentPurchase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InstallmentPurchase" ("accountId", "categoryId", "createdAt", "description", "id", "installmentAmount", "installmentCount", "notes", "personId", "purchaseDate", "totalAmount", "updatedAt") SELECT "accountId", "categoryId", "createdAt", "description", "id", "installmentAmount", "installmentCount", "notes", "personId", "purchaseDate", "totalAmount", "updatedAt" FROM "InstallmentPurchase";
DROP TABLE "InstallmentPurchase";
ALTER TABLE "new_InstallmentPurchase" RENAME TO "InstallmentPurchase";
CREATE INDEX "InstallmentPurchase_userId_purchaseDate_idx" ON "InstallmentPurchase"("userId", "purchaseDate");
CREATE INDEX "InstallmentPurchase_personId_purchaseDate_idx" ON "InstallmentPurchase"("personId", "purchaseDate");
CREATE INDEX "InstallmentPurchase_accountId_purchaseDate_idx" ON "InstallmentPurchase"("accountId", "purchaseDate");
CREATE INDEX "InstallmentPurchase_categoryId_purchaseDate_idx" ON "InstallmentPurchase"("categoryId", "purchaseDate");
CREATE TABLE "new_PaymentMethodOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "behavior" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "requiresInstallments" BOOLEAN NOT NULL DEFAULT false,
    "immediateSettlement" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentMethodOption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PaymentMethodOption" ("behavior", "createdAt", "id", "immediateSettlement", "isActive", "name", "paymentMethod", "requiresInstallments", "updatedAt") SELECT "behavior", "createdAt", "id", "immediateSettlement", "isActive", "name", "paymentMethod", "requiresInstallments", "updatedAt" FROM "PaymentMethodOption";
DROP TABLE "PaymentMethodOption";
ALTER TABLE "new_PaymentMethodOption" RENAME TO "PaymentMethodOption";
CREATE INDEX "PaymentMethodOption_userId_isActive_idx" ON "PaymentMethodOption"("userId", "isActive");
CREATE INDEX "PaymentMethodOption_behavior_idx" ON "PaymentMethodOption"("behavior");
CREATE INDEX "PaymentMethodOption_isActive_idx" ON "PaymentMethodOption"("isActive");
CREATE UNIQUE INDEX "PaymentMethodOption_userId_name_key" ON "PaymentMethodOption"("userId", "name");
CREATE UNIQUE INDEX "PaymentMethodOption_userId_paymentMethod_key" ON "PaymentMethodOption"("userId", "paymentMethod");
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Person" ("code", "createdAt", "id", "isActive", "name", "updatedAt") SELECT "code", "createdAt", "id", "isActive", "name", "updatedAt" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
CREATE INDEX "Person_userId_isActive_idx" ON "Person"("userId", "isActive");
CREATE UNIQUE INDEX "Person_userId_code_key" ON "Person"("userId", "code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
