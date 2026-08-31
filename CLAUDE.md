# AiO Studio — ghi chu cho ca HAI MAY cua anh Tien

> File nay nam TRONG repo nen may nao pull ve cung doc duoc — khac voi ngan nho
> tu dong cua Claude (gan theo duong dan tung may, may kia khong thay).
> Lap 31/08/2026 khi thiet lap quy trinh lam viec 2 may.

## Quy trinh dong bo 2 may (chot 31/08/2026)

Anh Tien lam viec tren 2 may, dong bo qua GitHub `hadangtien0702-dot/AiO-Studio`:

| May | Repo o dau |
|---|---|
| Cong ty (DRT-G21) | `E:\2026\Production\AiO Studio` |
| Nha (user `hadan`) | `D:\Production\AiO Studio` |

**Luat:**
- Lam xong o may nao → **push** len GitHub ngay.
- Ngoi vao may kia → **pull TRUOC khi lam**: `git pull` trong thu muc repo.
- Git KHONG tu dong bo nhu Drive — quen pull la ngoi lam tren ban cu ma khong
  co canh bao gi (da xay ra: may nha dung lai o 24/08, thieu 32 commit).
- Kiem 2 may khop: `git ls-files | find /c /v ""` o ca 2 dau, so phai bang nhau.
- ⚠️ May cong ty push bi 403 do gh CLI de credential sai — dung:
  `git -c credential.helper= -c credential.helper=manager push`

## ☠️ Nhung thu CO Y khong nam tren GitHub — pull ve khong co la DUNG, khong phai loi

| Thieu | Vi sao | Can thi lam gi |
|---|---|---|
| Bo cai `.exe`/`.rar`/`.zip` trong `Release/` | 46–93 MB/ban, git phinh vinh vien | Chep USB/Drive, hoac `scripts/package-release.ps1` |
| `bin/` FFmpeg (~219 MB × 4 panel) | Binary nang | Chep tay mot lan |
| `node_modules/` | Le chung | `npm install` trong tung panel |
| `dist/` cua 5 panel CO buoc build (Asset Manager, Autocut, Power Bins, Transcripts, Shot & Save) | San pham build | `npm run build` |
| `Test Media/` (1,33 GB) | Media test | Chep tay neu can |
| `.env.local` cua Website | **Khoa bi mat — CAM push** | Chep tay rieng, khong qua git |

Rieng dist/ cua cac panel KHONG co buoc build (Auto Podcast, Re-Frames, Guide
Frame, WELCOME Page) la MA NGUON viet tay → nam TRONG git (xem .gitignore).
