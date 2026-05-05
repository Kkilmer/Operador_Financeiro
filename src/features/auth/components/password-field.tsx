"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { useAuthFormState } from "@/features/auth/components/auth-form-context";

type PasswordFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  showStrengthMeter?: boolean;
  autoComplete?: string;
};

type PasswordStrength = {
  label: "Senha fraca" | "Senha média" | "Senha forte";
  progressClassName: string;
  trackClassName: string;
  widthClassName: string;
};

function getPasswordStrength(value: string): PasswordStrength {
  const hasMinLength = value.length >= 8;
  const hasLetterAndNumber = /[A-Za-z]/.test(value) && /\d/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (!hasMinLength) {
    return {
      label: "Senha fraca",
      progressClassName: "bg-rose-500",
      trackClassName: "bg-rose-100",
      widthClassName: "w-1/3",
    };
  }

  if (hasLetterAndNumber && !(hasUpper && hasLower && hasNumber && hasSymbol)) {
    return {
      label: "Senha média",
      progressClassName: "bg-amber-500",
      trackClassName: "bg-amber-100",
      widthClassName: "w-2/3",
    };
  }

  return {
    label: "Senha forte",
    progressClassName: "bg-emerald-500",
    trackClassName: "bg-emerald-100",
    widthClassName: "w-full",
  };
}

export function PasswordField({
  name,
  label,
  placeholder,
  helperText,
  showStrengthMeter = false,
  autoComplete,
}: PasswordFieldProps) {
  const state = useAuthFormState();
  const error = state?.fieldErrors?.[name]?.[0];
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const strength = useMemo(() => getPasswordStrength(value), [value]);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${name}-error` : helperText || showStrengthMeter ? `${name}-helper` : undefined
          }
          className={cn(
            "w-full rounded-2xl border px-4 py-3 pr-14 outline-none transition",
            error
              ? "border-rose-400 bg-rose-50 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              : "border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          )}
          onChange={(event) => {
            setValue(event.currentTarget.value);
          }}
        />
        <button
          type="button"
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-3 inline-flex items-center justify-center text-xl text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        >
          👁️
        </button>
      </div>

      {helperText ? (
        <span id={`${name}-helper`} className="text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}

      {showStrengthMeter && value.length > 0 ? (
        <div className="space-y-2">
          <div className={cn("h-2 overflow-hidden rounded-full", strength.trackClassName)}>
            <div className={cn("h-full rounded-full transition-all", strength.progressClassName, strength.widthClassName)} />
          </div>
          <p className="text-xs font-medium text-slate-600">{strength.label}</p>
        </div>
      ) : null}

      {error ? (
        <span id={`${name}-error`} className="text-sm text-rose-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
