// Ban 3 (nen sang nhu ban 1, cau truc nhu email Apple): tieu de lon NGOAI the, the 1 co hinh dong chong anh + nut, the 2 ma + 3 cot icon,
// the 3 "Kich hoat trong 3 buoc" kem hinh dong dan ma -> kich hoat. Sinh: cam-on-mua.v3.{vi,en}.html (o trong {{...}}) va xem-thu-v3-{vi,en}.html (du lieu MAU GIA, anh nhung san).
const fs = require('fs'), path = require('path')
const dir = __dirname
const dataUri = f => 'data:image/' + path.extname(f).slice(1) + ';base64,' + fs.readFileSync(path.join(dir, f)).toString('base64')

const T = {
  vi: {
    lang: 'vi', title: 'Mã bản quyền Shot & Save của bạn',
    pre: 'Cảm ơn bạn đã mua Shot & Save. Mã bản quyền nằm ngay trong thư, chỉ cần dán vào là dùng.',
    eyebrow: 'Đơn hàng đã hoàn tất', h1: 'Cảm ơn bạn.',
    label: 'Shot & Save', h2a: 'Chụp. Ghim. Kéo thả.', altHero: 'Ảnh chụp màn hình rơi vào khay, được ghim lên trên và kéo thả đi bất cứ đâu',
    fine: 'Windows 10/11 · macOS (bản thử)', win: 'Tải cho Windows', mac: 'Tải cho macOS',
    h2b: 'Mã bản quyền của bạn.', keyNote: 'Giữ lại thư này, khi cài lại máy bạn sẽ cần đến mã.', keyFine: 'Dùng trên 2 máy · Cập nhật miễn phí trọn đời',
    c1t: 'Đổi máy dễ dàng.', c1p: 'Huỷ kích hoạt ở máy cũ, nhập mã ở máy mới.',
    c2t: 'Hoàn tiền 14 ngày.', c2p: 'Chưa hài lòng, bạn được hoàn đủ tiền trong 14 ngày.',
    c3t: 'Có người thật hỗ trợ.', c3p: 'Trả lời thư này, người thật sẽ đọc và phản hồi.',
    h2c: 'Kích hoạt trong 3 bước.',
    s1: 'Cài app và mở từ biểu tượng ở khay hệ thống.', s2: 'Mở <b style="color:#1d1d1f;">Cài đặt</b>, thẻ <b style="color:#1d1d1f;">Bản quyền</b> ở trên cùng.', s3: 'Dán mã rồi bấm <b style="color:#1d1d1f;">Kích hoạt</b>. Vậy là xong.',
    altAct: 'Dán mã vào ô, bấm Kích hoạt, màn hình báo đã kích hoạt',
    item: 'Shot & Save, trả một lần', itemFine: 'Cập nhật trọn đời · Mã đơn {{order_id}} · {{order_date}}<br>Gửi tới {{customer_email}}',
    foot: 'Bạn nhận được thư này vì đã mua Shot &amp; Save.', terms: 'Điều khoản &amp; Quyền riêng tư'
  },
  en: {
    lang: 'en', title: 'Your Shot & Save license key',
    pre: 'Thank you for buying Shot & Save. Your license key is right in this email, just paste it in and go.',
    eyebrow: 'Order complete', h1: 'Thank you.',
    label: 'Shot & Save', h2a: 'Capture. Pin. Drag.', altHero: 'Screenshots drop into the tray, pin on top and drag anywhere',
    fine: 'Windows 10/11 · macOS (beta)', win: 'Download for Windows', mac: 'Download for macOS',
    h2b: 'Your license key.', keyNote: 'Keep this email. You will need the key if you reinstall.', keyFine: 'Works on 2 computers · Free updates for life',
    c1t: 'Switching computers is easy.', c1p: 'Deactivate on the old one, enter the key on the new one.',
    c2t: '14-day refund.', c2p: 'Not happy? Get a full refund within 14 days.',
    c3t: 'Real people, real support.', c3p: 'Reply to this email, a real person reads it.',
    h2c: 'Activate in 3 steps.',
    s1: 'Install the app and open it from the system tray icon.', s2: 'Open <b style="color:#1d1d1f;">Settings</b>, the <b style="color:#1d1d1f;">License</b> tab at the top.', s3: 'Paste the key and click <b style="color:#1d1d1f;">Activate</b>. Done.',
    altAct: 'Paste the key, click Activate, the screen confirms it is activated',
    item: 'Shot & Save, one-time payment', itemFine: 'Lifetime updates · Order {{order_id}} · {{order_date}}<br>Sent to {{customer_email}}',
    foot: 'You received this email because you bought Shot &amp; Save.', terms: 'Terms &amp; Privacy'
  }
}
const esc = s => s.replace(/&(?!amp;|nbsp;)/g, '&amp;')

