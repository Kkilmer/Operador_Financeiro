"use client";

import { CategoryType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { inactivateCategoryAction } from "@/features/configuracoes/actions/inactivate-category";

type CategoryListItem = {
  id: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  _count: {
    entries: number;
    purchases: number;
  };
};

type CategoryListProps = {
  categories: CategoryListItem[];
  onEdit: (category: CategoryListItem) => void;
};

function typeLabel(type: CategoryType) {
  switch (type) {
    case CategoryType.INCOME:
      return "Entrada";
    case CategoryType.EXPENSE:
      return "Saida";
    case CategoryType.BOTH:
      return "Ambos";
    default:
      return type;
  }
}

export function CategoryList({ categories, onEdit }: CategoryListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-3 pr-4 font-medium">Nome</th>
            <th className="py-3 pr-4 font-medium">Tipo</th>
            <th className="py-3 pr-4 font-medium">Cor</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 pr-4 font-medium">Uso no historico</th>
            <th className="py-3 font-medium">Acoes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((category) => (
            <tr key={category.id}>
              <td className="py-4 pr-4 font-medium text-slate-900">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex size-3 rounded-full border border-slate-200"
                    style={{ backgroundColor: category.color ?? "#E2E8F0" }}
                  />
                  <span>{category.name}</span>
                </div>
              </td>
              <td className="py-4 pr-4 text-slate-700">{typeLabel(category.type)}</td>
              <td className="py-4 pr-4 text-slate-700">{category.color ?? "Padrao"}</td>
              <td className="py-4 pr-4">
                <Badge tone={category.isActive ? "emerald" : "slate"}>
                  {category.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </td>
              <td className="py-4 pr-4 text-slate-700">
                {category._count.entries + category._count.purchases} vinculos
              </td>
              <td className="py-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(category)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Editar
                  </button>
                  {category.isActive ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await inactivateCategoryAction(category.id);
                          router.refresh();
                        })
                      }
                      className="rounded-full border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                    >
                      Inativar
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
