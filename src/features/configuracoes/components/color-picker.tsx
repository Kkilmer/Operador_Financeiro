"use client";

import { useMemo, useState } from "react";

import { CATEGORY_COLOR_OPTIONS } from "@/features/configuracoes/components/category-visual-options";
import { cn } from "@/lib/utils/cn";

type ColorPickerProps = {
  name: string;
  defaultValue?: string | null;
  error?: string;
};

export function ColorPicker({ name, defaultValue, error }: ColorPickerProps) {
  const normalizedDefault = defaultValue?.trim().toUpperCase() ?? "";
  const isPreset = CATEGORY_COLOR_OPTIONS.some((option) => option.value === normalizedDefault);
  const [selectedColor, setSelectedColor] = useState(isPreset ? normalizedDefault : "");
  const [customColor, setCustomColor] = useState(isPreset ? "" : normalizedDefault);
  const value = customColor || selectedColor;
  const previewLabel = useMemo(
    () => CATEGORY_COLOR_OPTIONS.find((option) => option.value === value)?.label ?? "Cor personalizada",
    [value],
  );

  return (
    <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <input type="hidden" name={name} value={value} />

      <div>
        <legend className="text-sm font-semibold text-slate-800">Cor</legend>
        <p className="mt-1 text-xs text-slate-500">Escolha uma cor para identificar a categoria.</p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Paleta de cores">
        <button
          type="button"
          aria-label="Usar cor padrão"
          aria-pressed={!value}
          onClick={() => {
            setSelectedColor("");
            setCustomColor("");
          }}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-full border px-4 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
            !value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          Padrão
        </button>
        {CATEGORY_COLOR_OPTIONS.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              title={option.label}
              aria-label={`Selecionar cor ${option.label}`}
              aria-pressed={active}
              onClick={() => {
                setSelectedColor(option.value);
                setCustomColor("");
              }}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full border bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
                active ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200 hover:scale-105",
              )}
            >
              <span
                className="size-7 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: option.value }}
              />
            </button>
          );
        })}
      </div>

      <label className="grid gap-2 sm:grid-cols-[minmax(0,1fr),auto] sm:items-center">
        <span className="text-xs font-medium text-slate-500">Hex personalizado</span>
        <input
          type="text"
          value={customColor}
          onChange={(event) => setCustomColor(event.target.value.trim().toUpperCase())}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm sm:w-36"
          placeholder="#22C55E"
        />
      </label>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span
          className="inline-flex size-4 rounded-full border border-slate-200"
          style={{ backgroundColor: value || "#E2E8F0" }}
        />
        <span>{value ? previewLabel : "Cor padrão do sistema"}</span>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </fieldset>
  );
}
