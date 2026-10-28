// E2E smoke test preko Chrome DevTools protokola (bez dodatnih paketa).
// Upotreba: npm run build && npx vite preview --port 4173 &  →  node tests/e2e/smoke.mjs [chromePath] [outDir]
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.argv[2] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.argv[3] ?? 'tests/e2e/out';
const BASE = (process.env.BASE_URL ?? 'http://localhost:4173/') + '?e2e=';
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const port = 9400 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'tabla-'))}`, '--window-size=1366,768', '--lang=bs', 'about:blank'], { stdio: 'ignore' });
let ws, id = 0;
const pending = new Map();
const errors = [];

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) { ws = new WebSocket(page.webSocketDebuggerUrl); break; }
    } catch { /* još se pokreće */ }
    await sleep(200);
  }
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  });
}
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const click = sel => evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.disabled) return false; e.click(); return true; })()`);
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64'));
}
async function settle() {
  // klik preskače animaciju bodovanja; čekamo dok UI ne javi da je slobodan
  await sleep(60);
  for (let i = 0; i < 60; i++) {
    if (!(await evaluate('window.__tablaBusy && window.__tablaBusy()'))) return;
    await evaluate('document.querySelector("#app").click()');
    await sleep(50);
  }
}
const waitFor = async (sel, ms = 8000) => { for (let i = 0; i < ms / 100; i++) { if (await evaluate(`!!document.querySelector(${JSON.stringify(sel)})`)) return true; await sleep(100); } return false; };
const text = sel => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);
const phase = () => evaluate(`(() => { const r = JSON.parse(localStorage.getItem('tabla.run.v1') || 'null'); return r ? r.phase : null })()`);

let failed = false;
const check = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failed = true; };

try {
  await connect();
  await send('Page.enable'); await send('Runtime.enable');
  // ---- tutorijal, lekcija 1
  await send('Page.navigate', { url: BASE + '1#tutorial' });
  check(await waitFor('[data-a="tutNext"]'), 'tutorijal se učitao');
  await shot('01-tutorial');
  check(await click('[data-a="tutNext"]'), 'tutorijal: korak "Dalje"');
  await sleep(150);
  check(await click('[data-card="t7C"]'), 'tutorijal: izbor 7♣ u ruci');
  await sleep(150);
  check(await click('[data-card="t7H"]'), 'tutorijal: izbor 7♥ na stolu');
  await sleep(150);
  check(await evaluate(`!document.querySelector('[data-a="capture"]').disabled`), 'NOSI je aktivno za validan izbor');
  await click('[data-a="capture"]');
  await settle();
  check((await text('#scoreVal'))?.trim() === '24', 'Par 7/7 daje 24 boda');
  // ---- prava partija
  await send('Page.navigate', { url: BASE + '2#play=SMOKE001' });
  await waitFor('[data-a="capture"]');
  await shot('02-round');
  check(await click('[data-a="best"]'), 'NAJBOLJE radi prvi put');
  await sleep(200);
  check(await evaluate(`document.querySelector('[data-a="best"]').disabled`), 'NAJBOLJE je zaključano nakon jednog korištenja');
  let rounds = 0, guard = 0;
  while (guard++ < 120) {
    const scr = await evaluate(`(() => { if (document.querySelector('[data-a="capture"]')) return 'round'; if (document.querySelector('[data-type="collect"]')) return 'cashout'; if (document.querySelector('[data-a="leaveShop"]')) return 'shop'; if (document.querySelector('[data-type="startRound"]')) return 'map'; if (document.querySelector('[data-type="packSkip"]')) return 'pack'; return 'other'; })()`);
    if (scr === 'round') {
      await evaluate('window.__tablaSuggest && window.__tablaSuggest()'); await sleep(80);
      if (!(await click('[data-a="capture"]'))) { await click('#hand .card'); await sleep(60); await click('[data-a="lay"]'); }
      await settle();
    } else if (scr === 'cashout') { if (rounds === 0) await shot('03-cashout'); await click('[data-type="collect"]'); rounds++; await sleep(300); }
    else if (scr === 'shop') {
      if (rounds === 1) await shot('04-shop');
      await click('[data-type="buy"]:not([disabled])'); await sleep(200);
      await click('[data-a="leaveShop"]'); await sleep(200); await click('[data-a="leaveShop"]'); await sleep(300);
    } else if (scr === 'map') { if (rounds === 1) await shot('05-map'); await click('[data-type="startRound"]'); await sleep(400); }
    else if (scr === 'pack') { await click('[data-type="packSkip"]'); await sleep(200); }
    else break;
    if (rounds >= 3) break;
  }
  await shot('06-end');
  check(rounds >= 1, `odigrano ${rounds} rundi kroz UI`);
  check(['map', 'round', 'shop', 'gameover', 'cashout', 'pack'].includes(await phase()), 'partija je snimljena u localStorage');
  // ---- klasični Tablić protiv kompjutera
  await send('Page.navigate', { url: BASE + '3#classic' });
  check(await waitFor('[data-a="cLay"]'), 'klasični Tablić se učitao');
  await shot('09-classic');
  let aiMoves = 0;
  for (let i = 0; i < 6; i++) {
    for (let w = 0; w < 40 && !(await evaluate(`!!document.querySelector('[data-a="cHand"]:not([disabled])')`)); w++) await sleep(150);
    if (await click('[data-a="cBest"]')) { await sleep(120); }
    if (!(await click('[data-a="cCapture"]'))) { await click('[data-a="cHand"]'); await sleep(80); await click('[data-a="cLay"]'); }
    await sleep(1500);
    const txt = await text('.center .hint');
    if (txt && /Kompjuter|Computer/.test(txt)) aiMoves++;
  }
  await shot('10-classic-after');
  check(aiMoves >= 3, `kompjuter je odigrao poteze (${aiMoves})`);
  // ---- meni i ostali ekrani
  await send('Page.navigate', { url: BASE + '4' });
  await sleep(2200);
  await shot('07-menu');
  for (const to of ['collection', 'settings', 'rules', 'stats', 'mode']) {
    await click(`[data-to="${to}"]`); await sleep(300); await shot('08-' + to); await click('[data-to="menu"]'); await sleep(200);
  }
  check(errors.length === 0, 'nema JS grešaka u konzoli' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
} catch (e) {
  console.error(e); failed = true;
} finally {
  try { ws?.close(); } catch { /* */ }
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F']); else chrome.kill();
}
process.exit(failed ? 1 : 0);
