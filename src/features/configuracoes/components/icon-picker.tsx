"use client";

import { useState } from "react";

import {
  CATEGORY_ICON_OPTIONS,
  CategoryIconGlyph,
} from "@/features/configuracoes/components/category-visual-options";
import { cn } from "@/lib/utils/cn";

type IconPickerProps = {
  name: string;
  defaultValue?: string | null;
  error?: string;
};

export function IconPicker({ name, defaultValue, error }: IconPickerProps) {
  const normalizedDefault =
    defaultValue && CATEGORY_ICON_OPTIONS.some((option) => option.value === defaultValue)
      ? defaultValue
      : "outros";
  const [selectedIcon, setSelectedIcon] = useState(normalizedDefault);

  return (
    <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <input type="hidden" name={name} value={selectedIcon} />

      <div>
        <legend className="text-sm font-semibold text-slate-800">Ícone</legend>
        <p className="mt-1 text-xs text-slate-500">Escolha um símbolo simples para reconhecer rápido.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label="Ícones de categoria">
        {CATEGORY_ICON_OPTIONS.map((option) => {
          const active = selectedIcon === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-label={`Selecionar ícone ${option.label}`}
              aria-pressed={active}
              onClick={() => setSelectedIcon(option.value)}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
                active
                  ? "border-brand-600 bg-brand-50 text-brand-800 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <CategoryIconGlyph icon={option.value} className="size-5" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </fieldset>
  );
}
