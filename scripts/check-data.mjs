#!/usr/bin/env node
// 이름 데이터 검사기 (의존성 없음). 사용: node scripts/check-data.mjs
// src/data/*.ts 는 "export const X: Type = {...}" 형태라 타입 표기만 정규식으로 지운 뒤 임시 .mjs로 불러온다.
// 오류(exit 1): 빈 필드, 한글 아닌 ko, 원어 표기 형식 오류, 중복, 최소 수량 미달, 차단어 포함 이름/조합.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src', 'data');
const tmp = mkdtempSync(join(tmpdir(), 'name-atelier-check-'));

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function stripTypes(src) {
  return src
    .replace(/^\s*import\s+type[^;]*;\s*$/gm, '')
    .replace(/^\s*export\s+type\s*\{[^}]*\}[^;]*;\s*$/gm, '')
    .replace(/export\s+interface\s+\w+(\s+extends\s+[\w,\s]+)?\s*\{[^}]*\}\s*/g, '')
    .replace(/(export\s+const\s+\w+)\s*:\s*[\w[\]<>]+\s*=/g, '$1 =');
}
async function load(rel) {
  const src = stripTypes(readFileSync(join(dataDir, rel), 'utf8'));
  const out = join(tmp, rel.replace(/[\\/]/g, '_').replace(/\.ts$/, '.mjs'));
  writeFileSync(out, src, 'utf8');
  return import(pathToFileURL(out).href);
}

