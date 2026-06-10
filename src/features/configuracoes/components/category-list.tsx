"use client";

import { CategoryType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { inactivateCategoryAction } from "@/features/configuracoes/actions/inactivate-category";
import {
  CategoryIconGlyph,
  getCategoryIconLabel,
} from "@/features/configuracoes/components/category-visual-options";

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
      return "Saída";
    case CategoryType.BOTH:
      return "Ambos";
    case CategoryType.INVESTMENT:
      return "Guardado / Reserva";
    default:
      return type;
  }
}

export function CategoryList({ categories, onEdit }: CategoryListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {categories.map((category) => (
          <article key={category.id} className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                  style={{ backgroundColor: category.color ?? "#64748B" }}
                >
                  <CategoryIconGlyph icon={category.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-slate-900">{category.name}</h3>
                  <p className="text-sm text-slate-500">{typeLabel(category.type)}</p>
                </div>
              </div>
              <Badge tone={category.isActive ? "emerald" : "slate"}>
                {category.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visual</p>
                <p className="mt-1 font-medium text-slate-700">
                  {category.color ?? "Padrão"} · {getCategoryIconLabel(category.icon)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Histórico</p>
                <p className="mt-1 font-medium text-slate-700">
                  {category._count.entries + category._count.purchases} vínculos
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit(category)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                >
                  Inativar
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-slate-100 md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-3 pr-4 font-medium">Nome</th>
            <th className="py-3 pr-4 font-medium">Tipo</th>
            <th className="py-3 pr-4 font-medium">Visual</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 pr-4 font-medium">Uso no histórico</th>
            <th className="py-3 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((category) => (
            <tr key={category.id}>
              <td className="py-4 pr-4 font-medium text-slate-900">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex size-8 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: category.color ?? "#64748B" }}
                  >
                    <CategoryIconGlyph icon={category.icon} className="size-4" />
                  </span>
                  <span>{category.name}</span>
                </div>
              </td>
              <td className="py-4 pr-4 text-slate-700">{typeLabel(category.type)}</td>
              <td className="py-4 pr-4 text-slate-700">
                {category.color ?? "Padrão"} · {getCategoryIconLabel(category.icon)}
              </td>
              <td className="py-4 pr-4">
                <Badge tone={category.isActive ? "emerald" : "slate"}>
                  {category.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </td>
              <td className="py-4 pr-4 text-slate-700">
                {category._count.entries + category._count.purchases} vínculos
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
    </>
  );
}
