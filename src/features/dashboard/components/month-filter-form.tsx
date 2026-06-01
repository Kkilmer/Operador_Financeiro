type MonthFilterFormProps = {
  selectedMonth: string;
  dark?: boolean;
};

export function MonthFilterForm({ selectedMonth, dark = false }: MonthFilterFormProps) {
  return (
    <form className="flex flex-wrap items-end gap-3" method="get">
      <label className="flex flex-col gap-2 text-sm">
        <span className={dark ? "font-medium text-slate-200" : "font-medium text-slate-600"}>
          Mês de referência
        </span>
        <input
          type="month"
          name="month"
          defaultValue={selectedMonth}
          className={
            dark
              ? "rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-white"
              : "rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700"
          }
        />
      </label>
      <button
        type="submit"
        className={
          dark
            ? "rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900"
            : "rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        }
      >
        Aplicar filtro
      </button>
    </form>
  );
}