const HANGUL = /^[가-힣]+$/;
const CJK = /[㐀-䶿一-鿿豈-﫿]/;
const JP_ORIG = /^[㐀-䶿一-鿿豈-﫿぀-ヿ々]+$/;
const KO_ORIG = /^([가-힣]+|[㐀-䶿一-鿿豈-﫿]+)$/;
const LATIN = /^[\p{Script=Latin}'’\- ]+$/u;
const ROMAN = /^[A-Za-z][A-Za-z' -]*$/;
const GENRES = new Set(['fantasy', 'romance', 'modern', 'murim']);
const MIN = {
  ko: { m: 150, f: 150, u: 40, s: 70 },
  rofan: { m: 120, f: 120, u: 0, s: 100 },
  us: { m: 120, f: 120, u: 20, s: 80 },
  gb: { m: 120, f: 120, u: 20, s: 80 },
  fr: { m: 120, f: 120, u: 20, s: 80 },
  de: { m: 120, f: 120, u: 10, s: 80 }, // 독일은 실제 공용 이름이 적어 u 기준 완화(SOURCES.md)
  jp: { m: 120, f: 120, u: 20, s: 80 },
};

const { BLOCK_SUBSTRINGS: BLOCK } = await load('blocklist.ts');
const compact = (s) => s.replace(/\s+/g, '');
const hit = (s) => {
  const c = compact(s);
  for (const b of BLOCK) if (c.includes(b)) return b;
  return null;
};

// 분위기 태그: 모든 이름·한자 음절에 era(m/c)·tone(s/h)·flair(p/f)가 있어야 한다.
const MOOD_OK = { era: ['m', 'c'], tone: ['s', 'h'], flair: ['p', 'f'] };
const moodCount = {};
function checkMood(n, where) {
  const key = where.split(']')[0] + ']';
  moodCount[key] ??= { m: 0, c: 0, s: 0, h: 0, p: 0, f: 0, total: 0 };
  moodCount[key].total++;
  for (const [axis, ok] of Object.entries(MOOD_OK)) {
    if (!ok.includes(n[axis])) err(`${where}: 분위기 ${axis} 누락/오류 (${n[axis]})`);
    else moodCount[key][n[axis]]++;
  }
}

// ── 실재 문화권 + 로판 스타일 ──
const files = { ko: 'names/ko.ts', rofan: 'names/rofan.ts', us: 'names/us.ts', gb: 'names/gb.ts', fr: 'names/fr.ts', de: 'names/de.ts', jp: 'names/jp.ts' };
const styles = {};
for (const [id, rel] of Object.entries(files)) {
  const mod = await load(rel);
  styles[id] = id === 'rofan' ? mod.ROFAN : mod.STYLE;
}
const PARTICLE = { de: '폰', fr: '드' }; // 엔진이 판타지·로맨스 장르에서 끼워 넣는 귀족 소사

const table = [];
for (const [id, st] of Object.entries(styles)) {
  const P = `[${id}]`;
  if (!st || st.id !== id) { err(`${P} id 불일치 또는 export 누락`); continue; }
  if (!st.label) err(`${P} label 비어 있음`);
  const western = !['ko', 'jp'].includes(id);
  const checkOrig = (o, where) => {
    if (!o) return err(`${P} ${where}: orig 비어 있음`);
    if (id === 'ko' && !KO_ORIG.test(o)) err(`${P} ${where}: orig는 한자 또는 한글이어야 함 → ${o}`);
    if (id === 'jp' && !(JP_ORIG.test(o) && CJK.test(o))) err(`${P} ${where}: 일본 orig에 한자가 필요 → ${o}`);
    if (western && !LATIN.test(o)) err(`${P} ${where}: 라틴 문자 원철자 아님 → ${o}`);
  };
  const checkCommon = (n, where) => {
    if (!n.ko) err(`${P} ${where}: ko 비어 있음`);
    else if (!HANGUL.test(n.ko)) err(`${P} ${where}: ko에 한글 외 문자 → "${n.ko}"`);
    checkOrig(n.orig, where);
    if (id === 'ko' || id === 'jp') {
      if (!n.roman) err(`${P} ${where}: roman 누락`);
      else if (!ROMAN.test(n.roman)) err(`${P} ${where}: roman 형식 → ${n.roman}`);
    }
    for (const t of n.tags ?? []) if (!GENRES.has(t)) err(`${P} ${where}: 알 수 없는 tag ${t}`);
    const b = n.ko && hit(n.ko);
    if (b) err(`${P} ${where}: 이름 자체에 차단어 "${b}"`);
  };
  const cnt = { m: 0, f: 0, u: 0 };
  const seen = new Set();
  const seenOrig = new Set();
  for (const n of st.given) {
    const where = `given ${n.ko}/${n.orig}`;
    checkCommon(n, where);
    if (!['m', 'f', 'u'].includes(n.g)) err(`${P} ${where}: g 값 오류 ${n.g}`);
    else cnt[n.g]++;
    const k = `${n.ko}|${n.g}`;
    if (seen.has(k)) err(`${P} 중복 given (ko+g): ${n.ko} ${n.g}`);
    seen.add(k);
    checkMood(n, `${P} ${where}`);
    const ko2 = `${n.orig}|${n.g}`;
    if (seenOrig.has(ko2)) err(`${P} 중복 given (orig+g): ${n.orig} ${n.g}`);
    seenOrig.add(ko2);
  }
  const sSeen = new Set();
  for (const s of st.surnames) {
    checkCommon(s, `surname ${s.ko}/${s.orig}`);
    if (sSeen.has(s.ko)) err(`${P} 중복 surname: ${s.ko}`);
    sSeen.add(s.ko);
  }
  const min = MIN[id];
  for (const g of ['m', 'f', 'u']) if (cnt[g] < min[g]) err(`${P} ${g} ${cnt[g]}개 < 최소 ${min[g]}`);
  if (st.surnames.length < min.s) err(`${P} surname ${st.surnames.length}개 < 최소 ${min.s}`);

  // 차단어 조합 전수 검사(이름×성, 독·불은 귀족 소사 포함)
  let combos = 0;
  const hits = [];
  const joins = id in PARTICLE ? ['', PARTICLE[id]] : [''];
  for (const g of st.given) for (const s of st.surnames) for (const mid of joins) {
    combos++;
    const full = st.order === 'surname-first' ? s.ko + g.ko : g.ko + mid + s.ko;
    const b = hit(full);
    if (b) hits.push(`${full}(${b})`);
  }
  if (hits.length) err(`${P} 차단어 조합 ${hits.length}건: ${hits.slice(0, 12).join(', ')}${hits.length > 12 ? ' …' : ''}`);
  table.push({ style: id, m: cnt.m, f: cnt.f, u: cnt.u, surnames: st.surnames.length, combos, blocked: hits.length });
}

// 미국/영국 이름 겹침(같은 한글 표기) 비율
{
  const us = new Set(styles.us.given.map((n) => n.ko));
  const gb = new Set(styles.gb.given.map((n) => n.ko));
  const both = [...gb].filter((k) => us.has(k));
  const ratio = both.length / Math.min(us.size, gb.size);
  const line = `us/gb 이름 겹침 ${both.length}개 (${(ratio * 100).toFixed(1)}%)`;
  // 두 스타일의 차이를 지키기 위해 겹침은 현재 수준(14개, 6%)을 넘기지 않는다.
  if (both.length > 14 || ratio > 0.06) err(`${line}: 한도(14개·6%) 초과 → ${both.join(', ')}`);
  else console.log(`· ${line}: ${both.join(', ')}`);
}

// ── 창작 판타지 음절 풀 ──
{
  const { FANTASY: F } = await load('names/fantasy.ts');
  const pools = ['head', 'mid', 'tailM', 'tailF', 'tailU', 'houseHead', 'houseTail', 'murimSurname', 'murimGivenM', 'murimGivenF'];
  for (const p of pools) {
    const arr = F[p];
    if (!Array.isArray(arr) || arr.length < 25) { err(`[fantasy] ${p} 개수 부족(${arr?.length})`); continue; }
    const set = new Set();
    for (const s of arr) {
      if (!s || !HANGUL.test(s)) err(`[fantasy] ${p}: 한글 아님 "${s}"`);
      if (set.has(s)) err(`[fantasy] ${p}: 중복 "${s}"`);
      set.add(s);
      const b = s && hit(s);
      if (b) err(`[fantasy] ${p}: 차단어 "${s}"`);
    }
  }
  for (const s of [...F.murimGivenM, ...F.murimGivenF]) if (s.length !== 1) err(`[fantasy] murimGiven은 한 음절이어야 함: ${s}`);
  for (const s of F.murimSurname) if (s.length > 2) err(`[fantasy] murimSurname은 1~2음절: ${s}`);
  const hits = new Set();
  let n = 0;
  const test = (s) => { n++; const b = hit(s); if (b) hits.add(`${s}(${b})`); };
  const tails = [...F.tailM, ...F.tailF, ...F.tailU];
  const givens = [];
  for (const h of F.head) for (const t of tails) { givens.push(h + t); for (const m of F.mid) givens.push(h + m + t); }
  givens.forEach(test);
  const houses = [];
  for (const a of F.houseHead) for (const b of F.houseTail) houses.push(a + b);
  houses.forEach(test);
  // 이름 끝 + 가문명 경계: (mid+)tail × 가문명 전체
  const ends = new Set(tails);
  for (const m of F.mid) for (const t of tails) ends.add(m + t);
  for (const e of ends) for (const h of houses) test(e + h);
  for (const s of F.murimSurname) for (const pool of [F.murimGivenM, F.murimGivenF]) for (const a of pool) for (const b of pool) if (a !== b) test(s + a + b);
  if (hits.size) err(`[fantasy] 차단어 조합 ${hits.size}건: ${[...hits].slice(0, 15).join(', ')}`);
  table.push({ style: 'fantasy', m: F.tailM.length, f: F.tailF.length, u: F.tailU.length, surnames: F.houseHead.length * F.houseTail.length, combos: n, blocked: hits.size });
}

// ── 무협/선협 한자 음절 풀 ──
{
  const H = await load('names/hanja.ts');
  for (const name of ['MURIM', 'XIANXIA']) {
    const P = `[${name}]`;
    const pool = H[name];
    if (!pool) { err(`${P} export 누락`); continue; }
    const sSeen = new Set();
    for (const s of pool.surnames) {
      if (!s.ko || !HANGUL.test(s.ko)) err(`${P} surname ko 오류 "${s.ko}"`);
      if (!s.hanja || ![...s.hanja].every((c) => CJK.test(c))) err(`${P} surname hanja는 한자만: "${s.hanja}"`);
      else if ([...s.hanja].length !== s.ko.length) err(`${P} surname 글자 수 불일치 ${s.ko}/${s.hanja}`);
      if (s.initial && (!HANGUL.test(s.initial) || s.initial.length !== s.ko.length)) err(`${P} surname initial 오류 ${s.initial}`);
      if (sSeen.has(s.hanja)) err(`${P} 중복 surname ${s.hanja}`);
      sSeen.add(s.hanja);
    }
    const gSeen = new Set();
    const cnt = { m: 0, f: 0, u: 0 };
    for (const g of pool.given) {
      if (!g.ko || !HANGUL.test(g.ko) || g.ko.length !== 1) err(`${P} given ko는 한 음절 한글: "${g.ko}"`);
      if (!g.hanja || [...g.hanja].length !== 1 || !CJK.test(g.hanja)) err(`${P} given hanja는 한자 한 글자: "${g.hanja}"`);
      if (g.initial && (!HANGUL.test(g.initial) || g.initial.length !== 1)) err(`${P} given initial 오류 ${g.initial}`);
      if (!['m', 'f', 'u'].includes(g.g)) err(`${P} given g 오류 ${g.hanja}`);
      else cnt[g.g]++;
      if (gSeen.has(g.hanja)) err(`${P} 중복 given ${g.hanja}`);
      gSeen.add(g.hanja);
      if (hit(g.ko)) err(`${P} 차단어 음절 ${g.ko}`);
      if (!g.hun) err(`${P} 훈 누락 ${g.hanja}`);
      else if (!/^[가-힣]+( [가-힣]+)*$/.test(g.hun)) err(`${P} 훈 형식 ${g.hanja} → ${g.hun}`);
      checkMood(g, `${P} given ${g.hanja}`);
    }
    if (pool.surnames.length < 40) err(`${P} surname ${pool.surnames.length}개 < 40`);
    if (pool.given.length < 120) err(`${P} given ${pool.given.length}개 < 120`);
    // 성 + 이름 두 음절(두음법칙 형태 포함) 전수 검사
    const hits = new Set();
    let n = 0;
    const forms = (x) => (x.initial ? [x.ko, x.initial] : [x.ko]);
    for (const gender of ['m', 'f']) {
      const gp = pool.given.filter((x) => x.g === gender || x.g === 'u');
      for (const s of pool.surnames) for (const sk of forms(s)) for (const a of gp) for (const ak of forms(a)) for (const b of gp) {
        if (a === b) continue;
        n++;
        const full = sk + ak + b.ko;
        const hb = hit(full);
        if (hb) hits.add(`${full}(${hb})`);
      }
    }
    if (hits.size) err(`${P} 차단어 조합 ${hits.size}건: ${[...hits].slice(0, 15).join(', ')}`);
    table.push({ style: name.toLowerCase(), m: cnt.m, f: cnt.f, u: cnt.u, surnames: pool.surnames.length, combos: n, blocked: hits.size });
  }
}

rmSync(tmp, { recursive: true, force: true });

console.log('\n스타일      남   여   공용  성(가문)   검사 조합   차단');
for (const r of table) console.log(`${r.style.padEnd(10)} ${String(r.m).padStart(4)} ${String(r.f).padStart(4)} ${String(r.u).padStart(5)} ${String(r.surnames).padStart(8)} ${String(r.combos).padStart(11)} ${String(r.blocked).padStart(6)}`);
console.log('\n분위기 태그   현대/고전  부드러운/강한  평범/화려');
for (const [k, c] of Object.entries(moodCount)) {
  const pct = (a, b) => `${Math.round((100 * a) / (a + b || 1))}/${Math.round((100 * b) / (a + b || 1))}%`;
  console.log(`${k.padEnd(12)} ${pct(c.m, c.c).padStart(9)} ${pct(c.s, c.h).padStart(13)} ${pct(c.p, c.f).padStart(10)}`);
  // A side with almost nothing would make that 분위기 choice useless for the style.
  for (const [a, b, label] of [['m', 'c', '시대감'], ['s', 'h', '느낌'], ['p', 'f', '개성']]) if (Math.min(c[a], c[b]) < 0.1 * c.total) warnings.push(`${k} ${label} 한쪽이 10% 미만 (${c[a]}/${c[b]})`);
}
for (const w of warnings) console.log(`경고: ${w}`);
if (errors.length) {
  console.error(`\n오류 ${errors.length}건:`);
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}
console.log('\n데이터 검사 통과.');
