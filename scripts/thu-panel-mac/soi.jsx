// soi.jsx - CHI DOC: moi sequence (clip tung track, khe ho, marker) + dem item. Loc theo tien to neu co.
var LOC = '__LOC__';
var p = app.project;
var T = 254016000000;
var ra = [];
function r2(x) { return Math.round(x * 100) / 100; }
var ss = p.sequences;
for (var s = 0; s < ss.numSequences; s++) {
  var q = ss[s];
  if (LOC !== '' && q.name.indexOf(LOC) !== 0) continue;
  var dong = 'SEQ|' + q.name + '|dai=' + r2(Number(q.end) / T) + '|' + q.frameSizeHorizontal + 'x' + q.frameSizeVertical;
  for (var v = 0; v < q.videoTracks.numTracks; v++) {
    var tr = q.videoTracks[v];
    var n = tr.clips.numItems;
    if (n === 0) continue;
    var ho = 0, hoMax = 0, ten = '';
    for (var c = 0; c < n; c++) {
      var cl = tr.clips[c];
      if (c > 0) { var g = cl.start.seconds - tr.clips[c - 1].end.seconds; if (g > 0.001) { ho++; if (g > hoMax) hoMax = g; } }
      if (c < 3) ten += (c ? ',' : '') + cl.name + '[' + r2(cl.start.seconds) + '-' + r2(cl.end.seconds) + ']';
    }
    dong += '|V' + (v + 1) + '=' + n + ' clip, ho ' + ho + (ho ? ' (max ' + r2(hoMax) + 's)' : '') + ' ' + ten;
  }
  for (var a = 0; a < q.audioTracks.numTracks; a++) {
    var ta = q.audioTracks[a];
    if (ta.clips.numItems > 0) dong += '|A' + (a + 1) + '=' + ta.clips.numItems;
  }
  var mk = 0;
  try { mk = q.markers.numMarkers; } catch (e) { mk = -1; }
  dong += '|marker=' + mk;
  ra.push(dong);
}
function dem(item) {
  var k = 0;
  for (var i = 0; i < item.children.numItems; i++) { k++; if (item.children[i].type === 2) k += dem(item.children[i]); }
  return k;
}
ra.push('TONG|sequences=' + ss.numSequences + '|items=' + dem(p.rootItem) + '|goc=' + p.rootItem.children.numItems + '|active=' + (p.activeSequence ? p.activeSequence.name : '-'));
return ra.join('\n');
