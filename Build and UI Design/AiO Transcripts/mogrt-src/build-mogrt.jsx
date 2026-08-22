// =============================================================================
//  build-mogrt.jsx — SINH CAC FILE .mogrt CAPTION (Hormozi / Beast / Karaoke /
//  Boxed / Clean) BANG SCRIPT AFTER EFFECTS, khong mo tay AE.
// =============================================================================
//  Chay:
//    "C:\Program Files\Adobe\Adobe After Effects (Beta)\Support Files\AfterFX (Beta).exe"
//        -noui -r "<duong dan>\build-mogrt.jsx"
//  Ket qua: thu muc ../mogrt/*.mogrt + build-log.txt (doc log de biet font co an khong).
//
//  MOI MOGRT CO CUNG BO THAM SO (panel Transcripts dat gia tri qua
//  trackItem.getMGTComponent()):
//    Text            chu cua khoi caption (panel tu in hoa neu kieu can)
//    Position Y      lech doc so voi tam khung (px). Doc 9:16 ~ +520, ngang ~ +380
//    Highlight Word  so thu tu tu duoc to mau (1-based). 0 = khong to
//    Highlight Color mau to
//    Pop In          bat/tat hieu ung phong to khi vao
//    Word Timing     "0,0.35,0.8" moc bat dau tung tu (giay, tinh tu dau clip)
//                    -> KARAOKE: tu dang noi tu sang. Rong = dung Highlight Word.
//
//  Comp 1920x1920 (vuong): Premiere dat MOGRT o TAM sequence, khong scale ->
//  cung mot file dung duoc cho ca 16:9 lan 9:16, chi doi Position Y.
//
//  ☠️ ExtendScript = ES3: khong map/forEach/arrow/const. Vong for tran.
// =============================================================================
(function () {
  // ☠️ Duong dan TUYET DOI, khong suy tu $.fileName: chay bang `AfterFX -r` thi
  // $.fileName khong dang tin (da vap 22/08: log ghi lac cho, tuong script khong chay).
  var OUT = new Folder('E:/2026/Production/AiO Studio/Build and UI Design/AiO Transcripts/mogrt');
  if (!OUT.exists) OUT.create();
  var LOG = new File(OUT.fsName + '/build-log.txt');
  var DA_LOG = [];   // ban sao trong bo nho — tra ve qua BridgeTalk neu chay tu Premiere
  LOG.open('w'); LOG.writeln('build-mogrt ' + new Date().toString() + ' | $.fileName=' + $.fileName); LOG.close();
  function log(s) { DA_LOG.push(String(s)); LOG.open('a'); LOG.writeln(String(s)); LOG.close(); }

  // ── Bang kieu ─────────────────────────────────────────────────────────────
  // font = ten PostScript. Khong co font thi AE tu thay -> log se bao.
  // ☠️ `motBieuThuc: true` cho MOI kieu: Premiere chi chay expression MOT bieu thuc
  // (do 22/08 qua 14 template thu A..N — xem khoi ghi chu phia duoi).
  var KIEU = [
    { ten: 'AiO Caption - Hormozi', font: 'Montserrat-Black',     size: 120, fill: [1, 1, 1],
      stroke: [0, 0, 0], strokeW: 18, tracking: 10, hl: [1, 0.84, 0, 1], pop: true,
      shadow: false, box: false, hlMacDinh: 0, motBieuThuc: true },
    { ten: 'AiO Caption - Beast',   font: 'Bangers-Regular',      size: 150, fill: [1, 0.87, 0.1],
      stroke: [0, 0, 0], strokeW: 24, tracking: 30, hl: [1, 0.25, 0.2, 1], pop: true, popManh: true,
      shadow: true, box: false, hlMacDinh: 0, motBieuThuc: true },
    { ten: 'AiO Caption - Karaoke', font: 'Montserrat-ExtraBold', size: 96,  fill: [1, 1, 1],
      stroke: [0, 0, 0], strokeW: 12, tracking: 0, hl: [0.25, 1, 0.45, 1], pop: false,
      shadow: true, box: false, hlMacDinh: 0, motBieuThuc: true },
    { ten: 'AiO Caption - Boxed',   font: 'Montserrat-ExtraBold', size: 100, fill: [1, 1, 1],
      stroke: null, strokeW: 0, tracking: 0, hl: [1, 0.84, 0, 1], pop: false,
      shadow: false, box: true, boxColor: [0, 0, 0], boxAlpha: 0.85, boxPad: 36, boxRound: 22, hlMacDinh: 0, motBieuThuc: true },
    { ten: 'AiO Caption - Clean',   font: 'Montserrat-SemiBold',  size: 84,  fill: [1, 1, 1],
      stroke: null, strokeW: 0, tracking: 0, hl: [1, 1, 1, 1], pop: false,
      shadow: true, box: false, hlMacDinh: 0, motBieuThuc: true }
    // (22/08 tung co them 'Hormozi (Inter)' — ban spike dung font Inter da cai san de
    //  tach loi "chuoi MOGRT hong" khoi "Premiere chua thay font moi". Da xong viec,
    //  go khoi bo vi panel quet thu muc mogrt/ va se hien no thanh mot kieu thua.)
  ];

  // Chi build mot so kieu? Dat ten vao day; rong = build het.
  var CHI_BUILD = [];
  // ── Template THU de co lap loi selector tren Premiere (22/08). Bo khi xong. ──
  // Ket qua 22/08: A/B/C (expression selector, textIndex) -> Premiere KHONG to tu
  // nao; template that (co doc layer Word Timing) -> to CA CAU (loi -> 100%).
  // => expression selector khong dung duoc tren Premiere. Thu RANGE SELECTOR:
  // D/E (range selector + EXPRESSION tren Start/End) -> van to CA CAU: Premiere
  // khong chay expression tren thuoc tinh text animator. Thu khong-expression:
  // F (range tinh) va G (Start/End len EG) -> CHAY tren Premiere: to dung mot tu.
  // Tiep: Text Size=50 khong co chu -> expression Scale cung khong chay. Thu:
  //   H: scale = chi phep nhan voi slider (khong clamp/linear/thisLayer.name/inPoint)
  //   I: H + pop bang `time` va Math thuan
  // H (scale = Text Size/100) va I (pop) -> KHONG doi kich thuoc tren Premiere.
  // Co lap tiep: J = scale doc tu slider "Position Y" (slider da chung minh chay
  // o Position); K = scale HANG SO [50,50] (expression thuan, khong doc gi).
  // J (var + slider) KHONG co, K ([50,50] hang so) CO -> ☠️ ENGINE MOGRT CUA
  // PREMIERE CHI CHAY EXPRESSION DANG MOT BIEU THUC, KHONG CHAY CAU LENH (var/if/for).
  // Tu day moi expression viet MOT bieu thuc (ternary, Math, effect(), time).
  // Test L = Hormozi viet lai theo luat do; N = Boxed (hop nen) theo luat do.
  // L (Hormozi viet lai 1 bieu thuc) va N (Boxed) -> DEU CHAY: pop, Text Size,
  // Highlight Word, hop nen. Cac template thu A..N da go (xem git log 22/08).

  // ── BIEU THUC MOT DONG (luat Premiere) ──
  // Scale: Text Size (%) x pop (60 -> dinh -> 100 trong 0,22 s, tat duoc bang
  // checkbox Pop In). `time` = giay tu dau clip.
  function exprScale1(pop, dinh) {
    var co = 'effect("Text Size")("Slider")';
    if (!pop) return '[' + co + ', ' + co + ']';
    var p = '(effect("Pop In")("Checkbox") < 0.5 ? 100 : (time < 0.10 ? (60 + (' + dinh + ' - 60) * time / 0.10) : (time < 0.22 ? (' + dinh + ' - (' + dinh + ' - 100) * (time - 0.10) / 0.12) : 100)))';
    return '[' + co + ' * ' + p + ' / 100, ' + co + ' * ' + p + ' / 100]';
  }
  var EXPR_ANCHOR1 = '[sourceRectAtTime(time, false).left + sourceRectAtTime(time, false).width / 2, sourceRectAtTime(time, false).top + sourceRectAtTime(time, false).height / 2]';
  var EXPR_HL_START1 = 'Math.max(0, Math.round(effect("Highlight Word")("Slider")) - 1)';
  var EXPR_HL_END1 = 'Math.max(0, Math.round(effect("Highlight Word")("Slider")))';
  var EXPR_BOX_SIZE1 = '[thisComp.layer("Caption").sourceRectAtTime(time, false).width + 2 * thisComp.layer("Caption").effect("Box Padding")("Slider"), thisComp.layer("Caption").sourceRectAtTime(time, false).height + 2 * thisComp.layer("Caption").effect("Box Padding")("Slider")]';
  var EXPR_BOX_POS1 = '[thisComp.layer("Caption").sourceRectAtTime(time, false).left + thisComp.layer("Caption").sourceRectAtTime(time, false).width / 2, thisComp.layer("Caption").sourceRectAtTime(time, false).top + thisComp.layer("Caption").sourceRectAtTime(time, false).height / 2]';

  // Range selector: act = tu dang noi bat (1-based; 0 = khong). Start = act-1, End = act
  // theo don vi INDEX, Based On WORDS -> chon dung MOT tu.
  var EXPR_ACT_SLIDER = 'Math.max(0, Math.round(effect("Highlight Word")("Slider")))';
  var EXPR_ACT_KARAOKE = '' +
    'var act = Math.max(0, Math.round(effect("Highlight Word")("Slider")));\n' +
    'var moc = "";\n' +
    'try { moc = String(thisComp.layer("Word Timing").text.sourceText); } catch (e) { moc = ""; }\n' +
    'moc = moc.replace(/^\\s+|\\s+$/g, "");\n' +
    'if (moc != "") {\n' +
    '  var arr = moc.split(",");\n' +
    '  act = 0;\n' +
    '  var tt = time - inPoint;\n' +
    '  for (var k = 0; k < arr.length; k++) { if (tt >= parseFloat(arr[k])) act = k + 1; }\n' +
    '}\n' +
    'act';

  // ── Bieu thuc (AE JavaScript engine) ─────────────────────────────────────
  // ☠️ Slider dua len Essential Graphics bi Premiere KEP 0..100 (do 22/08: dat 420
  // doc lai 100). Nen Position Y = PHAN TRAM chieu cao comp (0 = mep tren, 100 = day).
  var EXPR_POS = '[thisComp.width/2, thisComp.height * clamp(effect("Position Y")("Slider"), 0, 100) / 100]';

  // Text Size (%) = co chu rieng tung clip: panel ha xuong khi mot tu Latin dai
  // hon dong (thay vi be tu). Nhan vao scale de ca pop lan co deu dung.
  var EXPR_SCALE = 'var co = clamp(effect("Text Size")("Slider"), 10, 100) / 100;\n' +
    'var on = effect("Pop In")("Checkbox");\n' +
    'if (on < 0.5) { [100 * co, 100 * co]; } else {\n' +
    '  var t = time - inPoint;\n' +
    '  var a = thisLayer.name.indexOf("Beast") >= 0 ? 115 : 108;\n' +
    '  var s = (t < 0.10) ? linear(t, 0, 0.10, 60, a) : ((t < 0.22) ? linear(t, 0.10, 0.22, a, 100) : 100);\n' +
    '  [s * co, s * co];\n}';

  // ☠️ Bo chon (selector) dat "Based On = Words" -> `textIndex` la SO THU TU TU,
  // khong phai ky tu. Ban dau dem ky tu trong chuoi `text.sourceText` de suy ra
  // tu: chay o AE nhung tren Premiere Beta 27 thi TO CA CAU (do 22/08: Hormozi
  // vang het, Beast do het) — engine cua Premiere khong cho dem ky tu nhu AE.
  // Dem theo tu thi khong can doc chuoi nua.
  var EXPR_SEL = '' +
    'var act = Math.round(effect("Highlight Word")("Slider"));\n' +
    'var moc = "";\n' +
    'try { moc = thisComp.layer("Word Timing").text.sourceText.value; } catch (e) { moc = ""; }\n' +
    'moc = String(moc).replace(/^\\s+|\\s+$/g, "");\n' +
    'if (moc != "") {\n' +
    '  var arr = moc.split(",");\n' +
    '  act = 0;\n' +
    '  var tt = time - inPoint;\n' +
    '  for (var k = 0; k < arr.length; k++) { if (tt >= parseFloat(arr[k])) act = k + 1; }\n' +
    '}\n' +
    'var a = (textIndex == act) ? 100 : 0;\n' +
    '[a, a, a];';

  var EXPR_FILL = 'effect("Highlight Color")("Color")';

  // Hop nen (Boxed): bam theo kich thuoc chu, parent vao layer chu.
  var EXPR_BOX_SIZE = 'var r = thisComp.layer("Caption").sourceRectAtTime(time, false);\n' +
    'var p = effect("Box Padding")("Slider");\n[r.width + p*2, r.height + p*2];';
  var EXPR_BOX_POS = 'var r = thisComp.layer("Caption").sourceRectAtTime(time, false);\n' +
    '[r.left + r.width/2, r.top + r.height/2];';

  function rgb(c) { return [c[0], c[1], c[2]]; }

  function fontCo(psName) {
    try {
      if (app.fonts && app.fonts.getFontsByPostScriptName) {
        var f = app.fonts.getFontsByPostScriptName(psName);
        return f && f.length > 0;
      }
    } catch (e) {}
    return null; // khong biet
  }

  function dung(k) {
    log('--- ' + k.ten + ' (font ' + k.font + ', co=' + fontCo(k.font) + ')');
    var comp = app.project.items.addComp(k.ten, 1920, 1920, 1.0, 10, 30);
    comp.motionGraphicsTemplateName = k.ten;

    // (Layer an "Word Timing" cho karaoke DA GO 22/08: Premiere khong chay
    //  expression nhieu dong nen khong doc duoc chuoi moc; karaoke nay do host
    //  che khoi thanh clip con theo tung tu — xem ac_datCaptionMogrt.)

    // Layer chu chinh.
    var tl = comp.layers.addText('MAKE MORE MONEY');
    tl.name = 'Caption';
    var docProp = tl.property('ADBE Text Properties').property('ADBE Text Document');
    var doc = docProp.value;
    doc.resetCharStyle();
    doc.font = k.font;
    doc.fontSize = k.size;
    doc.applyFill = true; doc.fillColor = rgb(k.fill);
    if (k.stroke) { doc.applyStroke = true; doc.strokeColor = rgb(k.stroke); doc.strokeWidth = k.strokeW; doc.strokeOverFill = false; }
    else { doc.applyStroke = false; }
    doc.tracking = k.tracking;
    doc.justification = ParagraphJustification.CENTER_JUSTIFY;
    doc.leading = Math.round(k.size * 1.05);
    doc.text = 'MAKE MORE MONEY';
    docProp.setValue(doc);
    // Doc lai xem AE giu font gi (neu thieu font thi day la cho lo ra)
    try { var d2 = docProp.value; log('  font doc lai=' + d2.font + ' | family=' + (d2.fontFamily || '?') + ' | style=' + (d2.fontStyle || '?')); } catch (e) { log('  doc lai font loi ' + e); }

    // Neo chu o giua (anchor = tam hop chu) de pop phong tu tam.
    tl.property('ADBE Transform Group').property('ADBE Anchor Point').expression = k.motBieuThuc
      ? EXPR_ANCHOR1
      : 'var r = sourceRectAtTime(time, false); [r.left + r.width/2, r.top + r.height/2];';

    // Dieu khien
    var fx = tl.property('ADBE Effect Parade');
    var fxY = fx.addProperty('ADBE Slider Control'); fxY.name = 'Position Y';
    fxY.property('ADBE Slider Control-0001').setValue(75);   // % chieu cao; doc 9:16 ~75, ngang 16:9 ~70
    var fxHL = fx.addProperty('ADBE Slider Control'); fxHL.name = 'Highlight Word';
    fxHL.property('ADBE Slider Control-0001').setValue(k.hlMacDinh);
    var fxCol = fx.addProperty('ADBE Color Control'); fxCol.name = 'Highlight Color';
    fxCol.property('ADBE Color Control-0001').setValue(k.hl);
    var fxPop = fx.addProperty('ADBE Checkbox Control'); fxPop.name = 'Pop In';
    fxPop.property('ADBE Checkbox Control-0001').setValue(k.pop ? 1 : 0);
    var fxCo = fx.addProperty('ADBE Slider Control'); fxCo.name = 'Text Size';
    fxCo.property('ADBE Slider Control-0001').setValue(100);
    if (k.box) {
      var fxPad = fx.addProperty('ADBE Slider Control'); fxPad.name = 'Box Padding';
      fxPad.property('ADBE Slider Control-0001').setValue(k.boxPad);
    }
    if (k.shadow) {
      var sh = fx.addProperty('ADBE Drop Shadow');
      sh.property('ADBE Drop Shadow-0001').setValue([0, 0, 0, 1]);   // color
      sh.property('ADBE Drop Shadow-0002').setValue(200);            // opacity (0-255)
      sh.property('ADBE Drop Shadow-0003').setValue(135);            // direction
      sh.property('ADBE Drop Shadow-0004').setValue(k.box ? 0 : 10); // distance
      sh.property('ADBE Drop Shadow-0005').setValue(18);             // softness
    }

    tl.property('ADBE Transform Group').property('ADBE Position').expression = EXPR_POS;
    tl.property('ADBE Transform Group').property('ADBE Scale').expression =
      k.motBieuThuc ? exprScale1(k.pop, k.popManh ? 115 : 108) : (k.scaleExpr || EXPR_SCALE);

    // Animator to mau tu noi bat
    var anims = tl.property('ADBE Text Properties').property('ADBE Text Animators');
    var an = anims.addProperty('ADBE Text Animator'); an.name = 'Highlight';
    var fill = an.property('ADBE Text Animator Properties').addProperty('ADBE Text Fill Color');
    fill.expression = EXPR_FILL;
    if (k.rangeSel || k.motBieuThuc) {
      // RANGE SELECTOR (chuan, Premiere ho tro): don vi Index, theo Tu.
      var rs = an.property('ADBE Text Selectors').addProperty('ADBE Text Selector');
      try {
        var adv = rs.property('ADBE Text Range Advanced');
        adv.property('ADBE Text Range Units').setValue(2);   // 1 Percentage, 2 Index
        adv.property('ADBE Text Range Type2').setValue(3);   // 3 Words
        log('  range selector: Index + Words');
      } catch (e) { log('  range selector advanced LOI ' + e); }
      if (k.motBieuThuc) {
        // Mot bieu thuc tu slider "Highlight Word" -> mot tham so cho nguoi dung.
        rs.property('ADBE Text Index Start').expression = EXPR_HL_START1;
        rs.property('ADBE Text Index End').expression = EXPR_HL_END1;
        log('  range Start/End = 1 bieu thuc tu Highlight Word');
      } else if (k.rangeStatic) {
        rs.property('ADBE Text Index Start').setValue(1);
        rs.property('ADBE Text Index End').setValue(2);
        log('  range static 1..2');
      } else if (k.rangeEG) {
        rs.property('ADBE Text Index Start').setValue(1);
        rs.property('ADBE Text Index End').setValue(2);
        try { rs.property('ADBE Text Index Start').addToMotionGraphicsTemplateAs(comp, 'HL Start'); log('  EG HL Start ok'); } catch (e) { log('  EG HL Start LOI ' + e); }
        try { rs.property('ADBE Text Index End').addToMotionGraphicsTemplateAs(comp, 'HL End'); log('  EG HL End ok'); } catch (e) { log('  EG HL End LOI ' + e); }
      } else {
        var exprAct = k.rangeKaraoke ? EXPR_ACT_KARAOKE : EXPR_ACT_SLIDER;
        rs.property('ADBE Text Index Start').expression = 'var act = (function(){ ' + exprAct.replace(/\bact$/, 'return act;') + ' })();\nMath.max(0, act - 1)';
        rs.property('ADBE Text Index End').expression = 'var act = (function(){ ' + exprAct.replace(/\bact$/, 'return act;') + ' })();\nMath.max(0, act)';
      }
    } else {
      var sel = an.property('ADBE Text Selectors').addProperty('ADBE Text Expressible Selector');
      // Based On: 1 Characters · 2 Characters Excluding Spaces · 3 WORDS · 4 Lines
      try { sel.property('ADBE Text Range Type2').setValue(3); log('  selector Based On = Words'); }
      catch (e) { log('  KHONG dat duoc Based On=Words: ' + e); }
      sel.property('ADBE Text Expressible Amount').expression = k.exprSel || EXPR_SEL;
    }

    // Hop nen
    if (k.box) {
      var box = comp.layers.addShape(); box.name = 'Box';
      var grp = box.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group');
      var rect = grp.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Rect');
      rect.property('ADBE Vector Rect Size').expression = k.motBieuThuc ? EXPR_BOX_SIZE1 : EXPR_BOX_SIZE;
      rect.property('ADBE Vector Rect Roundness').setValue(k.boxRound);
      var bf = grp.property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Fill');
      bf.property('ADBE Vector Fill Color').setValue([k.boxColor[0], k.boxColor[1], k.boxColor[2], 1]);
      bf.property('ADBE Vector Fill Opacity').setValue(k.boxAlpha * 100);
      box.parent = tl;
      box.property('ADBE Transform Group').property('ADBE Position').expression = k.motBieuThuc ? EXPR_BOX_POS1 : EXPR_BOX_POS;
      box.moveAfter(tl);   // nam DUOI chu
    }

    // Dua len Essential Graphics
    // ☠️ Tham chieu effect (fxY, fxHL...) bi "Object is invalid" sau khi them effect
    // khac vao cung Effect Parade (vap 22/08, dong 199). Tra lai theo TEN luc dung.
    function egFx(ten, matchParam) {
      return tl.property('ADBE Effect Parade').property(ten).property(matchParam);
    }
    var docProp2 = tl.property('ADBE Text Properties').property('ADBE Text Document');
    docProp2.addToMotionGraphicsTemplateAs(comp, 'Text');
    egFx('Position Y', 'ADBE Slider Control-0001').addToMotionGraphicsTemplateAs(comp, 'Position Y');
    egFx('Highlight Word', 'ADBE Slider Control-0001').addToMotionGraphicsTemplateAs(comp, 'Highlight Word');
    egFx('Highlight Color', 'ADBE Color Control-0001').addToMotionGraphicsTemplateAs(comp, 'Highlight Color');
    egFx('Pop In', 'ADBE Checkbox Control-0001').addToMotionGraphicsTemplateAs(comp, 'Pop In');
    egFx('Text Size', 'ADBE Slider Control-0001').addToMotionGraphicsTemplateAs(comp, 'Text Size');
    if (k.box) egFx('Box Padding', 'ADBE Slider Control-0001').addToMotionGraphicsTemplateAs(comp, 'Box Padding');

    // ☠️ Export doi project KHONG CO THAY DOI CHUA LUU — them comp xong la dirty lai,
    // nen phai save() NGAY TRUOC moi lan export (vap 22/08: hop "The project needs
    // to be saved first" treo script).
    try { app.project.save(); } catch (e) { log('  save truoc export LOI ' + e.toString()); }
    var ok = false;
    try { ok = comp.exportAsMotionGraphicsTemplate(true, OUT.fsName); }
    catch (e) { log('  export LOI ' + e.toString()); }
    log('  export=' + ok);
    return ok;
  }

  try {
    log('AE ' + app.version + ' | isoLang ' + app.isoLanguage);
    // ☠️ Export bung hop thoai "fonts were not synced from Adobe" (Bangers, Inter
    // Display, Times New Roman cua layer an) -> treo script cho toi khi co nguoi
    // bam OK (vap 22/08, phai gui phim Enter tu ngoai). Tat het hop thoai trong
    // luc script chay; bat lai o cuoi.
    try { app.beginSuppressDialogs(); log('suppressDialogs: bat'); } catch (e) { log('suppressDialogs LOI ' + e); }
    if (app.project === null) app.newProject();
    // ☠️ exportAsMotionGraphicsTemplate doi project DA LUU — khong thi AE bung hop
    // thoai "Save As" va treo script (vap 22/08). Luu vao file tam trong mogrt/.
    try {
      var aep = new File(OUT.fsName + '/aio-captions-build.aep');
      app.project.save(aep);
      log('project da luu: ' + aep.fsName + ' | exists=' + aep.exists);
    } catch (e) { log('LUU PROJECT LOI ' + e.toString()); }
    var soOk = 0;
    for (var i = 0; i < KIEU.length; i++) {
      var chon = CHI_BUILD.length === 0;
      for (var j = 0; j < CHI_BUILD.length; j++) if (CHI_BUILD[j] === KIEU[i].ten) chon = true;
      if (!chon) continue;
      try { if (dung(KIEU[i])) soOk++; } catch (e) { log('  LOI ' + e.toString() + ' line ' + e.line); }
    }
    log('XONG ' + soOk + '/' + KIEU.length);
    // Liet ke file ra
    var fs = OUT.getFiles('*.mogrt');
    for (var f = 0; f < fs.length; f++) log('  file ' + fs[f].name + ' ' + fs[f].length + ' bytes');
  } catch (e) { log('LOI NGOAI ' + e.toString() + ' line ' + e.line); }

  try { app.endSuppressDialogs(false); } catch (e) {}
  // Dong project (khong luu) nhung GIU AE MO — lan build sau khoi khoi dong lai.
  try { app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); } catch (e) {}
  try { app.newProject(); } catch (e) {}
  return DA_LOG.join('\n');
})();
