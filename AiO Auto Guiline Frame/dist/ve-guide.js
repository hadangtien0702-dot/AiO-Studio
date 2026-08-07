/* ve-guide.js — bo ve guideline DUNG CHUNG cho panel (dist/index.html) va ban
   xem truoc (xem-truoc-safe-zones.html). MOT nguon ve duy nhat: sua o day,
   hai noi cung doi theo (quy tac 21 — khong chep tay hai ban).

   API:
     VeGuide.tinhVungPx(fmt, W, H)  -> [{canh,x,y,w,h,pt,px,loai,trangThai,ui}]
     VeGuide.ve(ctx, W, H, fmt, lang, opts) -> ve vao ctx (0,0,W,H)
        opts: { nhan: true|false — nhan %/px tren tung canh, CHI bat o ban
                                   xem truoc noi bo, khong bat trong panel }
        (opts.tag da bo 06/08/2026 — anh Tien khong muon chu trong anh guide)
   Ham tinhVungPx la HAM THUAN — dung de do kiem tu dong, khong dung DOM. */
(function () {
  'use strict';

  var MAU = {
    ui:   { to: 'rgba(255,95,109,0.26)',  vien: 'rgba(255,95,109,0.95)' },
    crop: { to: 'rgba(232,192,90,0.20)',  vien: 'rgba(232,192,90,0.95)' },
    khuyen_nghi: { to: 'rgba(0,0,0,0)',   vien: 'rgba(255,255,255,0.55)' },
    safeUi:   'rgba(64,220,255,0.95)',
    safeCrop: 'rgba(232,192,90,0.85)',
    chu: 'rgba(255,255,255,0.92)',
    chuVien: 'rgba(0,0,0,0.75)'
  };

  /** Vung -> hinh chu nhat pixel tren khung W x H. Ham thuan de do kiem. */
  function tinhVungPx(fmt, W, H) {
    var ra = [];
    for (var i = 0; i < fmt.vung.length; i++) {
      var v = fmt.vung[i];
      var r = { canh: v.canh, pt: v.pt, loai: v.loai, trangThai: v.trangThai, ui: v.ui };
      if (v.canh === 'top')    { r.x = 0; r.y = 0; r.w = W; r.h = H * v.pt / 100; }
      if (v.canh === 'bottom') { r.h = H * v.pt / 100; r.x = 0; r.y = H - r.h; r.w = W; }
      if (v.canh === 'left')   { r.x = 0; r.y = 0; r.w = W * v.pt / 100; r.h = H; }
      if (v.canh === 'right')  { r.w = W * v.pt / 100; r.x = W - r.w; r.y = 0; r.h = H; }
      r.px = Math.round((v.canh === 'left' || v.canh === 'right') ? r.w : r.h);
      ra.push(r);
    }
    return ra;
  }

  /** Khung an toan con lai sau khi tru cac vung thuoc "loai" cho truoc. */
  function khungAnToan(fmt, W, H, loai) {
    var t = 0, b = 0, l = 0, r = 0, co = false;
    for (var i = 0; i < fmt.vung.length; i++) {
      var v = fmt.vung[i];
      if (v.loai !== loai) continue;
      co = true;
      if (v.canh === 'top') t = Math.max(t, H * v.pt / 100);
      if (v.canh === 'bottom') b = Math.max(b, H * v.pt / 100);
      if (v.canh === 'left') l = Math.max(l, W * v.pt / 100);
      if (v.canh === 'right') r = Math.max(r, W * v.pt / 100);
    }
    if (!co) return null;
    return { x: l, y: t, w: W - l - r, h: H - t - b };
  }

  function veHatch(ctx, r, mau, dobuoc) {
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    ctx.strokeStyle = mau; ctx.lineWidth = Math.max(1, dobuoc / 14);
    for (var x = r.x - r.h; x < r.x + r.w; x += dobuoc) {
      ctx.beginPath();
      ctx.moveTo(x, r.y + r.h);
      ctx.lineTo(x + r.h, r.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function veChu(ctx, chu, x, y, co, canLe) {
    ctx.save();
    ctx.font = '600 ' + co + 'px "SF Pro Text", "Segoe UI", sans-serif';
    ctx.textAlign = canLe || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, co / 5);
    ctx.strokeStyle = MAU.chuVien;
    ctx.strokeText(chu, x, y);
    ctx.fillStyle = MAU.chu;
    ctx.fillText(chu, x, y);
    ctx.restore();
  }

  function ve(ctx, W, H, fmt, lang, opts) {
    opts = opts || {};
    var vungs = tinhVungPx(fmt, W, H);
    var co = Math.max(11, Math.round(W / 1080 * 26)); // co chu ti le theo be rong
    var pad = co * 0.6;
    var i, r;

    // 1) To nen tung vung
    for (i = 0; i < vungs.length; i++) {
      r = vungs[i];
      if (r.loai === 'ui') { ctx.fillStyle = MAU.ui.to; ctx.fillRect(r.x, r.y, r.w, r.h); }
      if (r.loai === 'crop') { veHatch(ctx, r, MAU.crop.to.replace('0.20', '0.65'), co * 1.2); }
    }

    // 2) Vach ranh phia TRONG cua tung vung
    for (i = 0; i < vungs.length; i++) {
      r = vungs[i];
      var m = MAU[r.loai];
      ctx.save();
      ctx.strokeStyle = m.vien;
      ctx.lineWidth = Math.max(1.5, W / 1080 * 2);
      if (r.loai === 'khuyen_nghi' || r.loai === 'crop') ctx.setLineDash([co * 0.7, co * 0.5]);
      ctx.beginPath();
      if (r.canh === 'top') { ctx.moveTo(0, r.h); ctx.lineTo(W, r.h); }
      if (r.canh === 'bottom') { ctx.moveTo(0, r.y); ctx.lineTo(W, r.y); }
      if (r.canh === 'left') { ctx.moveTo(r.w, 0); ctx.lineTo(r.w, H); }
      if (r.canh === 'right') { ctx.moveTo(r.x, 0); ctx.lineTo(r.x, H); }
      ctx.stroke();
      ctx.restore();
    }

    // 2b) UI THAT cua app (icon, avatar, caption...) — mac dinh BAT, tat bang opts.uiThat === false
    if (opts.uiThat !== false) veUiThat(ctx, W, H, fmt);

    // 3) Khung an toan: xanh cyan (ngoai vung UI), vang dut (ngoai vung crop)
    var sUi = khungAnToan(fmt, W, H, 'ui');
    if (sUi) {
      ctx.save();
      ctx.strokeStyle = MAU.safeUi; ctx.lineWidth = Math.max(1.5, W / 1080 * 2.5);
      ctx.strokeRect(sUi.x, sUi.y, sUi.w, sUi.h);
      ctx.restore();
    }
    var sCrop = khungAnToan(fmt, W, H, 'crop');
    if (sCrop) {
      ctx.save();
      ctx.strokeStyle = MAU.safeCrop; ctx.lineWidth = Math.max(1.5, W / 1080 * 2);
      ctx.setLineDash([co, co * 0.7]);
      ctx.strokeRect(sCrop.x, sCrop.y, sCrop.w, sCrop.h);
      ctx.restore();
    }

    // 4) Nhan so %·px — CHI cho ban duyet noi bo (opts.nhan). Panel nguoi dung
    //    KHONG hien: anh Tien 02/08 — "nhin vao khong hieu con so do la gi".
    if (opts.nhan) {
      for (i = 0; i < vungs.length; i++) {
        r = vungs[i];
        var nhan = r.pt + '% · ' + r.px + 'px';
        if (r.canh === 'top') veChu(ctx, nhan, W / 2, r.h + pad + co / 2, co);
        if (r.canh === 'bottom') veChu(ctx, nhan, W / 2, r.y - pad - co / 2, co);
        if (r.canh === 'left') veChu(ctx, nhan, r.w + pad, H * 0.42, co, 'left');
        if (r.canh === 'right') veChu(ctx, nhan, r.x - pad, H * 0.52, co, 'right');
      }
    }

    /* ☠️ Nhan "LOP GUIDE — TAT TRUOC KHI XUAT VIDEO" DA GO BO 06/08/2026 theo
       yeu cau anh Tien ("text nay anh khong can"). Truoc do da doi cho no 1 lan
       (tu mep vung an toan xuong sat day khung) vi no de len mat nhan vat.
       -> Nay anh guide KHONG con chu nhac nho nao. Nguoi dung tu nho tat lop
       guide truoc khi xuat. */
  }

  /* ── UI THẬT của từng nền tảng (yêu cầu anh Tiến 02/08) ───────────────
     Vẽ mô phỏng element thật: cột icon, avatar, caption, nút CTA… bằng
     vector canvas — không ảnh ngoài, tự co theo kích thước khung.
     Vị trí element là MINH HOẠ nằm BÊN TRONG vùng số liệu đã kiểm chứng
     (safe-zones.json vẫn là nguồn chân lý của các ĐƯỜNG RANH). */

  var TRANG = 'rgba(255,255,255,0.92)';
  var TRANG_MO = 'rgba(255,255,255,0.6)';

  function bongDo(ctx, s) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = s * 6; }

  function veTron(ctx, x, y, r, fill, stroke, dayVien) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = dayVien || 2; ctx.stroke(); }
  }
  function vePill(ctx, x, y, w, h, fill, stroke) {
    var r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + r, y + h); ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function veTim(ctx, x, y, s, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.32);
    ctx.bezierCurveTo(x, y - s * 0.12, x - s * 0.62, y - s * 0.12, x - s * 0.62, y + s * 0.22);
    ctx.bezierCurveTo(x - s * 0.62, y + s * 0.52, x - s * 0.2, y + s * 0.72, x, y + s * 0.92);
    ctx.bezierCurveTo(x + s * 0.2, y + s * 0.72, x + s * 0.62, y + s * 0.52, x + s * 0.62, y + s * 0.22);
    ctx.bezierCurveTo(x + s * 0.62, y - s * 0.12, x, y - s * 0.12, x, y + s * 0.32);
    ctx.fillStyle = fill || TRANG; ctx.fill();
  }
  function veBinhLuan(ctx, x, y, s) {
    ctx.beginPath(); ctx.arc(x, y + s * 0.3, s * 0.58, Math.PI * 0.85, Math.PI * 0.62, false);
    ctx.lineTo(x - s * 0.5, y + s * 1.05); ctx.closePath();
    ctx.fillStyle = TRANG; ctx.fill();
  }
  function veChiaSe(ctx, x, y, s) { // mui ten share cong
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, y + s * 0.85);
    ctx.quadraticCurveTo(x - s * 0.45, y + s * 0.15, x + s * 0.12, y + s * 0.1);
    ctx.lineTo(x + s * 0.12, y - s * 0.25);
    ctx.lineTo(x + s * 0.65, y + s * 0.28);
    ctx.lineTo(x + s * 0.12, y + s * 0.8);
    ctx.lineTo(x + s * 0.12, y + s * 0.45);
    ctx.quadraticCurveTo(x - s * 0.28, y + s * 0.45, x - s * 0.5, y + s * 0.85);
    ctx.fillStyle = TRANG; ctx.fill();
  }
  function veLuuDau(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.38, y - s * 0.05);
    ctx.lineTo(x + s * 0.38, y - s * 0.05);
    ctx.lineTo(x + s * 0.38, y + s * 0.9);
    ctx.lineTo(x, y + s * 0.6);
    ctx.lineTo(x - s * 0.38, y + s * 0.9);
    ctx.closePath();
    ctx.fillStyle = TRANG; ctx.fill();
  }
  function veKinhLup(ctx, x, y, s) {
    ctx.strokeStyle = TRANG; ctx.lineWidth = s * 0.16;
    ctx.beginPath(); ctx.arc(x - s * 0.1, y - s * 0.1, s * 0.42, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * 0.22, y + s * 0.22); ctx.lineTo(x + s * 0.55, y + s * 0.55); ctx.stroke();
  }
  function veBaCham(ctx, x, y, s, doc) {
    for (var i = -1; i <= 1; i++) veTron(ctx, doc ? x : x + i * s * 0.42, doc ? y + i * s * 0.42 : y, s * 0.11, TRANG);
  }
  function veDiaNhac(ctx, x, y, s) {
    veTron(ctx, x, y, s * 0.55, 'rgba(30,30,30,0.85)', TRANG, s * 0.1);
    veTron(ctx, x, y, s * 0.2, TRANG);
  }
  function veNotNhac(ctx, x, y, s) {
    ctx.strokeStyle = TRANG; ctx.lineWidth = s * 0.14;
    ctx.beginPath(); ctx.moveTo(x + s * 0.25, y - s * 0.4); ctx.lineTo(x + s * 0.25, y + s * 0.3); ctx.stroke();
    veTron(ctx, x + s * 0.12, y + s * 0.34, s * 0.16, TRANG);
  }
  function veAvatar(ctx, x, y, r, themCong) {
    veTron(ctx, x, y, r, 'rgba(160,160,168,0.9)', TRANG, r * 0.14);
    veTron(ctx, x, y - r * 0.25, r * 0.34, 'rgba(90,90,96,0.9)');
    ctx.beginPath(); ctx.arc(x, y + r * 0.75, r * 0.62, Math.PI * 1.15, Math.PI * 1.85); ctx.fillStyle = 'rgba(90,90,96,0.9)'; ctx.fill();
    if (themCong) { // huy hieu + do (follow) duoi avatar kieu TikTok
      veTron(ctx, x, y + r * 1.35, r * 0.42, '#ff2b54');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.14;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.2, y + r * 1.35); ctx.lineTo(x + r * 0.2, y + r * 1.35);
      ctx.moveTo(x, y + r * 1.15); ctx.lineTo(x, y + r * 1.55);
      ctx.stroke();
    }
  }
  function veDongMo(ctx, x, y, w, h) { // dong chu "ma" (ghost line)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, h / 2); } else { ctx.rect(x, y, w, h); }
    ctx.fill();
  }
  function chuUi(ctx, chu, x, y, co, dam, canLe, mau) {
    ctx.save();
    bongDo(ctx, co / 14);
    ctx.font = (dam ? '700 ' : '500 ') + co + 'px "SF Pro Text", "Segoe UI", sans-serif';
    ctx.textAlign = canLe || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = mau || TRANG;
    ctx.fillText(chu, x, y);
    ctx.restore();
  }
  function nhanDuoiIcon(ctx, chu, x, y, s) { chuUi(ctx, chu, x, y, s * 0.42, false, 'center'); }

  /* Cot icon ben phai — dung chung, tuy bien theo app */
  function veCotPhai(ctx, W, H, s, tamX, dsIcon) {
    var y = H * 0.46;
    var buoc = s * 2.35;
    for (var i = 0; i < dsIcon.length; i++) {
      var ic = dsIcon[i];
      ctx.save(); bongDo(ctx, s * 0.1);
      if (ic[0] === 'avatar') { veAvatar(ctx, tamX, y, s * 0.8, true); y += s * 0.9; }
      else {
        if (ic[0] === 'tim') veTim(ctx, tamX, y - s * 0.45, s);
        if (ic[0] === 'binhluan') veBinhLuan(ctx, tamX, y - s * 0.55, s);
        if (ic[0] === 'chiase') veChiaSe(ctx, tamX, y - s * 0.35, s);
        if (ic[0] === 'luudau') veLuuDau(ctx, tamX, y - s * 0.45, s);
        if (ic[0] === 'bacham') veBaCham(ctx, tamX, y, s, false);
        if (ic[0] === 'lap') { // remix/repost hai mui ten
          ctx.strokeStyle = TRANG; ctx.lineWidth = s * 0.14;
          ctx.strokeRect(tamX - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8);
        }
      }
      ctx.restore();
      if (ic[1]) nhanDuoiIcon(ctx, ic[1], tamX, y + s * 0.95, s);
      y += buoc;
    }
  }

  /* Goc duoi-trai: ten kenh + caption ma + nhac — dung chung */
  function veGocTrai(ctx, W, H, s, yBat, coPillNhac) {
    chuUi(ctx, '@username', W * 0.045, yBat, s * 0.62, true);
    veDongMo(ctx, W * 0.045, yBat + s * 0.35, W * 0.52, s * 0.34);
    veDongMo(ctx, W * 0.045, yBat + s * 0.95, W * 0.38, s * 0.34);
    if (coPillNhac) {
      ctx.save(); bongDo(ctx, s * 0.08);
      veNotNhac(ctx, W * 0.055, yBat + s * 1.9, s * 0.8);
      veDongMo(ctx, W * 0.045 + s * 0.7, yBat + s * 1.72, W * 0.3, s * 0.3);
      ctx.restore();
    }
  }

  var UI_THAT = {
    tiktok: function (ctx, W, H, s) {
      // Top: tabs + kinh lup
      chuUi(ctx, 'Following', W * 0.32, H * 0.045, s * 0.6, false, 'center', TRANG_MO);
      chuUi(ctx, 'For You', W * 0.58, H * 0.045, s * 0.6, true, 'center');
      ctx.fillStyle = TRANG; ctx.fillRect(W * 0.58 - s * 0.8, H * 0.052, s * 1.6, s * 0.1);
      ctx.save(); bongDo(ctx, s * 0.1); veKinhLup(ctx, W * 0.92, H * 0.04, s * 0.9); ctx.restore();
      // Cot phai + dia nhac
      veCotPhai(ctx, W, H, s, W - (140 / 1080) * W / 2, [
        ['avatar'], ['tim', '328K'], ['binhluan', '1.2K'], ['luudau', '45K'], ['chiase', 'Share']
      ]);
      ctx.save(); bongDo(ctx, s * 0.1); veDiaNhac(ctx, W - (140 / 1080) * W / 2, H * 0.71, s * 1.1); ctx.restore();
      veGocTrai(ctx, W, H, s, H * 0.80, true);
    },
    reels: function (ctx, W, H, s) {
      veCotPhai(ctx, W, H, s, W - s * 1.3, [
        ['tim', '96K'], ['binhluan', '843'], ['chiase', ''], ['luudau', ''], ['bacham', '']
      ]);
      // avatar + follow pill goc trai
      var yA = H * 0.755;
      ctx.save(); bongDo(ctx, s * 0.08);
      veAvatar(ctx, W * 0.075, yA, s * 0.62, false);
      chuUi(ctx, '@username', W * 0.075 + s * 0.95, yA + s * 0.2, s * 0.55, true);
      vePill(ctx, W * 0.075 + s * 5.6, yA - s * 0.42, s * 2.6, s * 0.85, null, TRANG);
      chuUi(ctx, 'Follow', W * 0.075 + s * 6.9, yA + s * 0.18, s * 0.48, false, 'center');
      ctx.restore();
      veDongMo(ctx, W * 0.045, yA + s * 1.0, W * 0.5, s * 0.32);
      // pill nhac
      ctx.save(); bongDo(ctx, s * 0.08);
      veNotNhac(ctx, W * 0.06, yA + s * 2.0, s * 0.75);
      veDongMo(ctx, W * 0.045 + s * 0.65, yA + s * 1.82, W * 0.28, s * 0.3);
      ctx.restore();
    },
    stories: function (ctx, W, H, s) {
      // top: 4 doan progress + avatar + ten + X
      var wD = (W - W * 0.08 - s * 0.6) / 4;
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = i === 0 ? TRANG : 'rgba(255,255,255,0.35)';
        ctx.fillRect(W * 0.04 + i * (wD + s * 0.2), H * 0.022, wD, s * 0.14);
      }
      ctx.save(); bongDo(ctx, s * 0.08);
      veAvatar(ctx, W * 0.075, H * 0.062, s * 0.6, false);
      chuUi(ctx, '@username', W * 0.075 + s * 0.9, H * 0.068, s * 0.52, true);
      chuUi(ctx, '2h', W * 0.075 + s * 4.6, H * 0.068, s * 0.5, false, 'left', TRANG_MO);
      ctx.strokeStyle = TRANG; ctx.lineWidth = s * 0.14;
      ctx.beginPath();
      ctx.moveTo(W * 0.93 - s * 0.35, H * 0.055 - s * 0.35); ctx.lineTo(W * 0.93 + s * 0.35, H * 0.055 + s * 0.35);
      ctx.moveTo(W * 0.93 + s * 0.35, H * 0.055 - s * 0.35); ctx.lineTo(W * 0.93 - s * 0.35, H * 0.055 + s * 0.35);
      ctx.stroke();
      ctx.restore();
      // bottom: thanh tra loi + tim + chia se
      ctx.save(); bongDo(ctx, s * 0.08);
      vePill(ctx, W * 0.045, H * 0.925, W * 0.66, s * 1.15, null, TRANG_MO);
      chuUi(ctx, 'Send message', W * 0.075, H * 0.925 + s * 0.78, s * 0.5, false, 'left', TRANG_MO);
      veTim(ctx, W * 0.8, H * 0.925 + s * 0.1, s * 0.9);
      veChiaSe(ctx, W * 0.92, H * 0.925 + s * 0.2, s * 0.9);
      ctx.restore();
    },
    shorts: function (ctx, W, H, s) {
      ctx.save(); bongDo(ctx, s * 0.1);
      veKinhLup(ctx, W * 0.86, H * 0.045, s * 0.85);
      veBaCham(ctx, W * 0.94, H * 0.042, s * 0.8, true);
      ctx.restore();
      veCotPhai(ctx, W, H, s, W - (108 / 1080) * W / 2 - s * 0.2, [
        ['tim', '305K'], ['binhluan', '1.4K'], ['chiase', 'Share'], ['lap', 'Remix'], ['avatar']
      ]);
      // duoi: kenh + Subscribe + tieu de + nhac
      var yK = H * 0.815;
      ctx.save(); bongDo(ctx, s * 0.08);
      veAvatar(ctx, W * 0.07, yK, s * 0.55, false);
      chuUi(ctx, '@channel', W * 0.07 + s * 0.85, yK + s * 0.18, s * 0.5, true);
      vePill(ctx, W * 0.07 + s * 4.6, yK - s * 0.5, s * 3.4, s * 1.0, TRANG);
      chuUi(ctx, 'Subscribe', W * 0.07 + s * 6.3, yK + s * 0.16, s * 0.48, true, 'center', 'rgba(15,15,15,0.95)');
      ctx.restore();
      veDongMo(ctx, W * 0.045, yK + s * 1.05, W * 0.55, s * 0.34);
      veDongMo(ctx, W * 0.045, yK + s * 1.65, W * 0.4, s * 0.3);
      // progress bar sat day
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, H - s * 0.16, W, s * 0.16);
      ctx.fillStyle = '#f03'; ctx.fillRect(0, H - s * 0.16, W * 0.4, s * 0.16);
    },
    snap: function (ctx, W, H, s) {
      ctx.save(); bongDo(ctx, s * 0.08);
      veAvatar(ctx, W * 0.075, H * 0.045, s * 0.62, false);
      chuUi(ctx, 'Brand Name', W * 0.075 + s * 0.95, H * 0.04, s * 0.55, true);
      chuUi(ctx, 'Sponsored', W * 0.075 + s * 0.95, H * 0.04 + s * 0.65, s * 0.45, false, 'left', TRANG_MO);
      ctx.restore();
      vePill(ctx, W * 0.28, H * 0.895, W * 0.44, s * 1.35, 'rgba(255,252,0,0.95)');
      chuUi(ctx, 'More', W * 0.5, H * 0.895 + s * 0.9, s * 0.55, true, 'center', 'rgba(15,15,15,0.95)');
    },
    pinterest: function (ctx, W, H, s) {
      ctx.save(); bongDo(ctx, s * 0.1);
      ctx.strokeStyle = TRANG; ctx.lineWidth = s * 0.16; // mui ten back
      ctx.beginPath(); ctx.moveTo(W * 0.075, H * 0.04); ctx.lineTo(W * 0.045, H * 0.055); ctx.lineTo(W * 0.075, H * 0.07); ctx.stroke();
      veBaCham(ctx, W * 0.5, H * 0.055, s * 0.9, false); // cham trang
      veBaCham(ctx, W * 0.95, H * 0.055, s * 0.8, true);
      ctx.restore();
      veCotPhai(ctx, W, H, s, W - (195 / 1080) * W / 2, [['tim', '4.2K'], ['binhluan', '86'], ['chiase', '']]);
      var yB = H * 0.815;
      ctx.save(); bongDo(ctx, s * 0.08);
      veAvatar(ctx, W * 0.07, yB, s * 0.6, false);
      chuUi(ctx, 'Creator name', W * 0.07 + s * 0.9, yB + s * 0.18, s * 0.52, true);
      veDongMo(ctx, W * 0.045, yB + s * 0.85, W * 0.45, s * 0.32);
      vePill(ctx, W * 0.6, H * 0.9, s * 3.2, s * 1.2, '#e60023');
      chuUi(ctx, 'Save', W * 0.6 + s * 1.6, H * 0.9 + s * 0.8, s * 0.52, true, 'center');
      ctx.restore();
    },
    linkedin: function (ctx, W, H, s) {
      veCotPhai(ctx, W, H, s, W - (120 / 1080) * W / 2, [['tim', '241'], ['binhluan', '18'], ['lap', ''], ['chiase', '']]);
      var yB = H * 0.845;
      ctx.save(); bongDo(ctx, s * 0.08);
      veAvatar(ctx, W * 0.07, yB, s * 0.6, false);
      chuUi(ctx, 'Full Name', W * 0.07 + s * 0.9, yB + s * 0.05, s * 0.52, true);
      chuUi(ctx, 'Headline role', W * 0.07 + s * 0.9, yB + s * 0.62, s * 0.42, false, 'left', TRANG_MO);
      ctx.restore();
      veDongMo(ctx, W * 0.045, yB + s * 1.2, W * 0.55, s * 0.32);
    },
    x: function (ctx, W, H, s) {
      veCotPhai(ctx, W, H, s, W - (140 / 1080) * W / 2, [['tim', '2.1K'], ['lap', '408'], ['binhluan', '96'], ['luudau', ''], ['chiase', '']]);
      var yB = H * 0.85;
      ctx.save(); bongDo(ctx, s * 0.08);
      veAvatar(ctx, W * 0.07, yB, s * 0.55, false);
      chuUi(ctx, '@handle', W * 0.07 + s * 0.85, yB + s * 0.18, s * 0.52, true);
      ctx.restore();
      veDongMo(ctx, W * 0.045, yB + s * 0.8, W * 0.6, s * 0.32);
      veDongMo(ctx, W * 0.045, yB + s * 1.35, W * 0.42, s * 0.3);
    },
    zalo: function (ctx, W, H, s) {
      veCotPhai(ctx, W, H, s, W - (130 / 1080) * W / 2, [['tim', '1.5K'], ['binhluan', '210'], ['chiase', '']]);
      veGocTrai(ctx, W, H, s, H * 0.84, false);
    },
    ytplayer: function (ctx, W, H, s) {
      var yB = H - s * 1.9;
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(W * 0.02, yB, W * 0.96, s * 0.14);
      ctx.fillStyle = '#f03'; ctx.fillRect(W * 0.02, yB, W * 0.35, s * 0.14);
      veTron(ctx, W * 0.02 + W * 0.35, yB + s * 0.07, s * 0.3, '#f03');
      ctx.save(); bongDo(ctx, s * 0.08);
      ctx.fillStyle = TRANG; // nut play
      ctx.beginPath(); ctx.moveTo(W * 0.035, yB + s * 0.5); ctx.lineTo(W * 0.035, yB + s * 1.4); ctx.lineTo(W * 0.062 * 1.0, yB + s * 0.95); ctx.closePath(); ctx.fill();
      chuUi(ctx, '3:24 / 9:41', W * 0.085, yB + s * 1.25, s * 0.5);
      veBaCham(ctx, W * 0.93, yB + s * 0.95, s * 0.7, false); // gear/cc/fullscreen gian luoc
      ctx.strokeStyle = TRANG; ctx.lineWidth = s * 0.12;
      ctx.strokeRect(W * 0.955, yB + s * 0.6, s * 0.7, s * 0.7);
      // watermark kenh (goc duoi-phai, tren thanh dieu khien)
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(200,200,200,0.8)';
      ctx.fillRect(W * 0.945, yB - s * 1.3, s * 1.0, s * 1.0);
      ctx.globalAlpha = 1;
      ctx.restore();
    },
    fbfeed: function (ctx, W, H, s) {
      ctx.save(); bongDo(ctx, s * 0.1);
      veTron(ctx, W * 0.93, H * 0.945, s * 0.85, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = TRANG; // loa gian luoc
      ctx.beginPath();
      ctx.moveTo(W * 0.93 - s * 0.35, H * 0.945 - s * 0.12); ctx.lineTo(W * 0.93 - s * 0.12, H * 0.945 - s * 0.12);
      ctx.lineTo(W * 0.93 + s * 0.15, H * 0.945 - s * 0.35); ctx.lineTo(W * 0.93 + s * 0.15, H * 0.945 + s * 0.35);
      ctx.lineTo(W * 0.93 - s * 0.12, H * 0.945 + s * 0.12); ctx.lineTo(W * 0.93 - s * 0.35, H * 0.945 + s * 0.12);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  };

  var UI_THAT_MAP = {
    'tiktok-video': 'tiktok',
    'ig-reels': 'reels', 'ig-reels-organic': 'reels', 'fb-reels': 'reels',
    'ig-stories': 'stories', 'fb-stories': 'stories',
    'yt-shorts': 'shorts',
    'snap-916': 'snap',
    'pin-916': 'pinterest',
    'li-vertical': 'linkedin',
    'x-vertical': 'x',
    'zalo-916': 'zalo',
    'yt-169': 'ytplayer',
    'fb-feed-45': 'fbfeed'
  };

  function veUiThat(ctx, W, H, fmt) {
    var kieu = UI_THAT_MAP[fmt.id];
    if (!kieu || !UI_THAT[kieu]) return false;
    var s = W / 1080 * 44; // don vi icon co ban ~44px tren khung 1080
    UI_THAT[kieu](ctx, W, H, s);
    return true;
  }

  /* ── Lưới bố cục (tab 2) ──────────────────────────────────────────────
     cfg = { chia3: bool, tam: bool, vang: bool, le: so % (0 = tat) }
     duongLuoi la HAM THUAN tra danh sach duong — dung chung cho ve canvas,
     xuat .guides va do kiem. huong: 'ngang' (y = pt% cao) | 'doc' (x = pt% rong). */
  var VANG = 100 / 1.6180339887; // 61.803...; duong ti le vang: 38.197 va 61.803

  function duongLuoi(cfg) {
    var ds = [];
    function them(huong, pt, nhom) { ds.push({ huong: huong, pt: pt, nhom: nhom }); }
    if (cfg.chia3) {
      them('doc', 100 / 3, 'chia3'); them('doc', 200 / 3, 'chia3');
      them('ngang', 100 / 3, 'chia3'); them('ngang', 200 / 3, 'chia3');
    }
    if (cfg.vang) {
      them('doc', 100 - VANG, 'vang'); them('doc', VANG, 'vang');
      them('ngang', 100 - VANG, 'vang'); them('ngang', VANG, 'vang');
    }
    if (cfg.tam) { them('doc', 50, 'tam'); them('ngang', 50, 'tam'); }
    if (cfg.le > 0) {
      them('doc', cfg.le, 'le'); them('doc', 100 - cfg.le, 'le');
      them('ngang', cfg.le, 'le'); them('ngang', 100 - cfg.le, 'le');
    }
    // Duong nguoi dung TU THEM: [{huong:'ngang'|'doc', pt: 0-100}]
    var tc = cfg.tuyChinh || [];
    for (var i = 0; i < tc.length; i++) {
      if (tc[i] && tc[i].pt > 0 && tc[i].pt < 100) them(tc[i].huong, tc[i].pt, 'tuyChinh');
    }
    return ds;
  }

  var MAU_LUOI = {
    chia3: 'rgba(255,255,255,0.75)',
    vang: 'rgba(232,192,90,0.9)',
    tam: 'rgba(64,220,255,0.9)',
    le: 'rgba(255,255,255,0.55)',
    tuyChinh: 'rgba(255,87,20,0.95)'
  };
  var MAU_LUOI_GUIDES = { // mau RGB 0-1 cho file .guides
    chia3: { r: 1, g: 1, b: 1 },
    vang: { r: 0.91, g: 0.75, b: 0.35 },
    tam: { r: 0.25, g: 0.86, b: 1 },
    le: { r: 0.7, g: 0.7, b: 0.7 },
    tuyChinh: { r: 1, g: 0.34, b: 0.08 }
  };

  function veLuoi(ctx, W, H, cfg, lang, opts) {
    opts = opts || {};
    var ds = duongLuoi(cfg);
    var co = Math.max(11, Math.round(W / 1080 * 26));
    var day = Math.max(1, W / 1080 * 1.5);
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i];
      ctx.save();
      // cfg.mau (hex nguoi dung chon) de len mau mac dinh theo nhom
      ctx.strokeStyle = cfg.mau || MAU_LUOI[d.nhom];
      ctx.lineWidth = day;
      if (d.nhom === 'le') ctx.setLineDash([co * 0.7, co * 0.5]);
      ctx.beginPath();
      if (d.huong === 'doc') { var x = W * d.pt / 100; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      else { var y = H * d.pt / 100; ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      ctx.restore();
    }
    // Tam khung: them dau + nho o giao diem cho de ngam
    if (cfg.tam) {
      ctx.save();
      ctx.strokeStyle = cfg.mau || MAU_LUOI.tam;
      ctx.lineWidth = day * 1.6;
      var r = co * 0.9;
      ctx.beginPath();
      ctx.moveTo(W / 2 - r, H / 2); ctx.lineTo(W / 2 + r, H / 2);
      ctx.moveTo(W / 2, H / 2 - r); ctx.lineTo(W / 2, H / 2 + r);
      ctx.stroke();
      ctx.restore();
    }
    if (cfg.le > 0) {
      veChu(ctx, cfg.le + '%', W * cfg.le / 100 + co * 0.6, H * 0.06 + co, co, 'left');
    }
  }

  window.VeGuide = {
    tinhVungPx: tinhVungPx, khungAnToan: khungAnToan, ve: ve, veUiThat: veUiThat,
    duongLuoi: duongLuoi, veLuoi: veLuoi, MAU_LUOI_GUIDES: MAU_LUOI_GUIDES
  };
})();
