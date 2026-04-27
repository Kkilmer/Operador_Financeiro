"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/lancamentos", label: "Lanc.", icon: "≡" },
  { href: "/parcelas", label: "Parcelas", icon: "◫" },
  { href: "/configuracoes", label: "Config", icon: "⚙" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid h-[72px] max-w-md grid-cols-4 px-4 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                active ? "text-brand-600" : "text-slate-500",
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
