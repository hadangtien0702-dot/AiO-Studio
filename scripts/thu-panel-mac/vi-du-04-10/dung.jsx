// dung.jsx - TU DUNG moi truong thu: 1 bin rieng + file thu rieng + sequence rieng. Khong dung item nao san co.
var TEN_BIN = 'CL04 thu Claude 04-10';
var THU_MUC = '__THU_MUC__';
var FILES = ['T55.mp4', 'T14.mp4'];
var p = app.project;
var root = p.rootItem;
var ra = [];
// chot: chua co bin trung ten
for (var i = 0; i < root.children.numItems; i++) {
  if (root.children[i].name === TEN_BIN) return 'ERR:DA_CO_BIN|' + TEN_BIN;
}
var duong = [];
for (var f = 0; f < FILES.length; f++) {
  var ff = new File(THU_MUC + '/' + FILES[f]);
  if (!ff.exists) return 'ERR:THIEU_FILE|' + FILES[f];
  duong.push(THU_MUC + '/' + FILES[f]);
}
var bin = root.createBin(TEN_BIN);
if (!bin) return 'ERR:KHONG_TAO_DUOC_BIN';
var ok = p.importFiles(duong, true, bin, false);
ra.push('IMPORT|' + ok + '|trongBin=' + bin.children.numItems);
var item = {};
for (var c = 0; c < bin.children.numItems; c++) item[bin.children[c].name] = bin.children[c];
if (!item['T55.mp4'] || !item['T14.mp4']) return 'ERR:IMPORT_THIEU|' + ra.join(';');
var ds = [['CL04 autocut', 'T55.mp4'], ['CL04 phude', 'T55.mp4'], ['CL04 shortviral', 'T55.mp4'], ['CL04 guide', 'T14.mp4'], ['CL04 reframe', 'T14.mp4']];
for (var s = 0; s < ds.length; s++) {
  var q = p.createNewSequenceFromClips(ds[s][0], [item[ds[s][1]]], bin);
  if (!q) { ra.push('SEQ_LOI|' + ds[s][0]); continue; }
  ra.push('SEQ|' + q.name + '|' + q.sequenceID + '|V1=' + q.videoTracks[0].clips.numItems + '|A1=' + q.audioTracks[0].clips.numItems + '|dai=' + (Math.round(Number(q.end) / 254016000000 * 100) / 100));
}
ra.push('BIN|' + bin.name + '|con=' + bin.children.numItems);
return ra.join('\n');
