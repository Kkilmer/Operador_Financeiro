ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "resetPasswordTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "resetPasswordExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_resetPasswordTokenHash_key" ON "User"("resetPasswordTokenHash");
