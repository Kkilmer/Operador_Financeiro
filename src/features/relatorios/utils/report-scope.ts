import {
  ReportQueryParams,
  ReportScope,
  ReportScopeType,
  ReportUserOption,
} from "@/features/relatorios/types/report.types";

type CurrentReportUser = ReportUserOption & {
  role: "ADMIN" | "USER";
};

function parseScope(value?: string): ReportScopeType {
  return value === "user" || value === "all" || value === "mine" ? value : "mine";
}

export function resolveReportScope(
  query: ReportQueryParams,
  currentUser: CurrentReportUser,
  availableUsers: ReportUserOption[] = [],
): ReportScope {
  if (currentUser.role !== "ADMIN") {
    return {
      type: "mine",
      label: "Meu relatório",
      selectedUserId: currentUser.id,
      userIdFilter: [currentUser.id],
    };
  }

  const requestedScope = parseScope(query.scope);

  if (requestedScope === "all") {
    return {
      type: "all",
      label: "Todos os usuários",
    };
  }

  if (requestedScope === "user") {
    const selectedUser = availableUsers.find((user) => user.id === query.targetUserId);

    if (selectedUser) {
      return {
        type: "user",
        label: selectedUser.name,
        selectedUserId: selectedUser.id,
        userIdFilter: [selectedUser.id],
      };
    }

    return {
      type: "mine",
      label: "Meu relatório",
      selectedUserId: currentUser.id,
      userIdFilter: [currentUser.id],
      warning: "Usuário selecionado inválido. Por segurança, geramos apenas o seu relatório.",
    };
  }

  return {
    type: "mine",
    label: "Meu relatório",
    selectedUserId: currentUser.id,
    userIdFilter: [currentUser.id],
  };
}
