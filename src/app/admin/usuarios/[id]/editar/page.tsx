import { notFound } from "next/navigation";

import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { AdminUserEditForm } from "@/features/admin/components/admin-user-edit-form";
import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

type AdminUserEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserEditPage({ params }: AdminUserEditPageProps) {
  await requireAdminUser();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Editar usuário</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Corrija nome, e-mail ou CPF do cadastro com segurança e sem mexer no acesso do usuário.
        </p>
      </div>

      <AdminSectionNav active="usuarios" />

      <AdminUserEditForm user={user} />
    </main>
  );
}
