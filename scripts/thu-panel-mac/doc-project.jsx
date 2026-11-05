// doc-project.jsx - CHI DOC: liet ke project dang mo, moi item va moi sequence. ES3, khong ghi gi.
var p = app.project;
var ra = [];
ra.push('PROJECT|' + p.name + '|' + p.path + '|soProject=' + app.projects.numProjects);
function duyet(item, cap, duong) {
  var n = item.children ? item.children.numItems : 0;
  for (var i = 0; i < n; i++) {
    var c = item.children[i];
    var loai = c.type; // 1 clip, 2 bin, 3 root, 4 file
    var mp = '';
    var off = '';
    try { mp = c.getMediaPath ? String(c.getMediaPath()) : ''; } catch (e) { mp = '?'; }
    try { off = c.isOffline ? String(c.isOffline()) : ''; } catch (e2) { off = '?'; }
    var laSeq = '';
    try { laSeq = c.isSequence ? String(c.isSequence()) : ''; } catch (e3) { laSeq = '?'; }
    ra.push('ITEM|' + duong + c.name + '|type=' + loai + '|seq=' + laSeq + '|offline=' + off + '|' + mp);
    if (loai === 2) duyet(c, cap + 1, duong + c.name + '/');
  }
}
duyet(p.rootItem, 0, '');
var ss = p.sequences;
for (var s = 0; s < ss.numSequences; s++) {
  var q = ss[s];
  var v = '';
  for (var a = 0; a < q.videoTracks.numTracks; a++) v += (a ? ',' : '') + q.videoTracks[a].clips.numItems;
  var au = '';
  for (var b = 0; b < q.audioTracks.numTracks; b++) au += (b ? ',' : '') + q.audioTracks[b].clips.numItems;
  var dai = 0;
  try { dai = q.end ? Number(q.end) / 254016000000 : 0; } catch (e4) { dai = -1; }
  var mk = 0;
  try { mk = q.markers ? q.markers.numMarkers : 0; } catch (e5) { mk = -1; }
  ra.push('SEQ|' + q.name + '|id=' + q.sequenceID + '|V=' + v + '|A=' + au + '|dai=' + (Math.round(dai * 100) / 100) + '|marker=' + mk + '|' + q.frameSizeHorizontal + 'x' + q.frameSizeVertical);
}
var act = p.activeSequence;
ra.push('ACTIVE|' + (act ? act.name + '|' + act.sequenceID : 'khong co'));
return ra.join('\n');
