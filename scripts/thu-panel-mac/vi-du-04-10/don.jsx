// don.jsx - don nhung thu DO BAI THU 04/10 TAO RA trong project. CHE_DO = 'LIET_KE' (chi doc) hoac 'LAM'.
// Giu nguyen: 8 sequence + 13 item goc co tu truoc khi thu (danh sach chup luc 00:42).
var CHE_DO = '__CHE_DO__';
var SEQ_GOC = { '2cc07a5d-5ebc-473c-8e66-2c9b045ac4a7': 1, '2cf26a9a-360e-4452-ae13-c71f6700bc88': 1, '646bc4e4-b3c6-41a9-8054-6edc0d3ae267': 1,
  '75a345ec-0db9-4b64-bbdd-62354a9a8fa2': 1, '8604a014-7e46-413e-8c86-de867b659cd4': 1, 'bc97dc64-39d8-4144-9aff-2d1b79924ad2': 1,
  'c4557a5f-9e98-47da-b883-1bd9310b3753': 1, 'da353211-695b-4bc9-ac28-b6cc0e50f5de': 1 };
var ITEM_GOC = { 'Test noi chuyen.mp4': 1, 'AiO Mac Test': 1, 'AiO Mac Test - autocut 1940': 1, 'AiO Mac Test - autocut 1958': 1, 'Test dai.mp4': 1,
  'AiO Mac Test dai': 1, 'Test dai 2.mp4': 1, 'AiO Mac Test dai 2': 1, 'AiO Mac Test dai 2 - autocut 2007': 1, 'Test dai 3.mp4': 1,
  'AiO Mac Test dai 3': 1, 'AiO Mac Test dai 3 - autocut 2025': 1, 'Test dai 2-autocut-203247.srt': 1 };
var p = app.project, root = p.rootItem, ra = [];

// 1. sequence khong thuoc danh sach goc
var seqXoa = [];
for (var s = 0; s < p.sequences.numSequences; s++) {
  var q = p.sequences[s];
  if (!SEQ_GOC[q.sequenceID]) seqXoa.push(q);
}
for (var a = 0; a < seqXoa.length; a++) ra.push('SEQ_THU|' + seqXoa[a].name + '|' + seqXoa[a].sequenceID);

// 2. item o goc khong thuoc danh sach goc
var itemXoa = [];
for (var i = 0; i < root.children.numItems; i++) {
  var c = root.children[i];
  if (!ITEM_GOC[c.name]) itemXoa.push(c);
}
for (var b = 0; b < itemXoa.length; b++) ra.push('GOC_THU|' + itemXoa[b].name + '|type=' + itemXoa[b].type + '|con=' + (itemXoa[b].type === 2 ? itemXoa[b].children.numItems : '-'));

if (CHE_DO !== 'LAM') { ra.push('TONG|seq thu=' + seqXoa.length + '|muc goc thu=' + itemXoa.length + '|seq tat ca=' + p.sequences.numSequences + '|goc tat ca=' + root.children.numItems); return ra.join('\n'); }

// ---- LAM ----
// mo mot sequence goc truoc de timeline khong dung o sequence sap xoa
p.openSequence('bc97dc64-39d8-4144-9aff-2d1b79924ad2');
var daXoaSeq = 0, loiSeq = 0;
for (var d = seqXoa.length - 1; d >= 0; d--) {
  var ok = false;
  try { ok = p.deleteSequence(seqXoa[d]); } catch (e) { ok = false; }
  if (ok) daXoaSeq++; else loiSeq++;
}
// lay lai danh sach item goc (xoa sequence lam doi chi so)
var conLai = [];
for (var j = 0; j < root.children.numItems; j++) { var x = root.children[j]; if (!ITEM_GOC[x.name]) conLai.push(x); }
var tam = null, daXoaBin = 0, daDua = 0;
for (var k = 0; k < conLai.length; k++) {
  var it = conLai[k];
  if (it.type === 2) { try { it.deleteBin(); daXoaBin++; } catch (e2) {} }
  else { if (!tam) tam = root.createBin('__CL04_tam__'); try { it.moveBin(tam); daDua++; } catch (e3) {} }
}
if (tam) { try { tam.deleteBin(); } catch (e4) {} }
ra.push('DA_LAM|xoa seq=' + daXoaSeq + ' (loi ' + loiSeq + ')|xoa bin=' + daXoaBin + '|item le dua vao bin tam roi xoa=' + daDua);
ra.push('SAU|seq=' + p.sequences.numSequences + '|goc=' + root.children.numItems);
return ra.join('\n');
