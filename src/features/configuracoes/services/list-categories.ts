import { prisma } from "@/lib/prisma/client";

export async function listCategories() {
  return prisma.category.findMany({
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
