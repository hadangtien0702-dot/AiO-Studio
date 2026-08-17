import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AiO Studio — Trả lại thời gian sáng tạo cho editor",
  description:
    "Workflow suite cho Premiere Pro: quản lý asset không giới hạn, preview tức thì, dùng lại Brand Kit, tạo rough cut và transcript.",
  /* [17/08] Favicon dung ban CHI CO BIEU TUONG (cat bo chu "AiO Studio" ben
     duoi) — o co 16-32px thi phan chu chi con la vet mo. */
  icons: {
    icon: "/AiO Logo Mark.png",
    shortcut: "/AiO Logo Mark.png",
    apple: "/AiO Logo Mark.png",
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
