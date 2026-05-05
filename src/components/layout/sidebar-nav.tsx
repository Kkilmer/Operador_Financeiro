"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils/cn";

type SidebarItem = {
  href: Route;
  label: string;
  match: "exact" | "section";
};

const items = [
  { href: "/dashboard", label: "Dashboard", match: "exact" },
  { href: "/lancamentos", label: "Lançamentos", match: "section" },
  { href: "/parcelas", label: "Parcelas", match: "exact" },
  { href: "/suporte", label: "Suporte", match: "exact" },
  { href: "/configuracoes", label: "Configurações", match: "exact" },
  { href: "/lancamentos/novo", label: "Novo lançamento", match: "exact" },
] satisfies readonly SidebarItem[];

type SidebarNavProps = {
  className?: string;
  mobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  isAdmin?: boolean;
};

export function SidebarNav({ className, mobile = false, onNavigate, onClose, isAdmin = false }: SidebarNavProps) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const visibleItems: SidebarItem[] = isAdmin
    ? [...items, { href: "/admin/usuarios", label: "Admin", match: "section" as const }]
    : [...items];

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      onNavigate?.();
      previousPathnameRef.current = pathname;
    }
  }, [onNavigate, pathname]);

  return (
    <aside
      className={cn(
        "w-64 shrink-0 rounded-3xl bg-ink-950 p-5 text-white shadow-panel",
        mobile ? "block" : "hidden lg:block",
        className,
      )}
    >
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operador</p>
            <h1 className="mt-2 text-2xl font-semibold">Financeiro</h1>
            <p className="mt-2 text-sm text-slate-400">
              Controle simples para o seu dia a dia financeiro.
            </p>
          </div>

          {mobile ? (
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={onClose}
              className="inline-flex size-10 items-center justify-center rounded-full border border-slate-800 text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <nav className="space-y-2">
        {visibleItems.map((item) => {
          const active =
            item.match === "exact"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
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
