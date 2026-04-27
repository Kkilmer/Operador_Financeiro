"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", label: "Dashboard", match: "exact" },
  { href: "/lancamentos", label: "Lancamentos", match: "section" },
  { href: "/parcelas", label: "Parcelas", match: "exact" },
  { href: "/configuracoes", label: "Configuracoes", match: "exact" },
  { href: "/lancamentos/novo", label: "Novo lancamento", match: "exact" },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 rounded-3xl bg-ink-950 p-5 text-white shadow-panel lg:block">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operador</p>
        <h1 className="mt-2 text-2xl font-semibold">Financeiro</h1>
        <p className="mt-2 text-sm text-slate-400">
          Controle simples para o dia a dia do casal.
        </p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const active =
            item.match === "exact"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
