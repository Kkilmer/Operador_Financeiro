import { createHash, randomBytes } from "node:crypto";

export function createPasswordResetToken() {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(rawToken);

  return {
    rawToken,
    tokenHash,
  };
}

export function hashPasswordResetToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}
