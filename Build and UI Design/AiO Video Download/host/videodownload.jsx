/**
 * videodownload.jsx — phan ExtendScript cua AiO Video Download.
 *
 * Panel lam viec TAI (yt-dlp) o phia Node/CEP; file nay chi lo nhung viec CAN
 * Premiere: goi y thu muc luu, NHAP file da tai vao bin, va TRA LOI "file nay
 * co dang nam trong project DANG MO khong" (tool phai dong hanh — 21/09 anh
 * Tien bat nut "Da vao project" la AO vi truoc day panel luu cung co do ra
 * dia, khong hoi Premiere). Moi ham tra "OK:..." hoac "ERR:MA|chi tiet".
 *
 * ☠️ ES3: khong JSON, khong map/forEach/indexOf tren mang. Viet for/var tay.
 * ☠️ KHONG dung QE DOM. Moi API o day la API cong khai.
 * ☠️ KHONG mo hop thoai modal o day (Folder.selectDialog): no CHAN moi evalScript
 *    cua MOI panel AiO toi khi dong (do 21/09: '1+1' het gio 8 s). Chon thu muc
 *    lam o phia panel bang window.cep.fs.showOpenDialogEx.
 */

var VD_TEN_BIN = 'AiO Video Download';

/** Chuan hoa duong dan de so: gach nguoc, chu thuong (Windows khong phan biet hoa/thuong). */
function vd__chuan(p) {
  return String(p || '').replace(/\//g, '\\').toLowerCase();
}

/**
 * Doi tuong File cho mot duong dan THO.
 * ☠️ Do 21/09: `new File(p)` cua ExtendScript GIAI MA %XX trong duong dan —
 * '100%Beef … 50%25 …' thanh '100?ef … 50% …', exists=false. Tieu de YouTube co
 * '%' ("100%", "50% OFF") la chuyen thuong -> ban 0.1.0 bao KHONG_THAY_FILE va
 * khong bao gio nhap duoc. Ma hoa '%' thanh '%25' truoc.
 */
function vd__file(p) {
  return new File(String(p || '').replace(/%/g, '%25'));
}

/**
 * Duong dan dang gach nguoc, KHONG qua File (tranh giai ma %XX). Viet hoa chu o
 * dia nhu File.fsName tung lam (do 21/09: fsName tra 'E:\...' ca khi dua 'e:/...').
 */
function vd__gachNguoc(p) {
  var s = String(p || '').replace(/\//g, '\\');
  if (/^[a-z]:/.test(s)) s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

/**
 * Thong tin project cho RIENG panel nay: "appVersion|duong dan|ten".
 * Khong dung ten `getHostInfo` — ham do la hop dong dung chung cua 8 panel
 * (xem index.jsx). Theo doi bang DUONG DAN (hai project cung ten o hai thu muc
 * la chuyen thuong). Ten dat CUOI (tren Mac ten file duoc chua '|').
 */
function vd_thongTinHost() {
  var v = '';
  var duong = '';
  var ten = '';
  try { v = app.version; } catch (e) {}
  try {
    if (app.project) {
      duong = app.project.path || '';
      ten = app.project.name || '';
    }
  } catch (e2) {}
  return v + '|' + duong + '|' + ten;
}

/** Thu muc cua file project dang mo — de goi y noi luu video tai ve. */
function vd_thuMucProject() {
  try {
    if (!app.project || !app.project.path) return 'ERR:KHONG_CO_PROJECT|';
    var f = vd__file(app.project.path);
    if (!f.parent) return 'ERR:KHONG_CO_PROJECT|';
    return 'OK:' + f.parent.fsName;
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

/**
 * DUONG LUI khi panel khong co window.cep.fs (khong nen xay ra tren CSXS 9+).
 * selectDlg (phuong thuc cua doi tuong) mo DUNG thu muc goi y; Folder.selectDialog
 * (ham lop) bo qua tham so thu hai. Van la hop thoai modal — xem canh bao dau file.
 */
function vd_chonThuMuc(goiY, loiNhac) {
  try {
    var goc = goiY ? new Folder(goiY) : Folder.myDocuments;
    if (!goc.exists) goc = Folder.myDocuments;
    var f = goc.selectDlg(loiNhac || '');
    return 'OK:' + (f ? f.fsName : '');
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

/** Tim (hoac tao) bin "AiO Video Download" ngay duoi goc project. Tra null neu khong tao duoc. */
function vd_layBin() {
  var root = app.project.rootItem;
  for (var i = 0; i < root.children.numItems; i++) {
    var c = root.children[i];
    // type 2 = BIN (ProjectItemType.BIN)
    if (c && c.type === 2 && c.name === VD_TEN_BIN) return c;
  }
  var b = root.createBin(VD_TEN_BIN);
  // Tai lieu PPro: createBin tra 0 khi that bai (project chi doc...).
  if (!b || typeof b !== 'object') return null;
  return b;
}

/**
 * Tim moi project item dang tro toi DUNG file `duongDan` trong project DANG MO
 * (ca bin con, khong chi bin AiO — editor hay keo clip sang bin rieng).
 * Tra ve mang item (co the rong).
 *
 * ☠️ Bai 5t: KHONG khop chuoi con. Ket qua cua findItemsMatchingMediaPath duoc
 * SO LAI bang getMediaPath() da chuan hoa — ham do theo tai lieu la "khop chuoi",
 * chua ai noi no khop CA duong dan hay mot phan. Khong co ham do thi di cay tay.
 */
function vd__timItem(duongDan, diCay) {
  var muon = vd__chuan(duongDan);
  var kq = [];
  var root = app.project.rootItem;
  var ds = null;
  try {
    if (typeof root.findItemsMatchingMediaPath === 'function') ds = root.findItemsMatchingMediaPath(duongDan, 1);
  } catch (e) {
    ds = null;
  }
  if (ds && ds.length) {
    for (var i = 0; i < ds.length; i++) {
      try {
        if (vd__chuan(ds[i].getMediaPath()) === muon) kq.push(ds[i]);
      } catch (e2) {}
    }
    return kq;
  }
  // Do 21/09 (Premiere Beta, Test3_1 99 item): ham tim ra ca trong bin con, 1 ms;
  // nhung so CHINH XAC tung ky tu ('e:' thay 'E:' -> 0, gach xuoi -> 0). Nen:
  // trang thai song (goi nhieu) tin ket qua rong; luc NHAP (mot lan) thi di cay
  // them cho chac khong nhap trung.
  if (ds !== null && !diCay) return kq;
  // Duong lui: di het cay (type 1 = CLIP, 2 = BIN).
  function di(it) {
    for (var k = 0; k < it.children.numItems; k++) {
      var c = it.children[k];
      if (!c) continue;
      if (c.type === 2) di(c);
      else if (c.type === 1) {
        try {
          if (vd__chuan(c.getMediaPath()) === muon) kq.push(c);
        } catch (e3) {}
      }
    }
  }
  di(root);
  return kq;
}

/**
 * TRANG THAI SONG cua danh sach "Da tai" trong project DANG MO.
 * dsDuongDan: mang chuoi (panel truyen bang JSON.stringify — mang JSON la literal ES3 hop le).
 * Tra "OK:<project path>|c1,c2,..." — 0 = khong co trong project, 1 = co, 2 = co nhung OFFLINE.
 * Chi DOC, khong doi gi.
 */
function vd_trangThai(dsDuongDan) {
  try {
    if (!app.project || !app.project.rootItem) return 'ERR:KHONG_CO_PROJECT|';
    var ra = [];
    for (var i = 0; i < dsDuongDan.length; i++) {
      // Gach nguoc bang THAO TAC CHUOI (khong qua File: File giai ma %XX — xem vd__file).
      ra.push(vd__maTrangThai(vd__timItem(vd__gachNguoc(dsDuongDan[i]), false)));
    }
    return 'OK:' + (app.project.path || '') + '|' + ra.join(',');
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

/** 0 = khong co · 1 = co (it nhat mot item online) · 2 = chi co item offline. */
function vd__maTrangThai(items) {
  var ma = 0;
  for (var k = 0; k < items.length; k++) {
    var off = false;
    try {
      off = items[k].isOffline();
    } catch (e2) {}
    if (!off) return 1;
    ma = 2;
  }
  return ma;
}

/**
 * Dau hieu NHE cho vong tham do 2 s cua panel: doi thi panel moi goi vd_trangThai
 * cho CA danh sach. Gom: duong dan project + so item bin AiO + so item o goc +
 * ma trang thai cua RIENG nhung file panel dang bao "Trong project" (dsTheoDoi,
 * thuong it). ☠️ Soi 21/09: chi dem bin/goc thi xoa clip da keo sang bin KHAC
 * khong lam dau hieu doi -> nhan "Trong project" lai thanh AO. findItemsMatchingMediaPath
 * do 1 ms/file tren Test3_1.
 */
function vd_dauHieu(dsTheoDoi) {
  try {
    if (!app.project || !app.project.rootItem) return 'OK:||';
    var root = app.project.rootItem;
    var nBin = -1;
    for (var i = 0; i < root.children.numItems; i++) {
      var c = root.children[i];
      if (c && c.type === 2 && c.name === VD_TEN_BIN) {
        nBin = c.children.numItems;
        break;
      }
    }
    var ma = [];
    var ds = dsTheoDoi || [];
    for (var j = 0; j < ds.length; j++) ma.push(vd__maTrangThai(vd__timItem(vd__gachNguoc(ds[j]), false)));
    return 'OK:' + (app.project.path || '') + '|' + nBin + '|' + root.children.numItems + '|' + ma.join('');
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

/**
 * Nhap mot file da tai vao bin "AiO Video Download".
 * - projectKyVong: duong dan project luc NGUOI DUNG BAM (panel truyen). Project
 *   dang mo khac thi KHONG nhap bua — tra DOI_PROJECT de panel hoi lai.
 * - Kiem File.exists TRUOC: importFiles voi duong dan khong ton tai tra `true`
 *   ma khong tao item nao (bay da tra gia o Autocut).
 * - Da co o BAT CU DAU trong project thi khong nhap doi.
 * - Bang chung da nhap = tim thay item tro dung file SAU khi nhap (bai 5l:
 *   "khong bao loi" khong co nghia la "da ghi").
 */
function vd_nhap(duongDan, projectKyVong) {
  try {
    if (!app.project || !app.project.rootItem) return 'ERR:KHONG_CO_PROJECT|';
    if (projectKyVong && vd__chuan(app.project.path) !== vd__chuan(projectKyVong)) {
      return 'ERR:DOI_PROJECT|' + app.project.name;
    }
    // ☠️ Do 21/09: importFiles CUNG giai ma %XX -> bat hop modal "File Import
    // Failure" (chan MOI panel). Ten co '%' thi KHONG goi importFiles. Ban tai tu
    // 0.2.0 da doi '%' -> '％' trong ten; con file cu / file nguoi dung doi ten.
    if (String(duongDan).indexOf('%') >= 0) return 'ERR:PHAN_TRAM|';
    // vd__file: ma hoa '%' truoc (File giai ma %XX).
    var f = vd__file(duongDan);
    if (!f.exists) return 'ERR:KHONG_THAY_FILE|';
    // Duong dan THO (khong lay f.fsName — da qua giai ma) de importFiles + tim.
    var tho = vd__gachNguoc(duongDan);
    var co = vd__timItem(tho, true);
    if (co.length) return 'OK:DA_CO|' + (co[0].treePath || co[0].name);
    var bin = vd_layBin();
    if (!bin) return 'ERR:KHONG_TAO_BIN|';
    app.project.importFiles([tho], true, bin, false);
    // Kiem SAU cung di cay (doi xung voi kiem TRUOC — soi 21/09: Premiere co the
    // chuan hoa duong dan khac chuoi minh dua vao).
    var sau = vd__timItem(tho, true);
    if (!sau.length) return 'ERR:NHAP_LOI|';
    return 'OK:MOI|' + (sau[0].treePath || sau[0].name);
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}
// (vd_moThuMuc bang Folder.execute da BO 21/09: khong ai goi. Do tren Premiere 27:
//  `new Folder(<duong dan FILE>)` van la Folder, exists=true; execute() tren duong
//  dan file CHUA DO. "Mo thu muc" do bang cu bam chuot that: explorer KHONG
//  windowsHide len truoc Premiere — xem ytdlp.ts moThuMuc.)

/** Do moi truong — chi doc. */
function vd_probe() {
  try {
    var out = [];
    out.push('app=' + app.version);
    out.push('project=' + (app.project ? app.project.name : 'none'));
    out.push('path=' + (app.project && app.project.path ? app.project.path : ''));
    return 'OK:' + out.join(' | ');
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

/**
 * ☠️ PHAI LA HAM CUOI FILE. Panel nap lai file nay bang $.evalFile roi hoi ham
 * nay: tra dung phien ban = file da nap TRON; lech = dang chay host cu hoac nap
 * do dang (bay skill adobe-cep-panel 02/08). Doi so nay CUNG LUC voi package.json.
 */
function vd_phienBan() {
  return '0.2.1';
}
