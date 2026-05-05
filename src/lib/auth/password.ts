import bcrypt from "bcryptjs";
import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2y$"];

function isBcryptHash(value: string) {
  return BCRYPT_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function verifyLegacyScryptPassword(password: string, storedHash: string) {
  const [legacySalt, key] = storedHash.split(":");

  if (!legacySalt || !key) {
    return false;
  }

  const storedKeyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scrypt(password, legacySalt, 64)) as Buffer;

  if (storedKeyBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKeyBuffer, derivedKey);
}

export async function verifyPassword(password: string, storedHash: string) {
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }

  return verifyLegacyScryptPassword(password, storedHash);
}

export function passwordNeedsRehash(storedHash: string) {
  return !isBcryptHash(storedHash);
}
