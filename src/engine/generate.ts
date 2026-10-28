// Name engine: picks real names from the curated per-culture lists (src/data/names) and builds 창작 판타지식 names from
// syllable pools. Pure and offline; pass an rng for reproducible tests.
import type { Era, Flair, Genre, G, GivenName, Mood, StyleData, Surname, Tone } from '../data/types';
import { FANTASY, MURIM, STYLES, XIANXIA } from '../data/names';
import type { HanjaPools, HanjaSyl } from '../data/names/hanja';
import { BLOCK_SUBSTRINGS } from '../data/blocklist';

export type StyleId = 'ko' | 'rofan' | 'xianxia' | 'murim' | 'us' | 'gb' | 'fr' | 'de' | 'jp' | 'fantasy';
const HANJA_STYLES: Partial<Record<StyleId, { pools: HanjaPools; label: string }>> = {
  xianxia: { pools: XIANXIA, label: '선협식' },
  murim: { pools: MURIM, label: '무협식' },
};
// Chip order: the styles writers use most first.
const ORDER: StyleId[] = ['ko', 'rofan', 'xianxia', 'murim', 'us', 'gb', 'fr', 'de', 'jp', 'fantasy'];
export type GenderSel = 'm' | 'f' | 'any';

export const GENRES: { id: Genre; label: string }[] = [
  { id: 'fantasy', label: '판타지' },
  { id: 'romance', label: '로맨스' },
  { id: 'modern', label: '현대물' },
  { id: 'murim', label: '무협' },
];
const ALL_STYLES: { id: StyleId; label: string }[] = [
  ...STYLES.map((s) => ({ id: s.id as StyleId, label: s.label })),
  ...Object.entries(HANJA_STYLES).map(([id, h]) => ({ id: id as StyleId, label: h!.label })),
  { id: 'fantasy', label: '창작 판타지식' },
];
export const STYLE_OPTIONS = ORDER.map((id) => ALL_STYLES.find((s) => s.id === id)).filter((s): s is { id: StyleId; label: string } => !!s);

// Top-level grouping shown first in the picker: 한국 / 동양풍 / 서양풍.
export type Region = 'korea' | 'east' | 'west';
export const REGIONS: { id: Region; label: string; styles: StyleId[] }[] = [
  { id: 'korea', label: '한국', styles: ['ko'] },
  { id: 'east', label: '동양풍', styles: ['xianxia', 'murim', 'jp'] },
  { id: 'west', label: '서양풍', styles: ['rofan', 'us', 'gb', 'fr', 'de', 'fantasy'] },
];
export const regionOf = (s: StyleId): Region => REGIONS.find((r) => r.styles.includes(s))?.id ?? 'west';
export const GENDERS: { id: GenderSel; label: string }[] = [
  { id: 'm', label: '남성' },
  { id: 'f', label: '여성' },
  { id: 'any', label: '성별 무관' },
];
export const label = {
  genre: (id: Genre) => GENRES.find((x) => x.id === id)?.label ?? id,
  style: (id: StyleId) => STYLE_OPTIONS.find((x) => x.id === id)?.label ?? id,
  gender: (id: GenderSel) => GENDERS.find((x) => x.id === id)?.label ?? id,
};

export interface NameResult {
  id: string; // stable key: style + Korean form without spaces
  ko: string; // Korean display form
  orig: string; // original script ('' for 창작 names)
  roman?: string;
  genre: Genre;
  style: StyleId;
  gender: GenderSel; // the gender filter it was generated under
  given: string; // Korean given-name part (what 조건 뽑기 and 피할 이름 look at)
  surname?: SurnamePart; // absent for invented names drawn without a family name
  meaning?: string; // 선협·무협: 「白 흰 백 · 蓮 연꽃 련 · 花 꽃 화」
  nick?: string[]; // western nicknames (엘리자베스 → 리즈·베스)
}

