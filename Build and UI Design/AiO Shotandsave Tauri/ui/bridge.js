'use strict'

/* =========================================================================
   bridge.js — cau noi Tauri, THAY THE cac preload-*.js cua ban Electron.
   -------------------------------------------------------------------------
   Muc tieu: overlay.js / pin.js / shelf.js / settings.js duoc COPY NGUYEN
   VAN tu ban Electron (khong sua mot dong) — file nay dung lai dung cac API
   window.i18n / window.overlay / window.pin / window.shelf / window.settings
   ma preload cu expose, tren nen invoke + event cua Tauri.

   Cach nap (trong index.html):
     <script src="../i18n.js"></script>
     <script src="../bridge.js" data-app="overlay" data-src="overlay.js"></script>
   bridge lay boot info (lang/hotkey/khay) tu Rust, dung API, bao "san sang"
   (de Rust phat cac su kien dang cho), roi moi chen script cua app vao.
   ========================================================================= */

;(function () {
  // document.currentScript chi dung SYNC — chup ngay truoc khi vao async.
  const APP = document.currentScript.dataset.app
  const SRC = document.currentScript.dataset.src

  const T = window.__TAURI__
  const inv = (cmd, args) => T.core.invoke(cmd, args)
  const cua = T.webviewWindow.getCurrentWebviewWindow()

  /* Su kien phat RIENG cho cua so nay (emit_to tu Rust) — co HANG DOI DEM:
     bridge bao 'win_ready' TRUOC khi script app kip goi onInit(cb)..., nen
     su kien den som phai xep hang, app gan cb la xa het. Khong dem la
     'overlay:init' roi vao khoang trong (race gan-listener). */
  const bus = {}
  function moKenh(ten) {
    bus[ten] = { q: [], cb: null }
    return cua.listen(ten, (e) => {
      const b = bus[ten]
      if (b.cb) b.cb(e.payload)
      else b.q.push(e.payload)
    })
  }
  const nghe = (ten, cb) => {
    const b = bus[ten]
    b.cb = cb
    b.q.splice(0).forEach((p) => cb(p))
  }
  const KENH = {
    overlay: ['overlay:init', 'overlay:frozen', 'overlay:sel-rect',
              'overlay:annotate', 'overlay:composite', 'overlay:locked'],
    pin: ['pin:data'],
    shelf: ['shelf:add', 'shelf:removed', 'shelf:cleared', 'shelf:update'],
    settings: [],
  }

  /* Keo file THAT ra app khac (thay webContents.startDrag cua Electron).
     ☠️ Plugin drag BAT BUOC co key onEvent (thieu la "missing required key
     onEvent" — vap 01/09). Ket qua Dropped/Cancelled ghi ve run-log. */
  function keoFileRa(lenhInfo, args) {
    /* ☠️ Khac Electron: OLE drag ben Tauri KHONG nuot mouseup cua webview —
       tha xong con lot mot cu CLICK vao chinh o vua keo (o khay la bung
       nham cua so ghim, do that 01/09). Chan cu click ngay sau keo. */
    const chan = (e) => { e.stopPropagation(); e.preventDefault() }
    document.addEventListener('click', chan, { capture: true, once: true })
    setTimeout(() => document.removeEventListener('click', chan, { capture: true }), 4000)
    inv(lenhInfo, args).then((d) => {
      if (!d || !d.path) return
      const kenh = new T.core.Channel()
      kenh.onmessage = (p) => inv('ui_log', { msg: 'keo-tha: ' + p.result }).catch(() => {})
      return inv('plugin:drag|start_drag', {
        item: [d.path], image: d.icon, options: {}, onEvent: kenh,
      })
    }).catch((e) => inv('ui_log', { msg: 'keo-tha LOI: ' + e }).catch(() => {}))
  }

  async function boot() {
    // Gan listener cho MOI kenh cua app nay truoc, roi moi bao ready.
    await Promise.all((KENH[APP] || []).map(moKenh))
    const b = await inv('boot_info')

    /* window.i18n — giong het preload: lang + t() (+ hotkey/khayKieu cho shelf) */
    window.i18n = {
      lang: b.lang,
      t: (key) => window.AIO_I18N.t(b.lang, key),
      hotkey: b.hotkeyDisplay || '',
      khayKieu: b.khayKieu || 'ngang',
    }

    if (APP === 'overlay') {
      // [dang do giat 01/09] bam gio 2 invoke dau keo — ghi ve run-log
      const doGio = (ten, p) => {
        const t0 = performance.now()
        return p.then((r) => {
          const ms = Math.round(performance.now() - t0)
          if (ms > 5) inv('ui_log', { msg: '[do] ' + ten + '=' + ms + 'ms' }).catch(() => {})
          return r
        })
      }
      window.overlay = {
        onInit: (cb) => nghe('overlay:init', cb),
        onFrozen: (cb) => nghe('overlay:frozen', cb),
        confirm: (payload) => inv('overlay_confirm', { payload }),
        cancel: () => inv('overlay_cancel'),
        dragStart: (diemNeo) => doGio('dragStart', inv('overlay_drag_start', { x: diemNeo.x, y: diemNeo.y })),
        dragEnd: () => inv('overlay_drag_end'),
        onSelRect: (cb) => nghe('overlay:sel-rect', cb),
        onAnnotate: (cb) => nghe('overlay:annotate', cb),
        onComposite: (cb) => nghe('overlay:composite', cb),
        lock: () => doGio('lock', inv('overlay_lock')),
        onLocked: (cb) => nghe('overlay:locked', cb),
        log: (msg) => inv('overlay_log', { msg }),
      }
    }

    if (APP === 'pin') {
      /* Anh ghim di qua aioshot:// (URL) thay vi dataURL — canvas luuVe can
         CORS sach nen phai set crossOrigin TRUOC khi pin.js gan src. */
      const im = document.getElementById('img')
      if (im) im.crossOrigin = 'anonymous'
      window.pin = {
        onData: (cb) => nghe('pin:data', cb),
        copy: () => inv('pin_copy'),
        close: () => inv('pin_close'),
        startDrag: () => keoFileRa('pin_drag_info', {}),
        saveEdit: (dataUrl) => inv('pin_save_edit', { dataUrl }),
        /* Electron doi opacity CUA SO; Tauri v2 khong co API do — doi opacity
           NOI DUNG (cua so von trong suot nen mat nhin y het). */
        setOpacity: (v) => { document.body.style.opacity = String(v) },
        dragStart: () => inv('win_drag_start'),
        dragTo: (dx, dy) => inv('win_drag_to', { dx, dy }),
        dragEnd: () => inv('win_drag_end'),
      }
    }

    if (APP === 'shelf') {
      window.shelf = {
        onAdd: (cb) => nghe('shelf:add', cb),
        onRemove: (cb) => nghe('shelf:removed', cb),
        onClear: (cb) => nghe('shelf:cleared', cb),
        onUpdate: (cb) => nghe('shelf:update', cb),
        pin: (id) => inv('shelf_pin', { id }),
        startDrag: (id) => keoFileRa('shelf_drag_info', { id }),
        remove: (id) => inv('shelf_remove', { id }),
        clear: () => inv('shelf_clear'),
        openFolder: () => inv('mo_thu_muc_luu'),
        hide: () => inv('shelf_hide'),
        dragStart: () => inv('win_drag_start'),
        dragTo: (dx, dy) => inv('win_drag_to', { dx, dy }),
        dragEnd: () => inv('win_drag_end'),
        savePos: () => inv('shelf_save_pos'),
      }
    }

    if (APP === 'settings') {
      window.settings = {
        get: () => inv('settings_get'),
        setHotkey: (accel) => inv('settings_set_hotkey', { accel }),
        reset: () => inv('settings_reset'),
        pickFolder: () => inv('settings_pick_folder'),
        openFolder: () => inv('mo_thu_muc_luu'),
        setAnh: (d) => inv('settings_set_anh', { d }),
        setKhay: (kieu) => inv('settings_set_khay', { kieu }),
        setLang: (l) => inv('settings_set_lang', { l }),
        close: () => inv('settings_close'),
      }
    }

    // Bao Rust: listener da gan xong — phat init/du lieu dang cho duoc roi.
    await inv('win_ready')

    // Gio moi nap script cua app (giu nguyen van tu ban Electron).
    const s = document.createElement('script')
    s.src = SRC
    s.onload = () => { try { inv('ui_log', { msg: 'bridge: ' + SRC + ' nap xong' }) } catch (x) {} }
    s.onerror = () => { try { inv('ui_log', { msg: 'bridge: ' + SRC + ' NAP LOI' }) } catch (x) {} }
    document.body.appendChild(s)
  }

  // Moi loi JS (bridge hoac script app) deu ghi ve run-log — khong chet cam.
  window.addEventListener('error', (e) => {
    try { inv('ui_log', { msg: 'JS LOI: ' + e.message + ' @' + e.filename + ':' + e.lineno }) } catch (x) {}
  })
  window.addEventListener('unhandledrejection', (e) => {
    try { inv('ui_log', { msg: 'PROMISE LOI: ' + (e.reason && e.reason.message || e.reason) }) } catch (x) {}
  })

  boot().catch((e) => {
    try { inv('ui_log', { msg: 'bridge boot LOI: ' + (e && e.message || e) }) } catch (x) {}
  })
})()
