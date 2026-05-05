"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  className?: string;
  label?: string;
  pendingLabel?: string;
};

export function SubmitButton({
  className = "",
  label = "Salvar lançamento",
  pendingLabel = "Salvando...",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-12 items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