/** The family-name part of a result, kept so 「성 고정」 can reuse it for the next draws. */
export interface SurnamePart {
  style: StyleId;
  ko: string; // as displayed, particle included (폰 바우만)
  orig: string;
  roman?: string;
  meaning?: string;
}

/** 조건 뽑기, applied to the Korean given name; era/tone/flair select by the reviewed mood tags (분위기). */
export interface NameConditions {
  len: 'any' | '1' | '2' | '3' | '4+'; // syllables in the given name
  first: string; // first syllable (연) or initial consonant (ㅇ); '' = any
  final: 'any' | 'yes' | 'no'; // last syllable has a 받침
  era: 'any' | Era; // 현대적 / 고전적
  tone: 'any' | Tone; // 부드러운 / 강한
  flair: 'any' | Flair; // 평범한 / 화려한
}
export const NO_CONDITIONS: NameConditions = { len: 'any', first: '', final: 'any', era: 'any', tone: 'any', flair: 'any' };
export const hasMood = (c?: NameConditions) => !!c && (c.era !== 'any' || c.tone !== 'any' || c.flair !== 'any');
export const hasConditions = (c?: NameConditions) => !!c && (c.len !== 'any' || !!c.first || c.final !== 'any' || hasMood(c));
export const MOOD_LABEL = { era: { m: '현대적', c: '고전적' }, tone: { s: '부드러운', h: '강한' }, flair: { p: '평범한', f: '화려한' } } as const;

/** Does a tagged entry match the selected mood? Untagged entries only pass axes left at 'any'. */
export function meetsMood(m: Mood, cond?: NameConditions): boolean {
  if (!cond) return true;
  return (cond.era === 'any' || m.era === cond.era) && (cond.tone === 'any' || m.tone === cond.tone) && (cond.flair === 'any' || m.flair === cond.flair);
}

// 창작 판타지식 has no reviewed tags; its 느낌 is judged from the sounds (hard consonants vs liquids and vowels).
const HARD_INITIALS = new Set([0, 1, 3, 4, 7, 8, 12, 13, 14, 15, 16, 17]); // ㄱㄲㄷㄸㅂㅃㅈㅉㅊㅋㅌㅍ
const HARD_FINALS = new Set([1, 2, 7, 17, 19, 21, 22, 23, 24, 25, 26]); // ㄱㄲㄷㅂㅅㅆㅈㅊㅋㅌㅍ (ㄴㄹㅁㅇ count as soft)
export function soundTone(name: string): Tone {
  let hard = 0;
  let total = 0;
  for (const ch of name.replace(/\s+/g, '')) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c > 11171) continue;
    total++;
    if (HARD_INITIALS.has(Math.floor(c / 588))) hard++;
    if (HARD_FINALS.has(c % 28)) hard += 0.6;
  }
  return total && hard / total >= 0.55 ? 'h' : 's';
}

export interface GenerateRequest {
  genre: Genre;
  style: StyleId;
  gender: GenderSel;
  count: number;
  avoid?: Iterable<string>; // soft: ids not to repeat (session history); reused only when the pool runs dry
  exclude?: Iterable<string>; // hard: ids that must never be returned (names still on screen)
  fixedSurname?: SurnamePart; // 성 고정 (used only when its style matches)
  cond?: NameConditions;
  avoidNames?: string[]; // 이미 쓴 이름: same or clashing names are skipped
  rng?: () => number;
}
export interface GenerateResponse {
  names: NameResult[];
  repeated: boolean; // true when the pool ran dry and some names repeat earlier results
}

const MAX_TRIES_PER_NAME = 400;
const MAX_TRIES_FILTERED = 2500;

