import { Prisma } from "@prisma/client";

type Primitive = string | number | boolean | null | undefined;

export type SerializedPrisma<T> =
  T extends Prisma.Decimal ? number
  : T extends Date ? string
  : T extends Primitive ? T
  : T extends Array<infer Item> ? SerializedPrisma<Item>[]
  : T extends object ? { [Key in keyof T]: SerializedPrisma<T[Key]> }
  : T;

export function serializePrisma<T>(value: T): SerializedPrisma<T> {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber() as SerializedPrisma<T>;
  }

  if (value instanceof Date) {
    return value.toISOString() as SerializedPrisma<T>;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePrisma(item)) as SerializedPrisma<T>;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializePrisma(item)]),
    ) as SerializedPrisma<T>;
  }

  return value as SerializedPrisma<T>;
}
