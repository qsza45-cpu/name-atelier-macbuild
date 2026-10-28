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

writeFileSync(join(root, 'tests', 'last-pool-sizes.json'), JSON.stringify(report, null, 2));
console.log(`engine tests: ${pass} passed, ${fails.length} failed`);
for (const f of fails.slice(0, 40)) console.log('  FAIL', f);
process.exit(fails.length ? 1 : 0);