// ------------------------------------------------------------------ Hangul helpers for 조건 뽑기
const isSyllable = (ch: string) => {
  const c = ch.charCodeAt(0);
  return c >= 0xac00 && c <= 0xd7a3;
};
const finalOf = (ch: string) => (isSyllable(ch) ? (ch.charCodeAt(0) - 0xac00) % 28 : 0);
const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const initialOf = (ch: string) => (isSyllable(ch) ? INITIALS[Math.floor((ch.charCodeAt(0) - 0xac00) / 588)] : '');

/** Does a Korean given name satisfy the conditions? */
export function meetsConditions(given: string, cond?: NameConditions): boolean {
  if (!cond) return true;
  const g = given.replace(/\s+/g, '');
  if (!g) return false;
  const n = [...g].length;
  if (cond.len === '4+' ? n < 4 : cond.len !== 'any' && n !== Number(cond.len)) return false;
  const first = cond.first.trim();
  if (first) {
    const f = first[0];
    if (INITIALS.includes(f) ? initialOf(g[0]) !== f : !g.startsWith(first)) return false;
  }
  if (cond.final !== 'any' && (finalOf(g[g.length - 1]) !== 0) !== (cond.final === 'yes')) return false;
  return true;
}

// ------------------------------------------------------------------ 이미 쓴 이름
/**
 * Normalises a pasted list (commas, newlines, 「·」, parentheses with original spellings) into Korean names.
 * Spaces inside a name are kept (single space) because they mark the parts of western/Japanese names.
 */
export function parseNameList(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,，、;·]+/)
        .map((s) => s.replace(/\(.*?\)|\[.*?\]/g, '').replace(/[^가-힣\s]/g, '').replace(/\s+/g, ' ').trim())
        .filter((s) => /[가-힣]/.test(s) && s.length <= 30),
    ),
  ];
}
/** How an avoided name is read: its parts, for the 「피할 이름」 preview (레티시아 로젠베르크 → 레티시아 · 로젠베르크). */
export const nameParts = (a: string) => a.split(' ').filter(Boolean);

/**
 * Clash rules:
 *  - same full name, or the candidate's given name equals a whole avoided entry;
 *  - spaced entries (레티시아 로젠베르크, 사토 하루토): any part equal to the candidate's given name;
 *  - unspaced Korean entries (유연서): the same given name after a surname (김연서), or the candidate ends with it.
 */
export function clashesWith(n: Pick<NameResult, 'ko' | 'given'>, avoid: string[]): string | null {
  const full = compact(n.ko);
  const given = compact(n.given);
  for (const entry of avoid) {
    const a = compact(entry);
    if (a === full || a === given) return entry;
    const parts = nameParts(entry);
    if (parts.length > 1) {
      if (given.length >= 2 && parts.includes(given)) return entry;
      continue;
    }
    if (given.length >= 2 && a.length > given.length && a.endsWith(given)) return entry;
    if (a.length >= 2 && full.length > a.length && full.endsWith(a)) return entry;
  }
  return null;
}