function mau(L, x) {
  const f = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif"
  const cot = (img, t, p) => `<td class="cot" width="33%" align="center" valign="top" style="padding:0 10px;">
          <img src="{{asset_base}}/${img}" width="44" height="44" alt="" style="display:block;margin:0 auto 12px auto;border:0;">
          <p style="margin:0 0 6px 0;font-size:15px;line-height:1.3;font-weight:700;color:#1d1d1f;">${t}</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#6e6e73;">${p}</p>
        </td>`
  const buoc = (n, p) => `<td class="cot" align="center" valign="top" width="33%" style="padding:0 6px;">
        <p style="margin:0 0 6px 0;font-size:30px;font-weight:700;color:#F86820;">${n}</p>
        <p style="margin:0;font-size:15px;line-height:1.5;color:#424245;">${p}</p>
      </td>`
  return `<!DOCTYPE html>
<!--
  AiO Shot & Save, THU CAM ON ban 3 (${L.lang}). Nen sang, cau truc nhu email Apple "Mac mini va Mac Studio": tieu de lon ngoai the, moi the co nhan nho + tieu de lon + hinh + nut,
  the cuoi co hang 3 cot icon. Hinh dong la GIF (Gmail khong chay CSS/video); khung dau cua GIF = hinh day du cho Outlook may tinh.
  O trong do ben gui thu dien: {{customer_email}} {{license_key}} {{order_id}} {{order_date}} {{price}} {{download_win}} {{download_mac}} va {{asset_base}} (thu muc anh tren web).
-->
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(L.title)}</title>
<style>
  @media (max-width:560px){
    .cot{display:block!important;width:100%!important;box-sizing:border-box;padding:0 0 22px 0!important}
    .the{padding-left:20px!important;padding-right:20px!important}
    .to{font-size:40px!important}
    .t2{font-size:30px!important}
    .ma{font-size:15px!important;padding:14px 14px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f5f5f7;font-size:1px;line-height:1px;">${esc(L.pre)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f7;">
<tr><td align="center" style="padding:28px 12px 36px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:${f};color:#1d1d1f;">

  <tr><td align="center" style="padding:0 0 18px 0;">
    <img src="{{asset_base}}/logo.png" width="26" height="24" alt="" style="display:inline-block;vertical-align:middle;border:0;">
    <span style="display:inline-block;vertical-align:middle;padding-left:8px;font-size:17px;font-weight:600;color:#1d1d1f;">Shot &amp; Save</span>
  </td></tr>

  <!-- tieu de lon NGOAI the (nhu Apple) -->
  <tr><td align="center" style="padding:14px 8px 30px 8px;">
    <p style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:#b8501a;">${L.eyebrow}</p>
    <h1 class="to" style="margin:0;font-size:52px;line-height:1.06;font-weight:700;letter-spacing:-.025em;color:#1d1d1f;">${L.h1}</h1>
  </td></tr>

  <!-- the 1: hinh dong chong anh -->
  <tr><td class="the" align="center" style="background:#ffffff;border-radius:24px;padding:36px 36px 34px 36px;">
    <p style="margin:0 0 4px 0;font-size:17px;font-weight:600;color:#1d1d1f;">${L.label}</p>
    <h2 class="t2" style="margin:0 0 6px 0;font-size:36px;line-height:1.1;font-weight:700;letter-spacing:-.02em;color:#1d1d1f;">${L.h2a}</h2>
    <img src="{{asset_base}}/hero-stack.gif" width="528" alt="${esc(L.altHero)}" style="display:block;width:100%;max-width:528px;height:auto;border:0;margin:0 auto;">
    <p style="margin:6px 0 20px 0;font-size:12px;line-height:1.5;color:#6e6e73;">${L.fine}</p>
    <a href="{{download_win}}" style="display:inline-block;background:#F86820;border-radius:980px;padding:12px 26px;font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;">${L.win}</a>
    <span style="display:inline-block;padding-left:16px;font-size:17px;"><a href="{{download_mac}}" style="color:#b8501a;text-decoration:none;">${L.mac}&nbsp;&#8250;</a></span>
  </td></tr>

  <tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>

  <!-- the 2: ma ban quyen + 3 cot -->
  <tr><td class="the" align="center" style="background:#ffffff;border-radius:24px;padding:40px 36px 34px 36px;">
    <h2 class="t2" style="margin:0 0 8px 0;font-size:32px;line-height:1.12;font-weight:700;letter-spacing:-.02em;color:#1d1d1f;">${L.h2b}</h2>
    <p style="margin:0 0 20px 0;font-size:16px;line-height:1.5;color:#424245;">${L.keyNote}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
      <td class="ma" style="background:#f5f5f7;border-radius:14px;padding:16px 22px;font-family:'SF Mono',Menlo,Consolas,'Courier New',monospace;font-size:19px;font-weight:600;letter-spacing:.03em;color:#1d1d1f;overflow-wrap:break-word;">{{license_key}}</td>
    </tr></table>
    <p style="margin:16px 0 30px 0;font-size:13px;line-height:1.6;color:#6e6e73;">${L.keyFine}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e8e8ed;"><tr><td style="height:26px;line-height:26px;font-size:0;">&nbsp;</td></tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${cot('doi-may.png', L.c1t, L.c1p)}
        ${cot('hoan-tien.png', L.c2t, L.c2p)}
        ${cot('ho-tro.png', L.c3t, L.c3p)}
    </tr></table>
  </td></tr>

  <tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>

  <!-- the 3: kich hoat 3 buoc + hinh dong -->
  <tr><td class="the" align="center" style="background:#ffffff;border-radius:24px;padding:40px 36px 34px 36px;">
    <h2 class="t2" style="margin:0 0 24px 0;font-size:32px;line-height:1.12;font-weight:700;letter-spacing:-.02em;color:#1d1d1f;">${L.h2c}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      ${buoc(1, L.s1)}
      ${buoc(2, L.s2)}
      ${buoc(3, L.s3)}
    </tr></table>
    <img src="{{asset_base}}/kich-hoat-${L.lang}.gif" width="528" alt="${esc(L.altAct)}" style="display:block;width:100%;max-width:528px;height:auto;border:0;margin:10px auto 0 auto;">
  </td></tr>

  <tr><td style="padding:26px 24px 0 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #d2d2d7;">
      <tr>
        <td style="padding:16px 0 4px 0;font-size:14px;color:#1d1d1f;font-weight:600;">${esc(L.item)}</td>
        <td align="right" style="padding:16px 0 4px 0;font-size:14px;color:#1d1d1f;font-weight:600;">{{price}}</td>
      </tr>
      <tr><td colspan="2" style="padding:0 0 14px 0;font-size:12px;line-height:1.7;color:#6e6e73;">${L.itemFine}</td></tr>
    </table>
  </td></tr>

  <tr><td align="center" style="padding:10px 24px 0 24px;border-top:1px solid #d2d2d7;font-size:12px;line-height:1.8;color:#6e6e73;">
    ${L.foot}<br>
    <a href="https://aio-shotsave.vercel.app/" style="color:#424245;text-decoration:none;">aio-shotsave.vercel.app</a> &nbsp;|&nbsp; <a href="https://aio-shotsave.vercel.app/legal.html" style="color:#424245;text-decoration:none;">${L.terms}</a><br>
    &copy; AiO Studio
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`
}

