import Link from "next/link";

type AdminSectionNavProps = {
  active: "usuarios" | "suporte";
};

export function AdminSectionNav({ active }: AdminSectionNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/admin/usuarios"
        className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium transition ${
          active === "usuarios" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
        }`}
      >
        Usuários
      </Link>
      <Link
        href="/admin/suporte"
        className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium transition ${
          active === "suporte" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
        }`}
      >
        Suporte
      </Link>
    </nav>
  );
}
