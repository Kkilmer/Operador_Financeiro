"use client";

import { cn } from "@/lib/utils/cn";

import { useAuthFormState } from "@/features/auth/components/auth-form-context";

type AuthTextFieldProps = {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  helperText?: string;
  defaultValue?: string;
  autoComplete?: string;
};

export function AuthTextField({
  name,
  label,
  type = "text",
  placeholder,
  helperText,
  defaultValue,
  autoComplete,
}: AuthTextFieldProps) {
  const state = useAuthFormState();
  const error = state?.fieldErrors?.[name]?.[0];

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        className={cn(
          "w-full rounded-2xl border px-4 py-3 outline-none transition",
          error
            ? "border-rose-400 bg-rose-50 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            : "border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
        )}
      />
      {helperText ? (
        <span id={`${name}-helper`} className="text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span id={`${name}-error`} className="text-sm text-rose-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
