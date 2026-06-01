"use client";

import { CategoryType } from "@prisma/client";
import { useMemo, useState } from "react";

import { CategoryForm } from "@/features/configuracoes/components/category-form";
import { CategoryList } from "@/features/configuracoes/components/category-list";

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

type CategorySettingsSectionProps = {
  categories: CategoryListItem[];
};

export function CategorySettingsSection({
  categories,
}: CategorySettingsSectionProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const editingCategory = useMemo(
    () => categories.find((category) => category.id === editingCategoryId) ?? null,
    [categories, editingCategoryId],
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Categorias</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre, edite e inative categorias sem apagar o histórico financeiro.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingCategoryId("new")}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 sm:w-auto"
        >
          Adicionar categoria
        </button>
      </div>

      {editingCategoryId ? (
        <div className="mb-5">
          <CategoryForm
            initialValues={
              editingCategoryId === "new"
                ? null
                : editingCategory
                ? {
                    id: editingCategory.id,
                    name: editingCategory.name,
                    type: editingCategory.type,
                    color: editingCategory.color,
                    icon: editingCategory.icon,
                    isActive: editingCategory.isActive,
                  }
                : null
            }
            onCancel={() => setEditingCategoryId(null)}
          />
        </div>
      ) : null}

      <CategoryList categories={categories} onEdit={(category) => setEditingCategoryId(category.id)} />
    </section>
  );
}
