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
  return log;
})()
