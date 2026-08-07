# AiO Studio — Agent Rules (Workspace-Scoped)

> Những quy tắc này **bắt buộc áp dụng** cho mọi AI agent làm việc trong workspace
> `e:\2026\Production\AiO Studio`. Không có ngoại lệ, không phân biệt context.

---

## LUẬT BẮT BUỘC — VI PHẠM = LÀM LẠI TOÀN BỘ

### LUẬT 01 — CAM TUYET DOI DUNG EMOJI TRONG THIET KE UI

**Emoji bị cấm hoàn toàn trong:**

- File HTML của bất kỳ panel/component nào
- File CSS (content, pseudo-element)
- File JavaScript (innerHTML, textContent dùng cho UI)
- File SVG dùng làm asset

**Lý do kỹ thuật:**
- Emoji là Unicode text, render khác nhau giữa Windows / macOS / Linux
- Trên Windows Segoe UI Emoji — khi panel thu nhỏ dưới 200px, emoji bị vỡ, lệch baseline, hiển thị thành ký tự đen to phủ lên UI
- Không scale vector — bị mờ ở DPI cao hoặc khi zoom
- Không thể tô màu theo design token (không stroke, không fill, không CSS color)
- Bug thực tế: emoji tren tab BPM đã phủ đen toàn bộ màn hình panel (2026-08-07)

### LUẬT 02 — ICON PHAI LA SVG INLINE, KHONG DUNG FONT ICON / EMOJI / PNG

Tiêu chuẩn icon bắt buộc:

```html
<!-- DUNG: SVG inline -->
<svg class="ic ic-sm" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.9"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 18V5l12-2v13"/>
  <circle cx="6" cy="18" r="3"/>
</svg>

<!-- SAI: Emoji text -->
<!-- SAI: <i class="fa fa-music"></i> -->
<!-- SAI: <img src="icon.png" /> -->
```

Quy tắc SVG icon:
- viewBox="0 0 24 24" — chuẩn 24px grid (Lucide / Heroicons style)
- fill="none" — stroke-based
- stroke="currentColor" hoặc stroke="var(--acc)"
- stroke-width="1.9"
- stroke-linecap="round" stroke-linejoin="round"
- Luôn INLINE SVG vào HTML

Class chuẩn:

```css
svg.ic     { width:14px; height:14px; fill:none; stroke:var(--acc); stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }
svg.ic-sm  { width:11px; height:11px; }
svg.ic-md  { width:14px; height:14px; }
svg.ic-lg  { width:17px; height:17px; }
svg.ic.dim { stroke: var(--t3); }
svg.ic.wh  { stroke: #fff; }
```

### LUẬT 03 — ICON DONG BO MAU THEO TOKEN

| Ngữ cảnh | Token |
|---|---|
| Icon sidebar inactive | var(--t3) = #6f7185 |
| Icon sidebar active | var(--acc) = #f86820 |
| Icon tab inactive | var(--t3) |
| Icon tab active | var(--acc) |
| Icon button primary | #fff |
| Icon section heading | var(--acc) |

---

## DESIGN PRINCIPLES

### "Studio Console" — bat bien
- Panel sống cạnh timeline Premiere — tối, gọn, không tranh sáng
- Accent cam (#f86820) rất tiết chế — chỉ CTA chính, mục active, focus ring
- Người dùng là editor đang làm việc — không hero, không gradient to

### Token gốc — không override bằng số cứng
- --acc:  #f86820
- --bg-0: #090a0d
- --bg-1: #0d0e12
- --t1:   #eeeef2
- --t3:   #6f7185
- --tb-h: 44px (topbar height — KHONG SUA)

### File token
- Nguồn: design-system/tokens.css (chi sua 1 cho)
- Logo: design-system/AiO Logo/Asset 9.svg (inline SVG, fill white)
- Sau khi sua token: chay dong-bo-tokens.ps1

---

## CHECKLIST TRUOC KHI BAO XONG

- [ ] Khong co emoji trong HTML/CSS/JS
- [ ] Tat ca icon la SVG inline voi viewBox="0 0 24 24"
- [ ] Icon mau dung token (LUAT 03)
- [ ] Logo tu Asset 9.svg, inline, fill white
- [ ] Slider HTML mac dinh bi cam neu khong custom hoan toan
- [ ] Khong co font-awesome, material-icon, CDN icon font nao

---

Cap nhat: 2026-08-07
Ly do: Bug emoji phu man hinh tren tab BPM/FX Mixer
