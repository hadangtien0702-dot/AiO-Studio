'use strict'
/* Thuoc QUAY 3 GIAY (29/09): main goi window.datSo(n) moi giay (3-2-1) va window.datKhung(k) sau moi khung chup xong.
   Ngon ngu + vi tri (tren/duoi vung) qua query ?lang=vi|en&vi=tren|duoi. */
const q = new URLSearchParams(location.search)
const soEl = document.getElementById('so')
const oKhung = [...document.querySelectorAll('#khung i')]
document.getElementById('giay').textContent = q.get('lang') === 'en' ? 'sec' : 'giây'
document.body.classList.add(q.get('vi') === 'duoi' ? 'duoi' : 'tren')
window.datSo = (n) => { soEl.textContent = String(n) }
window.datKhung = (k) => { oKhung.forEach((o, i) => o.classList.toggle('co', i < k)) }
