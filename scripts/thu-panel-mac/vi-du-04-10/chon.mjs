import { chay, es, CONG } from '../lib.mjs';
const ten = process.argv[2];
console.log('o chon tren panel: ' + await chay(CONG[ten], `(() => { const s = document.querySelector('select'); if (!s) return 'khong co select'; const o = s.options[s.selectedIndex]; return (o ? o.text : '?') + ' | value=' + s.value; })()`));
console.log('Premiere dang o: ' + await es('var a = app.project.activeSequence; return a.name + "|" + a.sequenceID + "|in=" + a.getInPoint() + "|out=" + a.getOutPoint();'));
