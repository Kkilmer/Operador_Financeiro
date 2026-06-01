export const CATEGORY_COLOR_OPTIONS = [
  { label: "Verde", value: "#22C55E" },
  { label: "Azul", value: "#3B82F6" },
  { label: "Roxo", value: "#8B5CF6" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Vermelho", value: "#EF4444" },
  { label: "Amarelo", value: "#F59E0B" },
  { label: "Laranja", value: "#F97316" },
  { label: "Cinza", value: "#64748B" },
] as const;

export const CATEGORY_ICON_OPTIONS = [
  { label: "Mercado", value: "mercado" },
  { label: "Casa", value: "casa" },
  { label: "Saúde", value: "saude" },
  { label: "Transporte", value: "transporte" },
  { label: "Restaurante", value: "restaurante" },
  { label: "Lazer", value: "lazer" },
  { label: "Roupa", value: "roupa" },
  { label: "Beleza", value: "beleza" },
  { label: "Presente", value: "presente" },
  { label: "Educação", value: "educacao" },
  { label: "Assinatura", value: "assinatura" },
  { label: "Cartão", value: "cartao" },
  { label: "Dinheiro", value: "dinheiro" },
  { label: "Poupança", value: "poupanca" },
  { label: "Outros", value: "outros" },
] as const;

type CategoryIconGlyphProps = {
  icon?: string | null;
  className?: string;
};

export function getCategoryIconLabel(icon?: string | null) {
  return CATEGORY_ICON_OPTIONS.find((option) => option.value === icon)?.label ?? "Outros";
}

export function CategoryIconGlyph({ icon, className = "size-5" }: CategoryIconGlyphProps) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "mercado":
      return (
        <svg {...commonProps}>
          <path d="M4 5h2l2 10h9l2-7H8" />
          <circle cx="10" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
      );
    case "casa":
      return (
        <svg {...commonProps}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M6 10.5V20h12v-9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "saude":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
          <path d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "transporte":
      return (
        <svg {...commonProps}>
          <path d="M5 16h14l-1.5-5h-11L5 16Z" />
          <path d="M7 11l2-4h6l2 4" />
          <circle cx="8" cy="18" r="1.5" />
          <circle cx="16" cy="18" r="1.5" />
        </svg>
      );
    case "restaurante":
      return (
        <svg {...commonProps}>
          <path d="M7 4v16" />
          <path d="M4.5 4v5a2.5 2.5 0 0 0 5 0V4" />
          <path d="M17 4v16" />
          <path d="M14 9h6" />
        </svg>
      );
    case "lazer":
      return (
        <svg {...commonProps}>
          <path d="m12 4 2.3 4.8 5.2.7-3.8 3.7.9 5.2L12 16l-4.6 2.4.9-5.2-3.8-3.7 5.2-.7L12 4Z" />
        </svg>
      );
    case "roupa":
      return (
        <svg {...commonProps}>
          <path d="M9 5 5 7.5 3.5 12l3 1 1-2v8h9v-8l1 2 3-1L19 7.5 15 5" />
          <path d="M9 5a3 3 0 0 0 6 0" />
        </svg>
      );
    case "beleza":
      return (
        <svg {...commonProps}>
          <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3Z" />
          <path d="M5 16l.7 2.3L8 19l-2.3.7L5 22l-.7-2.3L2 19l2.3-.7L5 16Z" />
        </svg>
      );
    case "presente":
      return (
        <svg {...commonProps}>
          <path d="M4 10h16v10H4z" />
          <path d="M12 10v10" />
          <path d="M3 7h18v3H3z" />
          <path d="M12 7c-1.5 0-4-.5-4-2a2 2 0 0 1 4 0v2Z" />
          <path d="M12 7c1.5 0 4-.5 4-2a2 2 0 0 0-4 0v2Z" />
        </svg>
      );
    case "educacao":
      return (
        <svg {...commonProps}>
          <path d="M5 5h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H5z" />
          <path d="M19 5h-5a3 3 0 0 0-3 3" />
          <path d="M14 16h5V5" />
        </svg>
      );
    case "assinatura":
      return (
        <svg {...commonProps}>
          <path d="M7 3v4" />
          <path d="M17 3v4" />
          <path d="M4 8h16" />
          <path d="M5 5h14v15H5z" />
          <path d="M8 13h8" />
          <path d="M8 16h5" />
        </svg>
      );
    case "cartao":
      return (
        <svg {...commonProps}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      );
    case "dinheiro":
      return (
        <svg {...commonProps}>
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 10v4" />
          <path d="M18 10v4" />
        </svg>
      );
    case "poupanca":
      return (
        <svg {...commonProps}>
          <path d="M6 11a6 6 0 0 1 12 0v3a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" />
          <path d="M9 5h6" />
          <path d="M10 12h4" />
          <path d="M12 10v4" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="6" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="18" cy="12" r="1.5" />
        </svg>
      );
  }
}