/** Small deterministic PRNG (mulberry32) for tests. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const compact = (s: string) => s.replace(/\s+/g, '');
export function isBlocked(ko: string) {
  const c = compact(ko);
  return BLOCK_SUBSTRINGS.some((b) => b && c.includes(b));
}

function pickWeighted<T>(items: T[], weight: (x: T) => number, rng: () => number): T | undefined {
  let total = 0;
  for (const it of items) total += weight(it);
  if (total <= 0) return undefined;
  let r = rng() * total;
  for (const it of items) {
    r -= weight(it);
    if (r < 0) return it;
  }
  return items[items.length - 1];
}
const pick = <T>(xs: T[], rng: () => number) => xs[Math.floor(rng() * xs.length)];

// Genre affinity boosts a name; it never excludes one.
const GENRE_BOOST = 4;
// Names tagged only 무협 (모용·서문·백운…) appear only in the 무협 genre, so a 현대물 한국식 name never gets them.
const genreW = (tags: Genre[] | undefined, genre: Genre) => (tags?.includes(genre) ? GENRE_BOOST : tags?.length === 1 && tags[0] === 'murim' ? 0 : 1);
function genderW(g: G, sel: GenderSel) {
  if (sel === 'any') return g === 'u' ? 2 : 1;
  if (g === sel) return 1;
  return g === 'u' ? 0.6 : 0;
}

// Nobiliary particles for aristocratic genres (Friedrich von …, Camille de …).
const PARTICLE: Partial<Record<string, { ko: string; orig: string; chance: number }>> = {
  de: { ko: '폰', orig: 'von', chance: 0.25 },
  fr: { ko: '드', orig: 'de', chance: 0.2 },
};

function realName(style: StyleData, givenPool: GivenName[], req: GenerateRequest, rng: () => number): NameResult | undefined {
  const given = pickWeighted<GivenName>(givenPool, (n) => genderW(n.g, req.gender) * genreW(n.tags, req.genre), rng);
  if (!given) return undefined;
  const styleId = style.id as StyleId;
  let surPart: SurnamePart;
  if (req.fixedSurname?.style === styleId) {
    surPart = req.fixedSurname;
  } else {
    const sur = pickWeighted<Surname>(style.surnames, (s) => genreW(s.tags, req.genre), rng);
    if (!sur) return undefined;
    surPart = { style: styleId, ko: sur.ko, orig: sur.orig, roman: sur.roman };
    const p = PARTICLE[style.id];
    if (p && (req.genre === 'fantasy' || req.genre === 'romance') && rng() < p.chance) {
      // French "de" elides before a vowel (d'Artois), so only use it before consonants.
      const vowelStart = /^[AEIOUYÀÂÉÈÊÎÔÛaeiouy]/.test(sur.orig);
      if (!(style.id === 'fr' && vowelStart)) surPart = { ...surPart, ko: `${p.ko} ${sur.ko}`, orig: `${p.orig} ${sur.orig}` };
    }
  }
  // Albrecht Albrecht, 하루 하루: a given name that equals the surname reads like a typo.
  if (given.ko === surPart.ko.replace(/^(폰|드) /, '')) return undefined;
  const surnameFirst = style.order === 'surname-first';
  const ko = surnameFirst ? [surPart.ko, given.ko].join(style.sep) : [given.ko, surPart.ko].join(style.sep || ' ');
  const origSep = style.id === 'ko' ? '' : ' ';
  const orig = surnameFirst ? `${surPart.orig}${origSep}${given.orig}` : `${given.orig} ${surPart.orig}`;
  const roman = given.roman || surPart.roman ? (surnameFirst ? `${surPart.roman ?? ''} ${given.roman ?? ''}` : `${given.roman ?? ''} ${surPart.roman ?? ''}`).trim() : undefined;
  // Korean given names often have no single standard hanja, so the card's second line shows the romanization instead.
  const second = style.id === 'ko' ? roman ?? '' : orig;
  return { id: `${style.id}:${compact(ko)}`, ko, orig: second, roman, genre: req.genre, style: styleId, gender: req.gender, given: given.ko, surname: surPart, ...(given.nick?.length ? { nick: given.nick } : {}) };
}

/** 「白 흰 백」 for each character; compound surnames carry 「남녘 · 집」 (one 훈 per character). */
function hanjaMeaning(hanja: string, reading: string, hun?: string): string[] {
  const chars = [...hanja];
  const reads = [...reading];
  const huns = hun ? hun.split(' · ') : [];
  return chars.map((c, i) => [c, huns[i], reads[i]].filter(Boolean).join(' '));
}