const MAU = { vi: { khach: 'khach.thu@example.com', ngay: '16/10/2026' }, en: { khach: 'test.customer@example.com', ngay: 'Oct 16, 2026' } }
for (const ng of ['vi', 'en']) {
  const h = mau(T[ng], MAU[ng])
  fs.writeFileSync(path.join(dir, 'cam-on-mua.v3.' + ng + '.html'), h)
  let x = h.split('{{asset_base}}').join('.')
  x = x.split('{{license_key}}').join('AIOSS-7K2P-9QM4-X8TD-3WNB').split('{{customer_email}}').join(MAU[ng].khach).split('{{price}}').join('$14.99')
        .split('{{order_date}}').join(MAU[ng].ngay).split('{{order_id}}').join('MAU-0001').split('{{download_win}}').join('#').split('{{download_mac}}').join('#')
  x = x.replace(/src="\.\/([a-z0-9-]+\.(png|gif))"/g, (m, f) => 'src="' + dataUri(f) + '"')
  fs.writeFileSync(path.join(dir, 'xem-thu-v3-' + ng + '.html'), x)
  console.log(ng, Math.round(x.length / 1024) + ' KB', '| o trong con lai:', (x.match(/\{\{[a-z_]+\}\}/g) || []).length, '| anh ngoai:', (x.match(/src="\.\//g) || []).length)
}
