/* 12/11 HUT MAU DUNG TUNG DIEM ANH (anh Tien: "tinh nang pick mau dang loi, pick mau chua dung").
   GOC DA DO 12/11 (man 2560x1440, 3,67 trieu diem dung yen, khong hien cua so nao):
   - Tren Windows anh "raw" cua luot chup la KHUNG VIDEO cua luong chay san (getDisplayMedia -> <video> -> canvas).
     Chromium 150 dua khung ve dang I420 (YUV 4:2:0, BT.601, dai gioi han): mau bi doi sang do sang + 2 kenh sac da
     giam nua do phan giai roi doi nguoc lai. So voi man hinh that chi 14,9 % diem giong het; mau phang lech 1-2 don vi
     (nen VS Code #21252B doc ra #1F252A o 98 % so diem), mep chu mau lech toi 97. Mau xam thi dung.
   - desktopCapturer.getSources tra dung tung diem (so voi chup GDI doc lap: 99,99-100 %) nhung mat ~400 ms va khoa
     luong chinh, nen khong dung cho phim chup. Co Chromium WebRtcAllowWgcUsingTexture: da thu, KHONG doi gi (van I420).
   CACH SUA: khi mo cong cu Hut mau, main chup MOT anh nguyen goc cua man do (man chup co setContentProtection nen khong
   lot vao), trang nay GHEP theo O 8x8: o nao hai anh "cung noi dung" thi lay diem anh nguyen goc; o nao khac (video dang
   chay, con tro chuot, vung da doi tu luc bam phim, video bi den khi co cua so phu len) thi GIU diem cua luong va danh
   dau "gan dung" (kinh hien dau ≈ truoc ma mau).
   "Cung noi dung" = do sang tung diem lech <= TY va trung binh 2 kenh sac cua o lech <= TC. Nguong lay tu so do 12/11
   tren 51.244 o dung yen that: max |dY| cua o: 99 % < 2, 99,9 % < 7, lon nhat 21; |tb dCb| 99,9 % < 4; |tb dCr| 99,9 % < 3.
   TY 8 / TC 5 nhan 99,85 % o dung yen; o bi tu choi oan chi ve "gan dung" (chieu an toan).
   Luoi o thang theo luoi 8 cua CA KHUNG (ox, oy = goc vung trong khung) vi sac mau duoc lay mau theo o 2x2 cua khung.
   Bai do: scripts/test/do-hut-mau.cjs (co doi chung). File nay chay duoc ca trong trang lan trong Node. */
;(function (g) {
  'use strict'
  var O = 8, TY = 8, TC = 5

  /* S: Uint8ClampedArray / Uint8Array RGBA (w*h*4) = diem cua luong, SUA TAI CHO.
     L: Uint8Array BGRA (w*h*4) = anh nguyen goc cung vung.
     Tra { o, ox, oy, bw, bh, khop: Uint8Array(bw*bh), soO, soKhop, soDiem, soDiemThat }. */
  function ghep(S, L, w, h, ox, oy, opt) {
    var o = (opt && opt.o) || O, ty = ((opt && opt.ty) || TY) * 256, tc = (opt && opt.tc) || TC
    ox = ox | 0; oy = oy | 0
    var bx0 = Math.floor(ox / o), by0 = Math.floor(oy / o)
    var bw = Math.floor((ox + w - 1) / o) - bx0 + 1, bh = Math.floor((oy + h - 1) / o) - by0 + 1
    var khop = new Uint8Array(bw * bh)
    var soKhop = 0, soDiemThat = 0
    for (var by = 0; by < bh; by++) {
      var y0 = Math.max(0, (by0 + by) * o - oy), y1 = Math.min(h, (by0 + by + 1) * o - oy)
      for (var bx = 0; bx < bw; bx++) {
        var x0 = Math.max(0, (bx0 + bx) * o - ox), x1 = Math.min(w, (bx0 + bx + 1) * o - ox)
        var ok = true, sCb = 0, sCr = 0, n = 0, x, y, i
        for (y = y0; y < y1 && ok; y++) {
          i = (y * w + x0) * 4
          for (x = x0; x < x1; x++, i += 4) {
            var dr = S[i] - L[i + 2], dg = S[i + 1] - L[i + 1], db = S[i + 2] - L[i]
            var dY = 77 * dr + 150 * dg + 29 * db // x256
            if (dY > ty || dY < -ty) { ok = false; break }
            sCb += db * 256 - dY; sCr += dr * 256 - dY; n++
          }
        }
        if (!ok || !n) continue
        if (Math.abs(sCb) > tc * 256 * n || Math.abs(sCr) > tc * 256 * n) continue
        for (y = y0; y < y1; y++) {
          i = (y * w + x0) * 4
          for (x = x0; x < x1; x++, i += 4) { S[i] = L[i + 2]; S[i + 1] = L[i + 1]; S[i + 2] = L[i] }
        }
        khop[by * bw + bx] = 1; soKhop++; soDiemThat += n
      }
    }
    return { o: o, ox: ox, oy: oy, w: w, h: h, bw: bw, bh: bh, khop: khop, soO: bw * bh, soKhop: soKhop, soDiem: w * h, soDiemThat: soDiemThat }
  }

  /* Diem (x, y) cua vung co phai diem anh nguyen goc khong. */
  function laThat(kq, x, y) {
    if (!kq || x < 0 || y < 0 || x >= kq.w || y >= kq.h) return false
    var bx = Math.floor((kq.ox + x) / kq.o) - Math.floor(kq.ox / kq.o), by = Math.floor((kq.oy + y) / kq.o) - Math.floor(kq.oy / kq.o)
    return kq.khop[by * kq.bw + bx] === 1
  }

  var api = { ghep: ghep, laThat: laThat, O: O, TY: TY, TC: TC }
  g.HutGhep = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof window !== 'undefined' ? window : globalThis)
