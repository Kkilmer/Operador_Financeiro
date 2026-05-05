import { PropsWithChildren } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth/session";

export async function AppShell({ children }: PropsWithChildren) {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="min-h-screen bg-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 lg:px-6">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar userName={user.name} />
          <div className="min-h-[calc(100vh-4rem)] rounded-3xl bg-white p-4 shadow-panel sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
