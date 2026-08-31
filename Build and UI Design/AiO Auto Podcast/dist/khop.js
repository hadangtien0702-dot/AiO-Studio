/**
 * khop.js — bộ não TỰ KHỚP (auto match) của AiO Auto Podcast (v0.6.0, 05/08/2026).
 *
 * Anh Tiến đặt hàng 05/08: *"anh sẽ kéo toàn bộ source clip vào sequence bấm
 * một nút auto match"* — panel phải tự trả lời ba câu:
 *   1. Track tiếng nào KHÔNG phải mic riêng (tiếng đi kèm cam) → Không dùng.
 *   2. Cam nào đi với mic nào (cùng một người), và người đó TÊN GÌ.
 *   3. Cam nào là cam CHUNG (toàn cảnh) — không thuộc riêng ai.
 *
 * THUẦN như nao.js/sync.js: không đụng Node/CEP, nhờ vậy `node tests/kiem-khop.mjs`
 * đo được toàn bộ phần quyết định TRƯỚC khi đụng timeline.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ☠️ ĐỪNG THỬ LẠI: GHÉP CAM↔MIC BẰNG TIẾNG CAM — ĐÃ ĐO, ĐÃ TRƯỢT (05/08/2026)
 * ═════════════════════════════════════════════════════════════════════════
 * Ý tưởng nghe rất hợp lý: cam của người nào thì line-in / mic gắn máy của nó
 * nghe người đó rõ nhất → tương quan chéo đường bao dB sẽ chỉ ra đúng cặp.
 * ĐO THẬT trên 4 cam cá nhân + 4 mic của hai buổi PV anh Tiến quay (đáp án lấy
 * từ tên file anh tự đặt) — kết quả:
 *
 *   Buổi 1  Cam2_Thien  r(micThien)=0,578  r(micTrong)=0,635  -> đoán SAI
 *   Buổi 1  Cam3_Trong  r(micThien)=0,533  r(micTrong)=0,578  -> đúng (may)
 *   Buổi 2  Cam2_Trong  r(micDilys)=0,713  r(micTrong)=0,696  -> đoán SAI
 *   Buổi 2  Cam3_Dilys  r(micDilys)=0,691  r(micTrong)=0,712  -> đoán SAI
 *                                          => 3 SAI / 4 CA
 *
 * Vì sao: MỌI cam đều thu chung một căn phòng nên mọi cặp đều tương quan cao
 * (r 0,53–0,74). Biên độ giữa cặp nhất và cặp nhì chỉ 0,017–0,056 — tức là
 * nhiễu, không phải tín hiệu. Cặp "thắng" gần như luôn là mic của NGƯỜI NÓI
 * NHIỀU NHẤT (anh Trọng dẫn, thắng 3/4 ca), không liên quan gì tới cam đó
 * quay ai. Đây đúng bài học 5i: khớp bằng một dấu hiệu yếu thì bắt nhầm.
 *
 * Nên tính năng này CHỈ dùng hai thứ đáng tin:
 *   • CẤU TRÚC — track tiếng có media TRÙNG ĐƯỜNG DẪN với một track hình thì
 *     chắc chắn là tiếng của cam đó. Đúng 100%, không phải suy đoán.
 *   • TÊN FILE — khớp token có trọng số nghịch đảo độ phổ biến (IDF). Token
 *     hiếm ("thien", "dilys", "a") đáng tin; token ai cũng có ("cam", "buoi",
 *     "1") gần như không tính điểm. KHÔNG loại cứng "từ vai trò" — "Cẩm" là
 *     tên người thật, loại chữ "cam" là bắt nhầm luôn người ta.
 * Tên không nói gì thì TRẢ VỀ 'thu-tu' và nói thẳng là ĐOÁN, không giả vờ chắc.
 */
