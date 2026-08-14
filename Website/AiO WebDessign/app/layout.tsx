import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AiO Studio — Trả lại thời gian sáng tạo cho editor",
  description:
    "Workflow suite cho Premiere Pro: quản lý asset không giới hạn, preview tức thì, dùng lại Brand Kit, tạo rough cut và transcript.",
  icons: {
    icon: "/AiO Logo 3.png",
    shortcut: "/AiO Logo 3.png",
    apple: "/AiO Logo 3.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
