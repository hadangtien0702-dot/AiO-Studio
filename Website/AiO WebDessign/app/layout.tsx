import type { Metadata } from "next";
import "./globals.css";

/* [17/08] Title/description cu la cau cua ban Gemini — anh Tien cam giu y cu */
export const metadata: Metadata = {
  title: "AiO Studio — 8 plugin AI cho Premiere Pro",
  description:
    "Cắt, phụ đề, multicam tự động — 8 plugin AI offline cho Premiere Pro · DaVinci Resolve.",
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
