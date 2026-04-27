-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinancialInstitution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "institutionId" TEXT,
    "ownerPersonId" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "creditLimit" DECIMAL,
    "closingDay" INTEGER,
    "dueDay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialAccount_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "FinancialInstitution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialAccount_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentCategoryId" TEXT,
    "isEssential" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "FinancialEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallmentPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "InstallmentPurchase_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallmentPurchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallmentPurchase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installmentPurchaseId" TEXT NOT NULL,
    "financialEntryId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "competenceDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Installment_installmentPurchaseId_fkey" FOREIGN KEY ("installmentPurchaseId") REFERENCES "InstallmentPurchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Installment_financialEntryId_fkey" FOREIGN KEY ("financialEntryId") REFERENCES "FinancialEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_code_key" ON "Person"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialInstitution_name_type_key" ON "FinancialInstitution"("name", "type");

-- CreateIndex
CREATE INDEX "FinancialAccount_institutionId_idx" ON "FinancialAccount"("institutionId");

-- CreateIndex
CREATE INDEX "FinancialAccount_ownerPersonId_idx" ON "FinancialAccount"("ownerPersonId");

-- CreateIndex
CREATE INDEX "FinancialAccount_type_idx" ON "FinancialAccount"("type");

-- CreateIndex
CREATE INDEX "FinancialAccount_isActive_idx" ON "FinancialAccount"("isActive");

-- CreateIndex
CREATE INDEX "Category_type_idx" ON "Category"("type");

-- CreateIndex
CREATE INDEX "Category_parentCategoryId_idx" ON "Category"("parentCategoryId");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_type_parentCategoryId_key" ON "Category"("name", "type", "parentCategoryId");

-- CreateIndex
CREATE INDEX "FinancialEntry_personId_competenceDate_idx" ON "FinancialEntry"("personId", "competenceDate");

-- CreateIndex
CREATE INDEX "FinancialEntry_accountId_competenceDate_idx" ON "FinancialEntry"("accountId", "competenceDate");

-- CreateIndex
CREATE INDEX "FinancialEntry_categoryId_competenceDate_idx" ON "FinancialEntry"("categoryId", "competenceDate");

-- CreateIndex
CREATE INDEX "FinancialEntry_paymentMethod_competenceDate_idx" ON "FinancialEntry"("paymentMethod", "competenceDate");

-- CreateIndex
CREATE INDEX "FinancialEntry_eventDate_idx" ON "FinancialEntry"("eventDate");

-- CreateIndex
CREATE INDEX "InstallmentPurchase_personId_purchaseDate_idx" ON "InstallmentPurchase"("personId", "purchaseDate");

-- CreateIndex
CREATE INDEX "InstallmentPurchase_accountId_purchaseDate_idx" ON "InstallmentPurchase"("accountId", "purchaseDate");

-- CreateIndex
CREATE INDEX "InstallmentPurchase_categoryId_purchaseDate_idx" ON "InstallmentPurchase"("categoryId", "purchaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_financialEntryId_key" ON "Installment"("financialEntryId");

-- CreateIndex
CREATE INDEX "Installment_competenceDate_status_idx" ON "Installment"("competenceDate", "status");

-- CreateIndex
CREATE INDEX "Installment_dueDate_idx" ON "Installment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_installmentPurchaseId_number_key" ON "Installment"("installmentPurchaseId", "number");
