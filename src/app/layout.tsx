import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Первая группа ФИЭиГХ",
  description: "Telegram Mini App для командного квеста и конкурса.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-[#060b16] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
