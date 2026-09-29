'use strict'
/* Ve cac net cam cua 1 canh vien quay tu query ?s=[[x,y,w,h],...] (toa do DIP trong cua so, tinh o src/vien-quay.js). */
let net = []
try { net = JSON.parse(new URLSearchParams(location.search).get('s') || '[]') } catch (e) {}
for (const [x, y, w, h] of net) {
  const i = document.createElement('i')
  i.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px'
  document.body.appendChild(i)
}
