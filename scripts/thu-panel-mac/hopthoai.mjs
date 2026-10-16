// hopthoai.mjs <cong> <accept|dismiss>: xu ly hop confirm()/alert() dang mo trong trang panel
const [cong, kieu = 'accept'] = process.argv.slice(2);
const ds = await (await fetch('http://127.0.0.1:' + cong + '/json')).json();
const t = ds.find((x) => x.webSocketDebuggerUrl);
const ws = new WebSocket(t.webSocketDebuggerUrl);
const het = setTimeout(() => { console.log('het gio 8 s'); process.exit(1); }, 8000);
ws.onopen = () => { ws.send(JSON.stringify({ id: 1, method: 'Page.enable' })); ws.send(JSON.stringify({ id: 2, method: 'Page.handleJavaScriptDialog', params: { accept: kieu === 'accept' } })); };
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.method === 'Page.javascriptDialogOpening') console.log('hop dang mo: [' + m.params.type + '] ' + m.params.message); if (m.id === 2) { console.log('tra loi hop thoai (' + kieu + '): ' + JSON.stringify(m.error || m.result)); clearTimeout(het); ws.close(); setTimeout(() => process.exit(0), 300); } };
