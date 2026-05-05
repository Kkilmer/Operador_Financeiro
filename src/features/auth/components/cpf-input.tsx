"use client";

type CpfInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  helperText?: string;
};

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function CpfInput({ name, label, placeholder = "000.000.000-00", helperText }: CpfInputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        maxLength={14}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        onChange={(event) => {
          event.currentTarget.value = formatCpf(event.currentTarget.value);
        }}
      />
      {helperText ? <span className="text-xs text-slate-500">{helperText}</span> : null}
    </label>
  );
}