// 선협식·무협식: surname + one or two hanja syllables. The first given syllable uses its word-initial reading
// (蓮 → 연화), later ones the plain reading (청련). orig shows the hanja (白蓮花).
function hanjaName(styleId: StyleId, pools: HanjaPools, req: GenerateRequest, rng: () => number): NameResult | undefined {
  const fits = (s: HanjaSyl) => (req.gender === 'any' || s.g === req.gender || s.g === 'u') && meetsMood(s, req.cond);
  const pool = pools.given.filter(fits);
  if (!pool.length || !pools.surnames.length) return undefined;
  const fixed = req.fixedSurname?.style === styleId ? req.fixedSurname : undefined;
  const sur = fixed ? undefined : pick(pools.surnames, rng);
  // 조건 뽑기: one or two syllables, and the first syllable can be chosen from those that already match.
  const len = req.cond?.len ?? 'any';
  if (len === '3' || len === '4+') return undefined;
  const count = len === '1' ? 1 : len === '2' ? 2 : rng() < 0.85 ? 2 : 1;
  const first = req.cond?.first.trim();
  const firstPool = first ? pool.filter((s) => meetsConditions(s.initial ?? s.ko, { ...NO_CONDITIONS, first })) : pool;
  if (!firstPool.length) return undefined;
  const syls = [pick(firstPool, rng)];
  if (count === 2) syls.push(pick(pool, rng));
  if (syls.length === 2 && syls[0].hanja === syls[1].hanja) return undefined;
  // Keep a two-character name in one register: a soft character next to a hard one (月 + 劍) is usually rejected.
  if (syls.length === 2 && syls[0].tone && syls[1].tone && syls[0].tone !== syls[1].tone && rng() < 0.7) return undefined;
  const readings: string[] = [];
  syls.forEach((s, i) => {
    let r = i === 0 ? s.initial ?? s.ko : s.ko;
    // 렬·률 become 열·율 after a vowel or ㄴ (선율, 규율), as in standard Korean readings.
    if (i > 0 && (r === '렬' || r === '률')) {
      const fin = (readings[i - 1].charCodeAt(0) - 0xac00) % 28;
      if (fin === 0 || fin === 4) r = r === '렬' ? '열' : '율';
    }
    readings.push(r);
  });
  const given = readings.join('');
  const surPart: SurnamePart = fixed ?? { style: styleId, ko: sur!.initial ?? sur!.ko, orig: sur!.hanja, meaning: hanjaMeaning(sur!.hanja, sur!.initial ?? sur!.ko, sur!.hun).join(' · ') };
  const ko = `${surPart.ko}${given}`;
  const meaning = [surPart.meaning, ...syls.map((s, i) => hanjaMeaning(s.hanja, readings[i], s.hun)[0])].filter(Boolean).join(' · ');
  return { id: `${styleId}:${ko}`, ko, orig: `${surPart.orig}${syls.map((s) => s.hanja).join('')}`, genre: req.genre, style: styleId, gender: req.gender, given, surname: surPart, meaning };
}

// An ㅇ-initial syllable inside a name reads well only after an open syllable with a different vowel (리안, 레아).
// After a final consonant (셀엘, 온엔) or the same vowel (레에나, 노온, 시일) it reads as a stutter.
function vowelEcho(prev: string, next: string) {
  const p = prev.charCodeAt(0) - 0xac00;
  const n = next.charCodeAt(0) - 0xac00;
  if (p < 0 || n < 0 || p > 11171 || n > 11171) return false;
  if (Math.floor(n / 588) !== 11) return false;
  return p % 28 !== 0 || Math.floor(p / 28) % 21 === Math.floor(n / 28) % 21;
}

