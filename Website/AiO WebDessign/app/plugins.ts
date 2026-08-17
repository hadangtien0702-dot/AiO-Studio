/* [17/08] NGUON DUY NHAT ve 8 plugin — page.tsx (card Pro) va PluginLab.tsx
   (section demo tuong tac) cung doc tu day. Them/sua tool o DAY, moi cho tu
   cap nhat. Cot `so`: loi thuong de hieu (y anh Tien), con so la so da do.
   Hai cau `mota` anh Tien tu doc 17/08 ("ngu dong", "1 cham") — go phai hoi. */
import {
  Box,
  Captions,
  Frame,
  Layers3,
  MonitorPlay,
  Scissors,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type PluginId =
  | "autocut"
  | "podcast"
  | "transcripts"
  | "reframes"
  | "assets"
  | "powerbins"
  | "guideframe"
  | "cutshort";

export type Plugin = {
  id: PluginId;
  icon: LucideIcon;
  ten: string;
  mota: string;
  so: string;
  nhan?: "FREE" | "SẮP CÓ";
};

export const PLUGINS: Plugin[] = [
  { id: "autocut", icon: Scissors, ten: "Auto Cut", mota: "Tự tìm khoảng lặng và xoá khỏi timeline.", so: "cắt video 6 phút trong 23 giây" },
  { id: "podcast", icon: Video, ten: "Auto Podcast", mota: "Tự chuyển cam theo người đang nói.", so: "đúng 588/588 lần chuyển cam" },
  { id: "transcripts", icon: Captions, ten: "Auto Transcripts", mota: "1 chạm tạo phụ đề.", so: "1 giờ audio xong trong 2,4 phút" },
  { id: "reframes", icon: MonitorPlay, ten: "Auto Re-Frames", mota: "Tự đổi video ngang thành dọc 9:16, AI giữ chủ thể.", so: "tạo bản dọc trong 0,2 giây" },
  { id: "assets", icon: Layers3, ten: "Asset Manager", mota: "Kéo hàng ngàn asset đang ngủ đông trong folder sống lại.", so: "28.000+ file, xem ngay không chờ", nhan: "FREE" },
  { id: "powerbins", icon: Box, ten: "Power Bins", mota: "Giữ logo, intro sẵn sàng trong mọi project.", so: "cài 1 lần, dùng mọi project" },
  { id: "guideframe", icon: Frame, ten: "Guide Frame", mota: "Hiện khung an toàn của từng nền tảng lên sequence.", so: "TikTok, Reels… 10 nền tảng" },
  { id: "cutshort", icon: Zap, ten: "Auto Cut Short", mota: "Tự tách video dài thành clip 60 giây.", so: "sắp ra mắt", nhan: "SẮP CÓ" },
];
