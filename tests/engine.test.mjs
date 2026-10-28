// Engine tests: bundles src/engine with esbuild and checks generation, de-duplication, quality filters and export.
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(mkdtempSync(join(tmpdir(), 'na-test-')), 'engine.mjs');
await build({ stdin: { contents: "export * from './src/engine/generate'; export * from './src/engine/exporting'; export { STYLES, MURIM, XIANXIA } from './src/data/names';", resolveDir: root, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
const E = await import(pathToFileURL(out).href);

let pass = 0;
const fails = [];
const check = (name, ok, detail = '') => (ok ? pass++ : fails.push(`${name}${detail ? ` — ${detail}` : ''}`));

const HANGUL = /^[가-힣]+( [가-힣]+)*$/;
const genres = E.GENRES.map((g) => g.id);
const styles = E.STYLE_OPTIONS.map((s) => s.id);
const genders = E.GENDERS.map((g) => g.id);
const report = {};

// 1. Every combination yields 3 distinct, clean names; 30 rerolls with history don't repeat (where the pool is big enough).
for (const genre of genres)
  for (const style of styles)
    for (const gender of genders) {
      const rng = E.seeded(genre.length * 1000 + style.length * 10 + gender.length);
      const seen = new Set();
      let repeats = 0;
      let repeatedFlag = false;
      for (let round = 0; round < 30; round++) {
        const r = E.generate({ genre, style, gender, count: 3, avoid: seen, rng });
        const key = `${genre}/${style}/${gender}`;
        if (round === 0) {
          check(`${key} gives 3`, r.names.length === 3, `got ${r.names.length}`);
          check(`${key} distinct`, new Set(r.names.map((n) => n.id)).size === r.names.length);
        }
        for (const n of r.names) {
          if (seen.has(n.id)) repeats++;
          seen.add(n.id);
          if (!HANGUL.test(n.ko)) fails.push(`${key} non-Hangul ko: "${n.ko}"`);
          if (E.isBlocked(n.ko)) fails.push(`${key} blocked word: ${n.ko}`);
          if (n.style !== style || n.genre !== genre || n.gender !== gender) fails.push(`${key} wrong labels on ${n.ko}`);
        }
        repeatedFlag ||= r.repeated;
      }
      const pool = E.poolSize(style, gender);
      report[`${style}/${gender}`] = pool;
      if (pool >= 500) check(`${genre}/${style}/${gender} no repeats in 90`, repeats === 0 && !repeatedFlag, `${repeats} repeats`);
    }

// 2. No cross-culture mixing: real-style names use that style's own surname and given name.
for (const S of E.STYLES) {
  const surs = new Set(S.surnames.map((s) => s.ko));
  const givens = new Set(S.given.map((g) => g.ko));
  const rng = E.seeded(7);
  let bad = 0;
  for (let i = 0; i < 300; i++) {
    const [n] = E.generate({ genre: 'modern', style: S.id, gender: 'any', count: 1, rng }).names;
    const parts = n.ko.split(' ');
    const ok = S.id === 'ko' ? [...surs].some((s) => n.ko.startsWith(s) && givens.has(n.ko.slice(s.length))) : S.order === 'surname-first' ? surs.has(parts[0]) && givens.has(parts.slice(1).join(' ')) : givens.has(parts[0]) && surs.has(parts.slice(1).join(' '));
    if (!ok) bad++;
  }
  check(`${S.id} no cross-culture mixing`, bad === 0, `${bad}/300 not from ${S.id} lists`);
}

// 3. Gender filter: male/female requests never return names marked for the other gender.
for (const S of E.STYLES) {
  const g = new Map(S.given.map((x) => [x.ko, x.g]));
  for (const want of ['m', 'f']) {
    const rng = E.seeded(11);
    let wrong = 0;
    for (let i = 0; i < 200; i++) {
      const [n] = E.generate({ genre: 'modern', style: S.id, gender: want, count: 1, rng }).names;
      const given = S.order === 'surname-first' ? (S.id === 'ko' ? [...g.keys()].find((k) => n.ko.endsWith(k) && n.ko.length > k.length) : n.ko.split(' ').slice(1).join(' ')) : n.ko.split(' ')[0];
      const gg = g.get(given);
      if (gg && gg !== want && gg !== 'u') wrong++;
    }
    check(`${S.id} gender ${want}`, wrong === 0, `${wrong} wrong`);
  }
}

// 3b. 선협식·무협식: one hanja per Hangul syllable, and the hanja really come from that style's pools.
for (const [id, pools] of [['xianxia', E.XIANXIA], ['murim', E.MURIM]]) {
  const allowed = new Set([...pools.surnames.flatMap((s) => [...s.hanja]), ...pools.given.map((g) => g.hanja)]);
  const rng = E.seeded(5);
  let bad = 0;
  for (let i = 0; i < 300; i++) {
    const [n] = E.generate({ genre: 'murim', style: id, gender: 'any', count: 1, rng }).names;
    if ([...n.orig].length !== [...n.ko].length || ![...n.orig].every((c) => allowed.has(c))) bad++;
  }
  check(`${id} hanja matches reading`, bad === 0, `${bad}/300`);
}

// 4. Exhausted pool: avoiding everything returns quickly with repeated=true instead of looping forever.
{
  const S = E.STYLES[0];
  const all = new Set();
  for (const s of S.surnames) for (const g of S.given) all.add(`${S.id}:${S.id === 'ko' || S.order === 'surname-first' ? s.ko + g.ko : g.ko + s.ko}`.replace(/\s/g, ''));
  const t = Date.now();
  const r = E.generate({ genre: 'modern', style: S.id, gender: 'any', count: 3, avoid: all, rng: E.seeded(3) });
  check('exhausted pool flags repeated', r.repeated === true);
  // Hard exclusion (names on screen) is never used even as the exhausted-pool fallback.
  const onScreen = r.names.map((n) => n.id);
  const r2 = E.generate({ genre: 'modern', style: S.id, gender: 'any', count: 3, avoid: all, exclude: onScreen, rng: E.seeded(4) });
  check('exclude never returned', r2.names.every((n) => !onScreen.includes(n.id)));
  check('exhausted pool returns fast', Date.now() - t < 500, `${Date.now() - t}ms`);
}

// 5. Export formats.
{
  const rows = [
    { ko: '샬럿 펨버턴', orig: 'Charlotte Pemberton', genre: 'romance', style: 'gb', gender: 'f', savedAt: '2026-10-28T05:00:00Z' },
    { ko: '장뤽 "드" 모로', orig: 'Jean-Luc, de Moreau', genre: 'fantasy', style: 'fr', gender: 'm' },
  ];
  const csv = E.toCsv(rows);
  check('csv BOM', csv.charCodeAt(0) === 0xfeff);
  check('csv header', csv.includes('이름,원어 표기,로마자,장르,이름 스타일,성별 분류,저장일'));
  check('csv escaping', csv.includes('"장뤽 ""드"" 모로"') && csv.includes('"Jean-Luc, de Moreau"'));
  const txt = E.toTxt(rows, '테스트');
  check('txt content', txt.includes('샬럿 펨버턴 (Charlotte Pemberton)') && txt.includes('로맨스 · 영국식 · 여성 · 저장 2026-10-28'));
  check('clipboard text', E.toClipboardText(rows).split('\n').length === 2);
  check('korean copy has no romanization', E.copyLabel({ ko: '김서준', orig: 'Kim Seo-jun', style: 'ko' }) === '김서준');
  check('hanja copy shows hanja', E.copyLabel({ ko: '백연화', orig: '白蓮花', style: 'murim' }) === '백연화 (白蓮花)');
}

// 6. Name sanity: given ≠ surname, no stutter syllables in invented names.
{
  for (const S of E.STYLES) {
    const rng = E.seeded(21);
    let same = 0;
    for (let i = 0; i < 400; i++) {
      const [n] = E.generate({ genre: 'romance', style: S.id, gender: 'any', count: 1, rng }).names;
      const p = n.ko.split(' ');
      if (p.length >= 2 && p[0] === p[p.length - 1]) same++;
    }
    check(`${S.id} given ≠ surname`, same === 0, `${same}`);
  }
  const rng = E.seeded(9);
  let stutter = 0;
  for (let i = 0; i < 2000; i++) {
    const [n] = E.generate({ genre: 'fantasy', style: 'fantasy', gender: 'any', count: 1, rng }).names;
    if (/(.)\1/.test(n.ko.split(' ')[0]) || /레에|노온|시일|에엘/.test(n.ko)) stutter++;
  }
  check('invented names have no stutter', stutter === 0, `${stutter}`);
}

// 7. 성 고정: every name keeps the locked surname, given names still vary.
for (const style of ['ko', 'rofan', 'de', 'jp', 'xianxia', 'murim', 'fantasy']) {
  const rng = E.seeded(31);
  const [first] = E.generate({ genre: 'fantasy', style, gender: 'any', count: 20, rng }).names.filter((n) => n.surname);
  if (!first) {
    fails.push(`${style} has no surname to lock`);
    continue;
  }
  const r = E.generate({ genre: 'fantasy', style, gender: 'any', count: 12, fixedSurname: first.surname, rng });
  check(`${style} fixed surname kept`, r.names.length === 12 && r.names.every((n) => n.surname?.ko === first.surname.ko && n.ko.includes(first.surname.ko)), r.names.map((n) => n.ko).join(','));
  check(`${style} fixed surname varies given`, new Set(r.names.map((n) => n.given)).size >= 10);
  const other = E.generate({ genre: 'fantasy', style: style === 'ko' ? 'jp' : 'ko', gender: 'any', count: 5, fixedSurname: first.surname, rng });
  check(`${style} fixed surname ignored for other style`, other.names.every((n) => n.surname?.ko !== first.surname.ko || n.style === style));
}

// 8. 조건 뽑기: length, first syllable / initial consonant, final consonant.
{
  const finalOf = (ch) => (ch.charCodeAt(0) - 0xac00) % 28;
  const cases = [
    { style: 'ko', cond: { len: '2', first: '서', final: 'any' }, ok: (g) => g.length === 2 && g[0] === '서' },
    { style: 'ko', cond: { len: 'any', first: 'ㅎ', final: 'no' }, ok: (g) => Math.floor((g.charCodeAt(0) - 0xac00) / 588) === 18 && finalOf(g.at(-1)) === 0 },
    { style: 'gb', cond: { len: '4+', first: '', final: 'any' }, ok: (g) => g.length >= 4 },
    { style: 'murim', cond: { len: '1', first: '', final: 'yes' }, ok: (g) => g.length === 1 && finalOf(g) !== 0 },
    { style: 'xianxia', cond: { len: '2', first: 'ㅇ', final: 'any' }, ok: (g) => g.length === 2 && Math.floor((g.charCodeAt(0) - 0xac00) / 588) === 11 },
    { style: 'fantasy', cond: { len: '3', first: '', final: 'yes' }, ok: (g) => g.length === 3 && finalOf(g.at(-1)) !== 0 },
  ];
  for (const c of cases) {
    const r = E.generate({ genre: 'fantasy', style: c.style, gender: 'any', count: 10, cond: c.cond, rng: E.seeded(41) });
    check(`cond ${c.style} ${JSON.stringify(c.cond)}`, r.names.length > 0 && r.names.every((n) => c.ok(n.given.replace(/\s/g, ''))), r.names.map((n) => n.given).join(','));
  }
  const none = E.generate({ genre: 'fantasy', style: 'murim', gender: 'any', count: 3, cond: { len: '3', first: '', final: 'any' }, rng: E.seeded(1) });
  check('impossible cond returns nothing quickly', none.names.length === 0);
}

// 9. 피할 이름: same full name, same given name, endings.
{
  const avoid = E.parseNameList('유연서, 이서희\n레티시아 로젠베르크 (Laetitia Rosenberg)\n하윤');
  check('parse list', JSON.stringify(avoid) === JSON.stringify(['유연서', '이서희', '레티시아로젠베르크', '하윤']), JSON.stringify(avoid));
  check('clash same given', !!E.clashesWith({ ko: '김연서', given: '연서' }, avoid));
  check('clash ends with avoided given', !!E.clashesWith({ ko: '박하윤', given: '하윤' }, avoid));
  check('no clash unrelated', !E.clashesWith({ ko: '김도윤', given: '도윤' }, avoid));
  const rng = E.seeded(51);
  let hit = 0;
  for (let i = 0; i < 40; i++) for (const n of E.generate({ genre: 'modern', style: 'ko', gender: 'f', count: 3, avoidNames: avoid, rng }).names) if (E.clashesWith(n, avoid)) hit++;
  check('avoidNames respected', hit === 0, `${hit}`);
}

// 10. 한자 뜻·애칭 are attached.
{
  const [h] = E.generate({ genre: 'murim', style: 'murim', gender: 'any', count: 1, rng: E.seeded(61) }).names;
  check('hanja meaning present', /^\S+ \S+/.test(h.meaning ?? '') && h.meaning.split(' · ').length >= [...h.orig].length, h.meaning);
  const allHun = [...E.MURIM.given, ...E.MURIM.surnames, ...E.XIANXIA.given, ...E.XIANXIA.surnames].every((x) => typeof x.hun === 'string' && x.hun.length > 0);
  check('every hanja has hun', allHun);
  const rng = E.seeded(71);
  let withNick = 0;
  for (let i = 0; i < 60; i++) for (const n of E.generate({ genre: 'romance', style: 'gb', gender: 'f', count: 3, rng }).names) if (n.nick?.length) withNick++;
  check('some western names carry nicknames', withNick > 10, `${withNick}`);
}

writeFileSync(join(root, 'tests', 'last-pool-sizes.json'), JSON.stringify(report, null, 2));
console.log(`engine tests: ${pass} passed, ${fails.length} failed`);
for (const f of fails.slice(0, 40)) console.log('  FAIL', f);
process.exit(fails.length ? 1 : 0);