// 창작 판타지식: rule-based syllable names. Rejects doubled syllables (리리) and over-long results.
function inventedName(req: GenerateRequest, rng: () => number): NameResult | undefined {
  const F = FANTASY;
  const tails = req.gender === 'm' ? F.tailM : req.gender === 'f' ? F.tailF : [...F.tailU, ...F.tailM, ...F.tailF];
  const parts = [pick(F.head, rng)];
  if (rng() < 0.45) parts.push(pick(F.mid, rng));
  parts.push(pick(tails, rng));
  const given = parts.join('');
  for (let i = 1; i < given.length; i++) if (given[i] === given[i - 1] || vowelEcho(given[i - 1], given[i])) return undefined;
  if (given.length < 2 || given.length > 5) return undefined;
  // Only 느낌 applies to invented names (judged from the sounds); 시대감·개성 have no reviewed tags here.
  if (req.cond && req.cond.tone !== 'any' && soundTone(given) !== req.cond.tone) return undefined;
  // A family name suits fantasy/romance characters; modern-genre invented names stay single (unless 성 고정).
  const fixed = req.fixedSurname?.style === 'fantasy' ? req.fixedSurname : undefined;
  const surnameChance = req.genre === 'modern' ? 0 : 0.6;
  const family = fixed?.ko ?? (rng() < surnameChance ? `${pick(F.houseHead, rng)}${pick(F.houseTail, rng)}` : '');
  const ko = family ? `${given} ${family}` : given;
  return { id: `fantasy:${compact(ko)}`, ko, orig: '', genre: req.genre, style: 'fantasy', gender: req.gender, given, ...(family ? { surname: { style: 'fantasy' as StyleId, ko: family, orig: '' } } : {}) };
}

export function generate(req: GenerateRequest): GenerateResponse {
  const rng = req.rng ?? Math.random;
  const avoid = new Set(req.avoid ?? []);
  const exclude = new Set(req.exclude ?? []);
  const style = STYLES.find((s) => s.id === req.style);
  const hanja = HANJA_STYLES[req.style];
  // Keep the spaces: they mark the parts of western/Japanese names for clashesWith.
  const avoidNames = (req.avoidNames ?? []).map((a) => a.replace(/\s+/g, ' ').trim()).filter(Boolean);
  // Real names: filter the given-name list up front so strict conditions don't depend on luck.
  const givenPool = style ? style.given.filter((g) => meetsConditions(g.ko, req.cond) && meetsMood(g, req.cond)) : [];
  const make = () => (req.style === 'fantasy' ? inventedName(req, rng) : hanja ? hanjaName(req.style, hanja.pools, req, rng) : style ? realName(style, givenPool, req, rng) : undefined);
  const tries = hasConditions(req.cond) || avoidNames.length || req.fixedSurname ? MAX_TRIES_FILTERED : MAX_TRIES_PER_NAME;
  const names: NameResult[] = [];
  const taken = new Set<string>();
  let repeated = false;
  for (let i = 0; i < req.count; i++) {
    let fallback: NameResult | undefined;
    let chosen: NameResult | undefined;
    for (let t = 0; t < tries && !chosen; t++) {
      const n = make();
      if (!n || isBlocked(n.ko) || taken.has(n.id) || exclude.has(n.id)) continue;
      if (!meetsConditions(n.given, req.cond) || (avoidNames.length && clashesWith(n, avoidNames))) continue;
      if (avoid.has(n.id)) {
        fallback ??= n;
        continue;
      }
      chosen = n;
    }
    // Pool exhausted for this filter: accept an earlier name rather than loop forever, and tell the caller.
    if (!chosen && fallback) {
      chosen = fallback;
      repeated = true;
    }
    if (!chosen) {
      repeated = true;
      continue;
    }
    taken.add(chosen.id);
    names.push(chosen);
  }
  return { names, repeated };
}

/** Rough number of distinct names a filter can produce (for the "pool running low" hint and tests). */
export function poolSize(styleId: StyleId, gender: GenderSel): number {
  if (styleId === 'fantasy') return 10000;
  const h = HANJA_STYLES[styleId];
  if (h) {
    const g = h.pools.given.filter((s) => gender === 'any' || s.g === gender || s.g === 'u').length;
    return h.pools.surnames.length * g * g;
  }
  const s = STYLES.find((x) => x.id === styleId);
  if (!s) return 0;
  const g = s.given.filter((n) => genderW(n.g, gender) > 0).length;
  return g * s.surnames.length;
}
