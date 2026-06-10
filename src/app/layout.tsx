import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/pwa/pwa-register";

import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Operador Financeiro",
  title: "Operador Financeiro",
  description: "Controle simples para o seu dia a dia financeiro.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Operador Financeiro",
  },
  icons: {
    icon: [
      { url: "/icons/pwa-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/pwa-icon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <PwaRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
