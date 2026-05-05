import { PropsWithChildren } from "react";

import { AppShellFrame } from "@/components/layout/app-shell-frame";
import { getCurrentUser } from "@/lib/auth/session";

export async function AppShell({ children }: PropsWithChildren) {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="min-h-screen bg-slate-100">{children}</div>;
  }

  return <AppShellFrame userName={user.name} userRole={user.role}>{children}</AppShellFrame>;
}
