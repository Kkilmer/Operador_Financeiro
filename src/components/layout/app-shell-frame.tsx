"use client";

import { PropsWithChildren, useEffect, useState } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

type AppShellFrameProps = PropsWithChildren<{
  userName: string;
  userRole: "ADMIN" | "USER";
}>;

export function AppShellFrame({ children, userName, userRole }: AppShellFrameProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-4 px-4 py-4 lg:gap-6 lg:px-6">
        <SidebarNav isAdmin={userRole === "ADMIN"} />

        {isMobileMenuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative h-full w-72 max-w-[85vw] p-4">
              <SidebarNav
                mobile
                isAdmin={userRole === "ADMIN"}
                className="block h-full w-full shadow-2xl"
                onNavigate={() => setIsMobileMenuOpen(false)}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar userName={userName} onOpenMenu={() => setIsMobileMenuOpen(true)} />
          <div className="min-h-[calc(100vh-4rem)] min-w-0 rounded-3xl bg-white p-4 shadow-panel sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
