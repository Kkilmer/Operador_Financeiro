import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function listCategories() {
  const userId = await requireCurrentUserId();

  return prisma.category.findMany({
    where: {
      userId,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      color: true,
      icon: true,
      isActive: true,
      _count: {
        select: {
          entries: true,
          purchases: true,
        },
      },
    },
  });
}
