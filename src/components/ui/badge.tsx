import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeProps = PropsWithChildren<{
  tone?: "slate" | "emerald" | "amber";
}>;

export function Badge({ tone = "slate", children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "slate" && "bg-slate-100 text-slate-700",
        tone === "emerald" && "bg-emerald-100 text-emerald-700",
        tone === "amber" && "bg-amber-100 text-amber-700",
      )}
    >
      {children}
    </span>
  );
}