var AiOKhop = (function () {
  'use strict'

  // ═══ 1. TÊN FILE → TOKEN ═════════════════════════════════════════════════

  var BANG_DAU = (function () {
    var cap = [
      'àáạảãâầấậẩẫăằắặẳẵ', 'a', 'èéẹẻẽêềếệểễ', 'e', 'ìíịỉĩ', 'i',
      'òóọỏõôồốộổỗơờớợởỡ', 'o', 'ùúụủũưừứựửữ', 'u', 'ỳýỵỷỹ', 'y', 'đ', 'd',
    ]
    var m = {}
    for (var i = 0; i < cap.length; i += 2) {
      for (var j = 0; j < cap[i].length; j++) m[cap[i].charAt(j)] = cap[i + 1]
    }
    return m
  })()

  function boDau(s) {
    var ra = ''
    s = String(s)
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i)
      ra += BANG_DAU[c.toLowerCase()] ? (c === c.toLowerCase() ? BANG_DAU[c] : BANG_DAU[c.toLowerCase()].toUpperCase()) : c
    }
    return ra
  }

  /**
   * Tên file/clip → bộ token so khớp được.
   * Tách camelCase TRƯỚC khi hạ chữ (hạ trước là mất ranh giới "ToanCanh"),
   * rồi tách ranh giới chữ↔số ("Cam2" → cam · 2, "C4233" → c · 4233).
   *
   * `boDau` ánh xạ 1 ký tự → 1 ký tự nên bản bỏ dấu DÀI BẰNG bản gốc — nhờ đó
   * cắt token trên bản bỏ dấu rồi lấy đúng khúc đó ở bản gốc, giữ được
   * "Thiện"/"Trọng" có dấu để đặt tên người.
   * @return { ds: [token thường, không dấu], goc: [token nguyên bản], tho }
   */
  function tachToken(ten) {
    var s0 = String(ten || '')
      .replace(/^.*[\\/]/, '')                 // nhận cả đường dẫn — chỉ lấy tên file
      .replace(/\.aio-mono\.wav$/i, '')        // bản mono panel tự tách
      .replace(/\.[^.]+$/, '')                 // bỏ đuôi file
    var sf = boDau(s0)
    // camelCase: chèn dấu cách ở CÙNG vị trí trên cả hai bản
    var chen = []
    for (var i = 1; i < sf.length; i++) {
      var a = sf.charAt(i - 1), b = sf.charAt(i)
      if (/[a-z]/.test(a) && /[A-Z]/.test(b)) chen.push(i)
    }
    for (var c = chen.length - 1; c >= 0; c--) {
      s0 = s0.slice(0, chen[c]) + ' ' + s0.slice(chen[c])
      sf = sf.slice(0, chen[c]) + ' ' + sf.slice(chen[c])
    }
    // token = một mạch chữ HOẶC một mạch số; mọi thứ khác là ranh giới
    var ds = [], goc = []
    var re = /[A-Za-z]+|[0-9]+/g
    var m
    while ((m = re.exec(sf)) !== null) {
      ds.push(m[0].toLowerCase())
      goc.push(s0.substr(m.index, m[0].length))
    }
    return { ds: ds, goc: goc, tho: ds.join('') }
  }

  /** Token chữ ≥3 ký tự = MẠNH (thường là tên người); còn lại = YẾU. */
  function laManh(tok) { return /^[a-z]{3,}$/.test(tok) }

  /** Đếm mỗi token có mặt ở bao nhiêu mục — nền của trọng số IDF. */
  function demToken(dsBoToken) {
    var d = {}
    for (var i = 0; i < dsBoToken.length; i++) {
      var thay = {}
      var ds = dsBoToken[i].ds
      for (var j = 0; j < ds.length; j++) {
        if (thay[ds[j]]) continue
        thay[ds[j]] = 1
        d[ds[j]] = (d[ds[j]] || 0) + 1
      }
    }
    return d
  }

  /**
   * Điểm khớp tên giữa một cam và một mic.
   * Trọng số token = (mạnh 3 · yếu 1) ÷ (số cam chứa nó × số mic chứa nó).
   * Nhờ mẫu số này "cam"/"mic"/"buoi" tự rơi về gần 0 mà không cần danh sách
   * loại cứng — và "Cẩm" tên người vẫn đủ điểm khi chỉ một người tên đó.
   */
  function diemTen(a, b, demCam, demMic) {
    var diem = 0
    var chung = []
    var thay = {}
    for (var i = 0; i < a.ds.length; i++) {
      var x = a.ds[i]
      if (thay[x]) continue
      thay[x] = 1
      if (b.ds.indexOf(x) < 0) continue
      var w = (laManh(x) ? 3 : 1) / ((demCam[x] || 1) * (demMic[x] || 1))
      diem += w
      chung.push(x)
    }
    return { diem: diem, chung: chung }
  }

  /** Ma trận điểm tên: M[i][j] = cam i khớp mic j bao nhiêu. */
  function maTranTen(tenCam, tenMic) {
    var boCam = tenCam.map(tachToken)
    var boMic = tenMic.map(tachToken)
    var demCam = demToken(boCam)
    var demMic = demToken(boMic)
    var M = [], chung = []
    for (var i = 0; i < boCam.length; i++) {
      M.push([]); chung.push([])
      for (var j = 0; j < boMic.length; j++) {
        var d = diemTen(boCam[i], boMic[j], demCam, demMic)
        M[i].push(d.diem)
        chung[i].push(d.chung)
      }
    }
    return { M: M, chung: chung, boCam: boCam, boMic: boMic, demCam: demCam, demMic: demMic }
  }

  /** Từ khoá cam CHUNG (toàn cảnh) — cam không thuộc riêng ai. */
  var TU_CAM_CHUNG = [
    'toancanh', 'canhrong', 'canhchung', 'camchung', 'wideshot', 'wide', 'master',
    'twoshot', '2shot', 'threeshot', '3shot', 'fullshot', 'groupshot',
    'overview', 'roomcam', 'establishing',
  ]
  function laCamChung(ten) {
    var tho = tachToken(ten).tho
    for (var i = 0; i < TU_CAM_CHUNG.length; i++) {
      if (tho.indexOf(TU_CAM_CHUNG[i]) >= 0) return TU_CAM_CHUNG[i]
    }
    return ''
  }

  // ═══ 2. GHÉP CẶP TỪ MA TRẬN ══════════════════════════════════════════════

  /**
   * Ghép 1–1 tham lam, KÈM BIÊN ĐỘ: mỗi cặp chốt xong đo xem nó hơn ô tốt nhì
   * (cùng hàng hoặc cùng cột, trong phần chưa ghép) bao nhiêu. Biên nhỏ nghĩa
   * là "hai lựa chọn ngang nhau" — không được coi là chắc.
   */
  function ghep(M, nguongDiem, nguongBien) {
    var nC = M.length
    var nM = nC ? M[0].length : 0
    var xongC = {}, xongM = {}
    var ra = []
    while (true) {
      var bi = -1, bj = -1, bv = -Infinity
      for (var i = 0; i < nC; i++) {
        if (xongC[i]) continue
        for (var j = 0; j < nM; j++) {
          if (xongM[j]) continue
          if (M[i][j] > bv) { bv = M[i][j]; bi = i; bj = j }
        }
      }
      if (bi < 0 || !(bv > nguongDiem)) break
      var nhi = 0
      for (var j2 = 0; j2 < nM; j2++) {
        if (j2 !== bj && !xongM[j2] && M[bi][j2] > nhi) nhi = M[bi][j2]
      }
      for (var i2 = 0; i2 < nC; i2++) {
        if (i2 !== bi && !xongC[i2] && M[i2][bj] > nhi) nhi = M[i2][bj]
      }
      xongC[bi] = 1; xongM[bj] = 1
      ra.push({ cam: bi, mic: bj, diem: bv, bien: bv - nhi, chac: (bv - nhi) >= nguongBien })
    }
    return ra
  }

  // ═══ 3. ĐẶT TÊN NGƯỜI ════════════════════════════════════════════════════

  function hoaDau(s) {
    return String(s).charAt(0).toUpperCase() + String(s).slice(1)
  }

  /**
   * Tên người cho một cặp: ưu tiên token CHUNG mạnh nhất (giữ nguyên bản có
   * dấu lấy từ tên file mic — "thien" → "Thiện"), rồi tới token riêng của mic
   * hiếm nhất, cuối cùng là rỗng để panel tự đánh "Người k".
   */
  function tenNguoi(boMic, chungTok, demMic, soMic) {
    var i, x
    // 1. token chung mạnh nhất
    var manh = chungTok.filter(laManh)
    var chon = manh.length ? manh[0] : (chungTok.length ? chungTok[0] : '')
    if (!chon) {
      // 2. Không có token chung (cặp ghép theo thứ tự) → lấy token của RIÊNG
      //    mic này. Chỉ nhận token MẠNH: "ZOOM0001" chỉ còn số "0001", đặt tên
      //    người là "0001" thì tệ hơn hẳn "Người 1" panel tự đánh.
      for (i = 0; i < boMic.ds.length; i++) {
        x = boMic.ds[i]
        if ((demMic[x] || 0) === 1 && laManh(x)) { chon = x; break }
      }
    }
    if (!chon) return ''
    for (i = 0; i < boMic.ds.length; i++) {
      if (boMic.ds[i] === chon) return hoaDau(boMic.goc[i])
    }
    return hoaDau(chon)
  }

  // ═══ 4. KHỚP CẢ BẢN ĐỒ ═══════════════════════════════════════════════════

  /**
   * Khớp toàn bộ bản đồ track trong MỘT lần gọi — đây là thứ nút "Tự khớp" dùng.
   *
   * @param cams   [{k, ten, duong}]  track hình có clip
   * @param tiengs [{k, ten, duong}]  MỌI track tiếng có clip
   * @param opts   { nguongBien: biên tối thiểu để coi là chắc (mặc định 0.5) }
   * @return {
   *   tiengCam: [k]            track tiếng là tiếng đi kèm cam → Không dùng
   *   camChung: k|null         cam toàn cảnh (nếu nhận ra)
   *   cap: [{camK, micK, ten, nguon:'ten'|'thu-tu', diem, bien}]
   *   camThua: [k], micThua: [k]
   * }
   */
  function khopBanDo(cams, tiengs, opts) {
    opts = opts || {}
    var nguongBien = opts.nguongBien === undefined ? 0.5 : opts.nguongBien

    // ── 4.1 CẤU TRÚC: tiếng đi kèm cam (media trùng đường dẫn) ──
    var duongCam = {}
    cams.forEach(function (c) {
      if (c.duong) duongCam[String(c.duong).replace(/\\/g, '/').toLowerCase()] = c.k
    })
    var tiengCam = []
    var mics = []
    tiengs.forEach(function (a) {
      var d = a.duong ? String(a.duong).replace(/\\/g, '/').toLowerCase() : ''
      if (d && duongCam[d]) tiengCam.push(a.k)
      else mics.push(a)
    })

    // ── 4.2 TÊN: ghép cam ↔ mic ──
    var cap = []
    var daCam = {}, daMic = {}
    var camChung = null
    // Khai báo ở đây, KHÔNG để trong nhánh if: bước 4.4 bên dưới đọc `mt` để
    // đặt tên. Nay nó chỉ an toàn nhờ tình cờ (mics rỗng ⇒ conMic rỗng ⇒ vòng
    // lặp không chạy) — một thay đổi nhỏ ở nhánh else-if là vỡ ngay.
    var mt = null

    // Tìm cam chung trước
    for (var i = 0; i < cams.length; i++) {
      if (laCamChung(cams[i].ten)) { camChung = cams[i].k; daCam[i] = 1; break }
    }

    if (mics.length > 0) {
      mt = maTranTen(cams.map(function (c) { return c.ten }), mics.map(function (m) { return m.ten }))
      var capTho = ghep(mt.M, 0, nguongBien)
      capTho.forEach(function (c) {
        if (!c.chac) return
        daCam[c.cam] = 1; daMic[c.mic] = 1
        cap.push({
          camK: cams[c.cam].k, micK: mics[c.mic].k, nguon: 'ten',
          ten: tenNguoi(mt.boMic[c.mic], mt.chung[c.cam][c.mic], mt.demMic, mics.length),
          diem: c.diem, bien: c.bien,
        })
      })
    } else if (tiengCam.length > 0) {
      // Khi KHÔNG CÓ mic rời (dùng tiếng camera đã sync): ghép cam cá nhân với tiếng camera tương ứng
      var tiengCamDaDung = {}
      for (var ic = 0; ic < cams.length; ic++) {
        if (daCam[ic]) continue
        var cItem = cams[ic]
        var dC = cItem.duong ? String(cItem.duong).replace(/\\/g, '/').toLowerCase() : ''
        var aMatch = null
        for (var ia = 0; ia < tiengs.length; ia++) {
          var aItem = tiengs[ia]
          var dA = aItem.duong ? String(aItem.duong).replace(/\\/g, '/').toLowerCase() : ''
          if (dA && dC && dA === dC && !tiengCamDaDung[aItem.k]) {
            aMatch = aItem
            break
          }
        }
        if (aMatch) {
          daCam[ic] = 1
          tiengCamDaDung[aMatch.k] = 1
          // Trích xuất tên người từ tên clip cam (bỏ token "cam", "canh")
          var tokC = tachToken(cItem.ten)
          var tenGiu = ''
          for (var it = 0; it < tokC.ds.length; it++) {
            var xT = tokC.ds[it]
            if (xT !== 'cam' && xT !== 'canh' && xT !== 'toan' && laManh(xT)) {
              tenGiu = hoaDau(tokC.goc[it])
              break
            }
          }
          cap.push({
            camK: cItem.k,
            micK: aMatch.k,
            nguon: 'cam-audio',
            ten: tenGiu || ('Cam ' + (ic + 1)),
            diem: 1, bien: 1,
          })
        }
      }
      // Lọc bỏ những track tiếng camera đã được ghép làm mic chính ra khỏi danh sách tiengCam (để không bị set 'Not used')
      tiengCam = tiengCam.filter(function (k) { return !tiengCamDaDung[k] })
    }

    // ── 4.4 CÒN LẠI: ghép theo THỨ TỰ track, và nói rõ là ĐOÁN ──
    var conCam = [], conMic = []
    for (i = 0; i < cams.length; i++) if (!daCam[i]) conCam.push(i)
    for (i = 0; i < mics.length; i++) if (!daMic[i]) conMic.push(i)
    var n = Math.min(conCam.length, conMic.length)
    for (i = 0; i < n; i++) {
      var ic2 = conCam[i], im = conMic[i]
      cap.push({
        camK: cams[ic2].k, micK: mics[im].k, nguon: 'thu-tu',
        ten: mt ? tenNguoi(mt.boMic[im], [], mt.demMic, mics.length) : '',
        diem: 0, bien: 0,
      })
    }

    // Giữ thứ tự theo track hình cho dễ đọc
    cap.sort(function (a, b) { return thuTu(a.camK) - thuTu(b.camK) })
    return {
      tiengCam: tiengCam,
      camChung: camChung,
      cap: cap,
      camThua: conCam.slice(n).map(function (x) { return cams[x].k }),
      micThua: conMic.slice(n).map(function (x) { return mics[x].k }),
    }
  }

  function thuTu(k) { return parseInt(String(k).slice(1), 10) || 0 }

  /**
   * Tự nhóm các clip trên V0/A0 (kéo dồn) và tạo lệnh phân tách track cho Host.
   * @param dsClips { video: [{trackIdx, clipIdx, ten, duong, batDau, inPoint, ketThuc}], audio: [...] }
   * @return { lenhXepStr, dsCamKeys, dsMicKeys }
   */
  function phanNhomVaSapXepTrack(dsClips) {
    dsClips = dsClips || {}
    var vClips = dsClips.video || []
    var aClips = dsClips.audio || []

    var camNhomMap = {}
    var dsCamKeys = []

    vClips.forEach(function (c) {
      var key = String(c.duong || c.ten || '').replace(/\\/g, '/').toLowerCase()
      var tenFile = key.split('/').pop() || ''
      var tok = tachToken(tenFile)
      var nKey = ''

      if (laCamChung(tenFile)) {
        nKey = 'wide'
      } else {
        for (var i = 0; i < tok.ds.length; i++) {
          var t = tok.ds[i]
          if (/^c(am)?[0-9a-z]$/.test(t)) {
            nKey = t
            break
          }
          if (t === 'cam' && i + 1 < tok.ds.length) {
            nKey = 'cam_' + tok.ds[i + 1]
            break
          }
        }
        if (!nKey) {
          var manh = tok.ds.filter(laManh)
          nKey = manh.length >= 2 ? manh[0] + '_' + manh[1] : (manh[0] || (tok.ds[0] ? tok.ds[0] + '_' + (tok.ds[1] || '') : 'v_' + c.trackIdx))
        }
      }

      if (!camNhomMap[nKey]) {
        camNhomMap[nKey] = []
        dsCamKeys.push(nKey)
      }
      camNhomMap[nKey].push(c)
    })

    dsCamKeys.sort(function (a, b) {
      if (a === 'wide') return 1
      if (b === 'wide') return -1
      return a.localeCompare(b)
    })

    var vLenh = []
    dsCamKeys.forEach(function (key, vIdx) {
      var clips = camNhomMap[key]
      clips.forEach(function (c) {
        vLenh.push('V,' + vIdx + ',' + c.duong + ',' + c.inPoint + ',' + c.ketThuc + ',' + c.batDau)
      })
    })

    var duongCamMap = {}
    vClips.forEach(function (c) {
      if (c.duong) duongCamMap[String(c.duong).replace(/\\/g, '/').toLowerCase()] = true
    })

    var tiengCamClips = []
    var micClips = []
    aClips.forEach(function (c) {
      var d = c.duong ? String(c.duong).replace(/\\/g, '/').toLowerCase() : ''
      if (d && duongCamMap[d]) {
        tiengCamClips.push(c)
      } else {
        micClips.push(c)
      }
    })

    var aLenh = []
    var curAIdx = 0

    if (tiengCamClips.length > 0) {
      tiengCamClips.forEach(function (c) {
        aLenh.push('A,0,' + c.duong + ',' + c.inPoint + ',' + c.ketThuc + ',' + c.batDau)
      })
      curAIdx = 1
    }

    var micNhomMap = {}
    var dsMicKeys = []

    micClips.forEach(function (c) {
      var key = String(c.duong || c.ten || '').replace(/\\/g, '/').toLowerCase()
      var tenFile = key.split('/').pop() || ''
      var tok = tachToken(tenFile)
      var mKey = ''

      for (var i = 0; i < tok.ds.length; i++) {
        var t = tok.ds[i]
        if (/^mic[0-9a-z]$/.test(t)) {
          mKey = t
          break
        }
        if (t === 'mic' && i + 1 < tok.ds.length) {
          mKey = 'mic_' + tok.ds[i + 1]
          break
        }
      }
      if (!mKey) {
        var manh = tok.ds.filter(laManh)
        mKey = manh.length >= 2 ? manh[0] + '_' + manh[1] : (manh[0] || (tok.ds[0] ? tok.ds[0] + '_' + (tok.ds[1] || '') : 'a_' + c.trackIdx))
      }

      if (!micNhomMap[mKey]) {
        micNhomMap[mKey] = []
        dsMicKeys.push(mKey)
      }
      micNhomMap[mKey].push(c)
    })

    dsMicKeys.sort()

    dsMicKeys.forEach(function (key) {
      var clips = micNhomMap[key]
      clips.forEach(function (c) {
        aLenh.push('A,' + curAIdx + ',' + c.duong + ',' + c.inPoint + ',' + c.ketThuc + ',' + c.batDau)
      })
      curAIdx++
    })

    var lenhXepStr = vLenh.concat(aLenh).join(';')

    return {
      dsCamKeys: dsCamKeys,
      dsMicKeys: dsMicKeys,
      lenhXepStr: lenhXepStr
    }
  }

  return {
    boDau: boDau,
    tachToken: tachToken,
    laManh: laManh,
    demToken: demToken,
    diemTen: diemTen,
    maTranTen: maTranTen,
    laCamChung: laCamChung,
    ghep: ghep,
    tenNguoi: tenNguoi,
    khopBanDo: khopBanDo,
    phanNhomVaSapXepTrack: phanNhomVaSapXepTrack,
    TU_CAM_CHUNG: TU_CAM_CHUNG,
  }
})()

/* Cho Node chạy bộ kiểm; trong panel thì AiOKhop là biến toàn cục. */
if (typeof module !== 'undefined' && module.exports) module.exports = AiOKhop
