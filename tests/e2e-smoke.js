(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const names = () => [...document.querySelectorAll('.slot')].map((s) => s.querySelector('.name')?.textContent ?? null);
  const log = {};
  document.querySelector('.draw').click(); await sleep(900);
  log.first = names();
  document.querySelectorAll('[aria-label$="즐겨찾기"]')[0].click(); await sleep(200);
  const kept = names()[0];
  const seen = new Set(names().slice(1));
  let keptOk = true, dup = 0;
  for (let i = 0; i < 25; i++) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR' })); // spam: second press while busy
    await sleep(700);
    const n = names();
    if (n[0] !== kept) keptOk = false;
    for (const x of n.slice(1)) { if (seen.has(x)) dup++; seen.add(x); }
  }
  log.keptStays = keptOk; log.dupsIn50 = dup; log.kept = kept;
  log.note = document.querySelector('.draw-note').textContent;
  log.favCount = document.querySelector('.foot .count').textContent;
  // all three favourited -> redraw all
  const btns = () => document.querySelectorAll('.card-actions [aria-label$="즐겨찾기"]');
  btns()[1].click(); await sleep(100); btns()[2].click(); await sleep(100);
  const before = names(); document.querySelector('.draw').click(); await sleep(900);
  log.allKeptRedrawn = names().every((x, i) => x !== before[i]);
  // region switch remembers style
  const regionBtn = (t) => [...document.querySelectorAll('.seg.region button')].find((b) => b.textContent === t);
  regionBtn('서양풍').click(); await sleep(50);
  [...document.querySelectorAll('.chip')].find((b) => b.textContent === '독일식').click(); await sleep(50);
  regionBtn('동양풍').click(); await sleep(50);
  log.eastChips = [...document.querySelectorAll('[aria-labelledby="lbl-style"] .chip')].map((b) => b.textContent);
  regionBtn('서양풍').click(); await sleep(50);
  log.westRemembered = document.querySelector('[aria-labelledby="lbl-style"] .chip[aria-checked="true"]').textContent;
  document.querySelectorAll('.foot-btn')[0].click(); await sleep(300);
  log.drawerItems = document.querySelectorAll('.fav').length;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await sleep(200);
  // 최근 뽑기 되돌리기: draw, then 「↶ 이전」 brings the previous three back.
  const unfav = () => [...document.querySelectorAll('.card-actions [aria-label$="즐겨찾기"][aria-pressed="true"]')].forEach((b) => b.click());
  unfav(); await sleep(150);
  document.querySelector('.draw').click(); await sleep(900);
  const beforeUndo = names();
  document.querySelector('.draw').click(); await sleep(900);
  [...document.querySelectorAll('.side-btn')].find((b) => b.textContent.includes('이전')).click(); await sleep(300);
  log.undoRestores = JSON.stringify(names()) === JSON.stringify(beforeUndo);
  // 작품별 작업 공간: a new work keeps its own style; switching back restores the old one.
  const sel = document.querySelector('.work-pick select');
  const setSel = (v) => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, v); sel.dispatchEvent(new Event('change', { bubbles: true })); };
  setSel('__new'); await sleep(200);
  const inp = document.querySelector('.dialog input');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, '시험작품');
  inp.dispatchEvent(new Event('input', { bubbles: true })); await sleep(50);
  document.querySelector('.dialog form').requestSubmit(); await sleep(300);
  log.workActive = document.querySelector('.work-pick select').value;
  regionBtn('동양풍').click(); await sleep(50);
  [...document.querySelectorAll('.chip')].find((b) => b.textContent === '무협식').click(); await sleep(100);
  setSel(''); await sleep(300);
  log.defaultStyleBack = document.querySelector('[aria-labelledby="lbl-style"] .chip[aria-checked="true"]').textContent;
  setSel('시험작품'); await sleep(300);
  log.workStyleBack = document.querySelector('[aria-labelledby="lbl-style"] .chip[aria-checked="true"]').textContent;
  return log;
})()
