'use strict'
/* Cat rac sau khi electron-builder dong goi, TRUOC khi nen NSIS.
   Muc tieu: giam dung luong bo cai ma KHONG bo tinh nang dang dung.
   ☠️ Chi xoa thu DA XAC MINH khong dung (locale khong phai en/vi; shader
   WebGPU app khong dung). Do truoc/sau bang scripts/do-dung-luong.
   Xem SO LOI TAI DIEN trong CLAUDE.md truoc khi them dong xoa moi. */
const fs = require('fs')
const path = require('path')

// Chromium chi dung locale cho UI noi tai cua no (menu chuot phai, spellcheck).
// App tu dich VI/EN qua i18n.js -> giu en-US lam nen; bo 53 locale con lai.
const GIU_LOCALE = new Set(['en-US.pak'])

exports.default = async function (context) {
  const out = context.appOutDir
  let dagiam = 0

  // 1) Locale thua (~45 MB truoc nen)
  const localesDir = path.join(out, 'locales')
  if (fs.existsSync(localesDir)) {
    for (const f of fs.readdirSync(localesDir)) {
      if (GIU_LOCALE.has(f)) continue
      const p = path.join(localesDir, f)
      dagiam += fs.statSync(p).size
      fs.unlinkSync(p)
    }
  }

  // 2) Shader WebGPU (dxcompiler 25 MB + dxil 1.5 MB): app chup man hinh
  //    KHONG dung WebGPU/WGSL. Compositing thuong cua Chromium dung D3D11
  //    (d3dcompiler_47.dll — GIU LAI), khong can 2 file nay.
  for (const f of ['dxcompiler.dll', 'dxil.dll']) {
    const p = path.join(out, f)
    if (fs.existsSync(p)) { dagiam += fs.statSync(p).size; fs.unlinkSync(p) }
  }

  console.log('[afterPack] da cat ' + (dagiam / 1048576).toFixed(1) + ' MB truoc nen')
}
