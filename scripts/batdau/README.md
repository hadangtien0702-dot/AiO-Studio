# `batdau.mjs` — CỬA VÀO của brain

> Lập 21/09/2026. Đối xứng với `/xong` (cửa RA).

## Vì sao có nó — số đo ngày 21/09/2026

Mở Claude ở một panel con (ví dụ `AiO Transcripts`), context nạp sẵn **trước khi
anh Tiến gõ chữ đầu tiên**:

| Nạp tự động | Token | Là loại gì |
|---|---:|---|
| `~/.claude/CLAUDE.md` | 19.978 (52%) | 68 bài học **sửa code** |
| `AiO Transcripts/CLAUDE.md` | 8.565 | luật panel |
| `AiO Studio/CLAUDE.md` | 7.894 | bản đồ + quyết định |
| `Production/CLAUDE.md` | 1.159 | bản đồ |
| `MEMORY.md` | 488 | 6 dòng trỏ đường |
| **Tổng** | **38.084** | |

Nhưng `PROGRESS.md` — nơi chứa **trạng thái thật** (Autocut 4.326 dòng,
Transcripts 4.531 dòng) — **không bao giờ được nạp**. Claude Code chỉ tự đọc file
tên đúng `CLAUDE.md` đi theo cây thư mục; `PROGRESS.md` không nằm trong cơ chế đó.

→ Brain có **cửa RA** rất tốt (`/xong` ghi đầy đủ) mà **không có cửa VÀO**: phiên
sau không ai mở cái đã ghi ra đọc. Đó là gốc của *"context chán lắm em"*.

## Nó đọc gì

1. **Mục mới nhất của `PROGRESS.md`** (cắt tối đa 40 dòng) — dò ngược tối đa 6 tầng
   thư mục. Đo 21/09: PROGRESS.md **tươi hơn code ở 11/11 panel** (hook `Stop` giữ
   được), nên đáng tin.
2. **`git status`** — tách riêng *thư mục đang đứng* với *phần còn lại của repo*.
   Anh Tiến ít commit nên `git log` **không** phản ánh việc thật.
3. **Việc đang CHỜ** của đúng app đó, lấy từ bảng trong `CLAUDE.md` gần nhất.

Không tìm thấy gì thì **im lặng thoát 0** (giống hook `Stop`).

## Ba cái bẫy đã vấp khi viết nó — đừng lặp lại

| Bẫy | Sự thật | Bài |
|---|---|---|
| Regex `/Vi[eê]c đang CHỜ/` để bắt tiêu đề | **"ệ" = ê + dấu nặng**, một ký tự khác, không nằm trong `[eê]` → thước mù với chính chữ "Việc". Sửa: bỏ dấu bằng NFD rồi so khớp | `5as` |
| `git status --porcelain` | **Luôn** trả đường dẫn tính từ GỐC REPO, không phải từ chỗ đang đứng → đứng ở Autocut mà thấy file `Release/` | — |
| Khớp app bằng `includes` | `"autocutshort".includes("autocut")` = đúng → **Autocut nuốt việc của Auto Cut Short**. Sửa: chỉ khớp CHÍNH XÁC, tên viết tắt ghi tường minh ở `BIET_DANH` | `5ae` · `5t` |

## Số đo sau khi xong (21/09/2026)

- Chạy **259 ms**, ra **850–3.744 ký tự** (~243–1.070 token) tuỳ panel.
- Đối chứng: thư mục không có gì → **0 byte**.
- Đối chứng: việc *"Cài thử máy sạch"* (ô ghi 3 app) hiện ở **đúng 3/3 app**.

## Lắp ở đâu

| Thứ | Bản gốc | Bản chép |
|---|---|---|
| Script | `scripts/batdau/batdau.mjs` (repo) | `~/.claude/scripts/batdau.mjs` |
| Lệnh `/batdau` | `.claude/commands/batdau.md` (repo) | `~/.claude/commands/batdau.md` |
| Hook `SessionStart` | — | `~/.claude/settings.json` |

`dong-bo-may.ps1` bước 4 chép hai bản đầu và **cảnh báo nếu máy đó chưa có hook**.
☠️ Sửa bản trong repo, **đừng sửa bản `~/.claude`** — sẽ bị ghi đè.

Hook trong `~/.claude/settings.json`:

```json
"SessionStart": [
  {
    "matcher": "startup|resume|clear",
    "hooks": [
      {
        "type": "command",
        "command": "node \"$HOME/.claude/scripts/batdau.mjs\" 2>/dev/null || true",
        "timeout": 10,
        "statusMessage": "Doc trang thai du an..."
      }
    ]
  }
]
```

## Việc còn CHỜ

- **Thinksmart Tool không có `PROGRESS.md`** (đo 21/09) → mở Claude ở đó vẫn vào
  với trí nhớ trắng. Hook `Stop` không bắt được vì nó chỉ canh `src, client/src,
  app, lib, host, scripts, server` — Thinksmart dùng `public/`.
- Thêm app mới vào bảng mục 8 của `CLAUDE.md` thì **kiểm lại `BIET_DANH`** trong
  script (bảng gọi tên ngắn, thư mục đặt tên dài).
