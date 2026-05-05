export const supportTicketTypeOptions = [
  { value: "IMPROVEMENT", label: "Melhoria" },
  { value: "BUG", label: "Bug" },
  { value: "TALK_TO_ADMIN", label: "Falar com Admin" },
] as const;

export const supportTicketStatusOptions = [
  { value: "OPEN", label: "Aberto" },
  { value: "IN_REVIEW", label: "Em analise" },
  { value: "RESOLVED", label: "Resolvido" },
  { value: "ARCHIVED", label: "Arquivado" },
] as const;

export function getSupportTicketTypeLabel(value: string) {
  return supportTicketTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function getSupportTicketStatusLabel(value: string) {
  return supportTicketStatusOptions.find((option) => option.value === value)?.label ?? value;
}
