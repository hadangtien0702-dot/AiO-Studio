/**
 * videodownload.jsx — phan ExtendScript cua AiO Video Download.
 *
 * Panel lam viec TAI (yt-dlp) o phia Node/CEP; file nay chi lo ba viec can
 * Premiere: goi y thu muc luu, mo hop chon thu muc, va NHAP file da tai vao
 * bin cua project. Moi ham tra ve chuoi "OK:..." hoac "ERR:MA|chi tiet" —
 * panel doc bang parseResult() trong lib/cep.ts.
 *
 * ☠️ KHONG dung QE DOM o day. Khong co ly do gi de dung — importFiles la API
 * cong khai, da chay that o Asset Manager / Podcast / Guide Frame.
 */

var VD_TEN_BIN = 'AiO Video Download';

/** Thu muc cua file project dang mo — de goi y noi luu video tai ve. */
function vd_thuMucProject() {
  try {
    if (!app.project || !app.project.path) return 'ERR:KHONG_CO_PROJECT|Chua mo project nao';
    var f = new File(app.project.path);
    if (!f.parent) return 'ERR:KHONG_CO_PROJECT|Project chua luu';
    return 'OK:' + f.parent.fsName;
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

/** Mo hop thoai chon thu muc cua he dieu hanh. Tra "OK:duong" hoac "OK:" neu huy. */
function vd_chonThuMuc(goiY) {
  try {
    var f = Folder.selectDialog('Chon thu muc luu video', goiY ? new Folder(goiY) : undefined);
    return 'OK:' + (f ? f.fsName : '');
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

/** Tim (hoac tao) bin "AiO Video Download" ngay duoi goc project. */
function vd_layBin() {
  var root = app.project.rootItem;
  for (var i = 0; i < root.children.numItems; i++) {
    var c = root.children[i];
    // type 2 = BIN (ProjectItemType.BIN)
    if (c && c.type === 2 && c.name === VD_TEN_BIN) return c;
  }
  return root.createBin(VD_TEN_BIN);
}

/**
 * Nhap mot file da tai vao bin "AiO Video Download".
 * Kiem File.exists TRUOC — importFiles voi duong dan khong ton tai tra ve
 * `true` ma khong tao item nao (bay da tra gia o Autocut, ghi o autocut.jsx:861).
 * Kem dem so item truoc/sau lam bang chung da nhap that (bai 5l: "khong bao
 * loi" khong co nghia la "da ghi").
 */
function vd_nhap(duongDan) {
  try {
    if (!app.project) return 'ERR:KHONG_CO_PROJECT|Chua mo project nao';
    var f = new File(duongDan);
    if (!f.exists) return 'ERR:KHONG_THAY_FILE|' + duongDan;
    var bin = vd_layBin();
    var truoc = bin.children.numItems;
    // Neu file nay da nam trong bin roi (tai lai cung link) thi khong nhap doi.
    for (var i = 0; i < truoc; i++) {
      var c = bin.children[i];
      try {
        if (c.getMediaPath && c.getMediaPath() === f.fsName) return 'OK:DA_CO|' + c.name;
      } catch (e2) {}
    }
    var ok = app.project.importFiles([f.fsName], true, bin, false);
    var sau = bin.children.numItems;
    if (sau <= truoc) return 'ERR:NHAP_LOI|importFiles tra ve ' + ok + ' nhung khong tao item nao';
    return 'OK:' + bin.children[sau - 1].name;
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

/**
 * Dem clip trong bin "AiO Video Download" — de panel biet project hien tai
 * da co gi (tool phai DONG HANH: mo project khac thi so phai doi theo).
 */
function vd_demTrongBin() {
  try {
    if (!app.project) return 'OK:0';
    var root = app.project.rootItem;
    for (var i = 0; i < root.children.numItems; i++) {
      var c = root.children[i];
      if (c && c.type === 2 && c.name === VD_TEN_BIN) return 'OK:' + c.children.numItems;
    }
    return 'OK:0';
  } catch (e) {
    return 'ERR:LOI|' + e.toString();
  }
}

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
