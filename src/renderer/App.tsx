// NAME ATELIER main screen: pickers, three name cards, the big 「다시 뽑기 ✨」 button and the footer menu.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Genre } from '../data/types';
import { GENDERS, GENRES, NO_CONDITIONS, REGIONS, STYLE_OPTIONS, generate, hasConditions, label, parseNameList, regionOf, type GenderSel, type NameConditions, type NameResult, type Region, type StyleId, type SurnamePart } from '../engine/generate';
import { copyLabel, toClipboardText, toCsv, toTxt } from '../engine/exporting';
import { DEFAULT_SETTINGS, type AtelierApi, type Favorite, type SaveResult, type Settings, type ThemePref } from '../shared/types';
import { hasAsset, onAssets } from './assets';
import { IconClose, IconCopy, IconExport, IconFilter, IconGear, IconImage, IconInfo, IconLock, IconStar, IconTrash } from './icons';
import { renderShareImage, type ShareCard } from './shareImage';

declare global {
  interface Window {
    atelier: AtelierApi;
  }
}
const api = () => window.atelier;

const SLOTS = 3;
const FLIP_MS = 220;
const STAGGER_MS = 60;
const sizeClass = (ko: string) => {
  const n = ko.replace(/\s/g, '').length;
  return n >= 15 ? 'long' : n >= 9 ? 'mid' : '';
};
const today = () => new Date().toISOString().slice(0, 10);
/** The small line under the original spelling: 한자 뜻 for 선협·무협, nicknames for western names. */
const extraLine = (n: { meaning?: string; nick?: string[] }) => n.meaning ?? (n.nick?.length ? `애칭 ${n.nick.join(' · ')}` : '');
const condSummary = (c: NameConditions) =>
  [c.len !== 'any' && `${c.len === '4+' ? '4자 이상' : `${c.len}자`}`, c.first && `‘${c.first}’ 시작`, c.final === 'yes' && '받침 있음', c.final === 'no' && '받침 없음'].filter(Boolean).join(' · ');
const metaOf = (n: { genre: Genre; style: StyleId; gender: GenderSel }) => `${label.genre(n.genre)} · ${label.style(n.style)} · ${label.gender(n.gender)}`;
// Keep 폰/드 on the same line as the surname when a long name wraps (고트프리트 / 폰 바우만).
const keepParticle = (ko: string) => ko.replace(/(^| )(폰|드) /g, (_m, lead: string, p: string) => `${lead}${p} `);

function useAssetTick() {
  const [, set] = useState(0);
  useEffect(() => onAssets(() => set((x) => x + 1)), []);
}

function Chips<T extends string>({ label: title, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <>
      <span className="pick-label" id={`lbl-${title}`}>
        {title}
      </span>
      <div className="chips" role="radiogroup" aria-labelledby={`lbl-${title}`}>
        {options.map((o) => (
          <button key={o.id} className="chip" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function App() {
  useAssetTick();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [slots, setSlots] = useState<(NameResult | null)[]>([null, null, null]);
  const [rot, setRot] = useState<number[]>([180, 180, 180]); // card rotation; 180 (mod 360) = showing the back
  const rotRef = useRef(rot);
  const setRotAt = (i: number, deg: number) => {
    rotRef.current = rotRef.current.map((r, j) => (j === i ? deg : r));
    setRot(rotRef.current);
  };
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; warn?: boolean } | null>(null);
  const [panel, setPanel] = useState<null | 'favorites' | 'export' | 'settings' | 'about' | 'cond' | 'avoid'>(null);
  const [fixedSurname, setFixedSurname] = useState<SurnamePart | null>(null); // 성 고정 (this session only)
  const [favQuery, setFavQuery] = useState('');
  const [favWork, setFavWork] = useState<string>('__all');
  const [editing, setEditing] = useState<string | null>(null); // favourite id whose memo/work is being edited
  const [avoidDraft, setAvoidDraft] = useState('');
  const [imaging, setImaging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [info, setInfo] = useState<{ version: string; dataPath: string; platform: string } | null>(null);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const history = useRef(new Set<string>()); // every id shown this session, to avoid repeats
  const toastTimer = useRef<number>(0);

  const favIds = new Set(favorites.map((f) => f.id));
  const animate = settings.animation && !reducedMotion;
  const { genre, style, gender } = settings.last;
  const drawn = slots.some(Boolean);

  useEffect(() => {
    api()
      .load()
      .then((d) => {
        setSettings(d.settings);
        setFavorites(d.favorites);
        setReady(true);
      });
    api().info().then(setInfo);
    const dm = matchMedia('(prefers-color-scheme: dark)');
    const rm = matchMedia('(prefers-reduced-motion: reduce)');
    const a = () => setSystemDark(dm.matches);
    const b = () => setReducedMotion(rm.matches);
    dm.addEventListener('change', a);
    rm.addEventListener('change', b);
    return () => {
      dm.removeEventListener('change', a);
      rm.removeEventListener('change', b);
    };
  }, []);

  const dark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const flash = (text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  };

  const saveFailed = (r: SaveResult) => !r.ok && flash(`저장하지 못했습니다 (${r.error ?? '알 수 없는 오류'}). 잠시 뒤 다시 시도해 주세요`);
  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch, last: { ...settings.last, ...(patch.last ?? {}) } };
    setSettings(next);
    api().saveSettings(next).then(saveFailed, () => saveFailed({ ok: false }));
  };
  const setLast = (patch: Partial<Settings['last']>) => {
    setNote(null); // a "pool running dry" notice belongs to the old filter
    updateSettings({ last: { ...settings.last, ...patch } });
  };
  const region = regionOf(style);
  const regionStyles = STYLE_OPTIONS.filter((o) => REGIONS.find((r) => r.id === region)!.styles.includes(o.id));
  const pickStyle = (s: StyleId) => {
    setNote(null);
    // A fixed surname belongs to one style (로젠베르크 can't follow you into 무협식).
    if (fixedSurname && fixedSurname.style !== s) {
      setFixedSurname(null);
      flash('스타일이 바뀌어 성 고정을 풀었습니다');
    }
    updateSettings({ last: { ...settings.last, style: s }, regionStyle: { ...settings.regionStyle, [regionOf(s)]: s } });
  };
  const toggleFixed = (n: NameResult) => {
    if (!n.surname) return;
    if (fixedSurname && fixedSurname.ko === n.surname.ko && fixedSurname.style === n.surname.style) {
      setFixedSurname(null);
      flash('성 고정을 풀었습니다');
    } else {
      setFixedSurname(n.surname);
      flash(`‘${n.surname.ko}’ 성으로 고정했습니다 · 다시 뽑으면 이름만 바뀝니다`);
    }
  };
  const avoidNames = parseNameList(settings.avoidText);
  // Switching group returns to the style last used in that group (or its first style).
  const pickRegion = (r: Region) => r !== region && pickStyle(settings.regionStyle[r] ?? REGIONS.find((x) => x.id === r)!.styles[0]);

  const persistFavorites = (next: Favorite[]) => {
    setFavorites(next);
    api().saveFavorites(next).then(saveFailed, () => saveFailed({ ok: false }));
  };
  const toggleFavorite = (n: NameResult) => {
    if (favIds.has(n.id)) {
      persistFavorites(favorites.filter((f) => f.id !== n.id));
      flash('즐겨찾기에서 뺐습니다');
    } else {
      persistFavorites([
        {
          id: n.id,
          ko: n.ko,
          orig: n.orig,
          roman: n.roman,
          genre: n.genre,
          style: n.style,
          gender: n.gender,
          savedAt: new Date().toISOString(),
          ...(n.meaning ? { meaning: n.meaning } : {}),
          ...(n.nick ? { nick: n.nick } : {}),
          ...(favWork !== '__all' && favWork !== '__none' ? { work: favWork } : {}),
        },
        ...favorites,
      ]);
      flash('즐겨찾기에 담았습니다 · 다시 뽑아도 남아요');
    }
  };

  const copy = async (text: string, msg = '복사했습니다') => {
    await api().copy(text);
    flash(msg);
  };

  const draw = useCallback(() => {
    if (busy) return;
    // Favourited cards stay put; if all three are kept, draw a fresh three (they remain in 즐겨찾기).
    const kept = slots.map((s) => (s && favIds.has(s.id) ? s : null));
    const targets = kept.every(Boolean) ? [0, 1, 2] : [0, 1, 2].filter((i) => !kept[i]);
    const onScreen = slots.filter((s): s is NameResult => !!s).map((s) => s.id);
    const res = generate({ genre, style, gender, count: targets.length, avoid: history.current, exclude: onScreen, cond: settings.cond, avoidNames, fixedSurname: fixedSurname ?? undefined });
    res.names.forEach((n) => history.current.add(n.id));
    if (res.names.length === 0) {
      const filtered = hasConditions(settings.cond) || avoidNames.length || fixedSurname;
      setNote({ text: filtered ? '조건에 맞는 이름이 없습니다. 조건 뽑기·성 고정·피할 이름을 느슨하게 해 보세요.' : '이 조합으로 만들 수 있는 이름이 없습니다. 다른 선택을 해 보세요.', warn: true });
      return;
    }
    setNote(res.repeated ? { text: '이 조합의 이름 후보를 거의 다 봤어요. 앞에서 나온 이름이 다시 나올 수 있습니다.', warn: true } : null);
    const assign = targets.slice(0, res.names.length).map((slot, k) => ({ slot, name: res.names[k] }));

    if (!animate) {
      setSlots((prev) => {
        const next = [...prev];
        for (const a of assign) next[a.slot] = a.name;
        return next;
      });
      for (const a of assign) setRotAt(a.slot, Math.ceil(rotRef.current[a.slot] / 360) * 360);
      return;
    }
    // Flip: front → back (swap the name while hidden) → front, staggered per card.
    setBusy(true);
    const turn = (slot: number) => setRotAt(slot, rotRef.current[slot] + 180);
    const put = (slot: number, name: NameResult) => setSlots((s) => s.map((x, i) => (i === slot ? name : x)));
    assign.forEach(({ slot, name }, k) => {
      window.setTimeout(() => {
        if (rotRef.current[slot] % 360 === 0) {
          turn(slot);
          window.setTimeout(() => {
            put(slot, name);
            turn(slot);
          }, FLIP_MS);
        } else {
          put(slot, name);
          turn(slot);
        }
      }, k * STAGGER_MS);
    });
    window.setTimeout(() => setBusy(false), assign.length * STAGGER_MS + FLIP_MS * 2 + 40);
  }, [busy, slots, favorites, genre, style, gender, animate, settings.cond, settings.avoidText, fixedSurname]);

  const saveImage = async (names: NameResult[]) => {
    if (!names.length || imaging) return;
    setImaging(true);
    try {
      const cards: ShareCard[] = names.map((n) => ({ ko: n.ko, orig: n.orig, meta: metaOf(n), extra: extraLine(n) || undefined }));
      const png = await renderShareImage(api(), cards, dark);
      const base = names.length === 1 ? names[0].ko.replace(/\s+/g, '_') : `이름카드_${names.length}장`;
      const r = await api().saveImage(png, `NAME_ATELIER_${base}_${today()}.png`);
      if (r.saved) flash('이미지로 저장했습니다 · SNS에 올려 보세요');
      else if (r.error) flash(`이미지를 저장하지 못했습니다 (${r.error})`);
    } catch (e: any) {
      flash(`이미지를 만들지 못했습니다 (${e?.message ?? e})`);
    } finally {
      setImaging(false);
    }
  };

  // Keyboard: R (or Space when nothing else is focused) draws again; Esc closes panels.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setPanel(null);
      if (panel || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      const onControl = t && (t.tagName === 'BUTTON' || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
      // e.code works whatever the keyboard layout (ㄱ in 한글 mode); holding the key must not burn through names.
      if (e.code === 'KeyR' || (e.key === ' ' && !onControl)) {
        e.preventDefault();
        if (!e.repeat) draw();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draw, panel]);

  const exportFavorites = async (kind: 'txt' | 'csv') => {
    setPanel(null);
    const content = kind === 'csv' ? toCsv(favorites) : toTxt(favorites, '즐겨찾기한 이름');
    const r = await api().exportFile(kind, content, `NAME_ATELIER_즐겨찾기_${today()}.${kind}`);
    if (r.saved) flash(`${kind.toUpperCase()}로 저장했습니다`);
    else if (r.error) flash(`저장하지 못했습니다 (${r.error}). 파일이 다른 프로그램에서 열려 있는지 확인해 주세요`);
  };
  const current = slots.filter((s): s is NameResult => !!s);
  const works = [...new Set(favorites.map((f) => f.work).filter((w): w is string => !!w))].sort((a, b) => a.localeCompare(b, 'ko'));
  const q = favQuery.trim().toLowerCase();
  const shownFavorites = favorites.filter(
    (f) =>
      (favWork === '__all' || (favWork === '__none' ? !f.work : f.work === favWork)) &&
      (!q || [f.ko, f.orig, f.memo, f.work, f.meaning, ...(f.nick ?? [])].some((v) => v && v.toLowerCase().includes(q))),
  );
  const updateFavorite = (id: string, patch: Partial<Pick<Favorite, 'memo' | 'work'>>) => {
    const next = favorites.map((f) => {
      if (f.id !== id) return f;
      const merged: Favorite = { ...f, ...patch };
      if (!merged.memo) delete merged.memo;
      if (!merged.work) delete merged.work;
      return merged;
    });
    if (JSON.stringify(next) !== JSON.stringify(favorites)) persistFavorites(next);
  };
  const setCond = (patch: Partial<NameConditions>) => {
    setNote(null);
    updateSettings({ cond: { ...settings.cond, ...patch } });
  };

  if (!ready) return null;
  const wordmark = hasAsset('wordmark') ? <img className="wordmark" src={`design/logo_wordmark_${dark ? 'light' : 'dark'}.png`} alt="NAME ATELIER" /> : <span className="wordmark-text">NAME<span className="star">✦</span>ATELIER</span>;
  const symbol = hasAsset('symbol') ? <img className="symbol" src="design/logo_symbol.png" alt="" /> : <span className="symbol-fallback" aria-hidden>✒</span>;

  return (
    <div className={`app${animate ? '' : ' no-anim'}`}>
      <header className="head">
        {symbol}
        <h1 style={{ margin: 0, display: 'flex' }}>{wordmark}</h1>
        <div className="head-sub">
          <b>작명 아틀리에</b>
          <span>웹소설 캐릭터 이름 공방 · 인터넷 없이 작동</span>
        </div>
      </header>

      <section className="pickers" aria-label="이름 조건">
        <Chips label="장르" options={GENRES} value={genre} onChange={(v: Genre) => setLast({ genre: v })} />
        <span className="pick-label" id="lbl-style">
          이름 스타일
        </span>
        <div className="chips">
          <span className="seg region" role="radiogroup" aria-label="분류">
            {REGIONS.map((r) => (
              <button key={r.id} role="radio" aria-checked={region === r.id} onClick={() => pickRegion(r.id)}>
                {r.label}
              </button>
            ))}
          </span>
          <span className="region-sep" aria-hidden />
          <span className="chips" role="radiogroup" aria-labelledby="lbl-style">
            {regionStyles.map((o) => (
              <button key={o.id} className="chip" role="radio" aria-checked={style === o.id} onClick={() => pickStyle(o.id)}>
                {o.label}
              </button>
            ))}
          </span>
        </div>
        <span className="pick-label" id="lbl-gender">
          성별
        </span>
        <div className="chips gender-row">
          <span className="chips" role="radiogroup" aria-labelledby="lbl-gender">
            {GENDERS.map((o) => (
              <button key={o.id} className="chip" role="radio" aria-checked={gender === o.id} onClick={() => setLast({ gender: o.id })}>
                {o.label}
              </button>
            ))}
          </span>
          <span className="spacer" />
          <button className={`chip tool${hasConditions(settings.cond) ? ' active' : ''}`} onClick={() => setPanel('cond')} aria-haspopup="dialog">
            <IconFilter /> {hasConditions(settings.cond) ? condSummary(settings.cond) : '조건 뽑기'}
          </button>
          <button
            className={`chip tool${avoidNames.length ? ' active' : ''}`}
            onClick={() => {
              setAvoidDraft(settings.avoidText);
              setPanel('avoid');
            }}
            aria-haspopup="dialog"
          >
            피할 이름{avoidNames.length ? ` ${avoidNames.length}` : ''}
          </button>
        </div>
      </section>

      <div className="sr-only" aria-live="polite">
        {current.map((n) => n.ko).join(', ')}
      </div>
      {/* While cards flip, a click would hit the outgoing name, so the stage ignores the pointer. */}
      <main className={`stage${busy ? ' busy' : ''}`}>
        {slots.map((n, i) => (
          <div className="slot" key={i}>
            <div className="card3d" style={{ transform: `rotateY(${rot[i]}deg)` }}>
              <div className="face front" aria-hidden={rot[i] % 360 !== 0}>
                {n && (
                  <>
                    {favIds.has(n.id) && <span className="kept">보관됨</span>}
                    <div className="crest" aria-hidden>
                      {hasAsset('crest') ? (
                        <img src="design/card_crest.png" alt="" />
                      ) : (
                        <>
                          <span className="rule" />✦<span className="rule r" />
                        </>
                      )}
                    </div>
                    <div className="card-body">
                      <div className={`name ${sizeClass(n.ko)}`} title={n.ko}>
                        {keepParticle(n.ko)}
                      </div>
                      {n.orig && <div className="orig">{n.orig}</div>}
                      {extraLine(n) && (
                        <div className="extra" title={extraLine(n)}>
                          {extraLine(n)}
                        </div>
                      )}
                      <div className="divider" aria-hidden>
                        <i />
                        <b />
                        <i />
                      </div>
                      <div className="meta">{metaOf(n)}</div>
                    </div>
                    <div className="card-actions">
                      <span className="group">
                        <button className="icon-btn" title="이름 복사" aria-label={`${n.ko} 복사`} onClick={() => copy(copyLabel(n))}>
                          <IconCopy />
                        </button>
                        <button className="icon-btn" title="이미지로 저장 (SNS 공유용)" aria-label={`${n.ko} 이미지로 저장`} disabled={imaging} onClick={() => saveImage([n])}>
                          <IconImage />
                        </button>
                      </span>
                      <span className="group">
                        {n.surname && (
                          <button
                            className={`icon-btn${fixedSurname?.ko === n.surname.ko && fixedSurname.style === n.surname.style ? ' on' : ''}`}
                            title={fixedSurname?.ko === n.surname.ko ? '성 고정 풀기' : `‘${n.surname.ko}’ 성 고정 (이름만 다시 뽑기)`}
                            aria-pressed={fixedSurname?.ko === n.surname.ko}
                            aria-label={`${n.surname.ko} 성 고정`}
                            onClick={() => toggleFixed(n)}
                          >
                            <IconLock open={fixedSurname?.ko !== n.surname.ko} />
                          </button>
                        )}
                        <button className={`icon-btn${favIds.has(n.id) ? ' on' : ''}`} title={favIds.has(n.id) ? '즐겨찾기 해제' : '즐겨찾기'} aria-pressed={favIds.has(n.id)} aria-label={`${n.ko} 즐겨찾기`} onClick={() => toggleFavorite(n)}>
                          <IconStar filled={favIds.has(n.id)} />
                        </button>
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="face back" aria-hidden={rot[i] % 360 === 0}>
                <div className="back-inner">
                  <span className="emblem">✦</span>
                  {!n && <span className="hint">이름을 뽑아 보세요</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>

      <div className="draw-row">
        {/* aria-disabled, not disabled: a disabled button drops keyboard focus to <body> mid-animation. */}
        <button className="draw" onClick={draw} aria-disabled={busy} aria-keyshortcuts="R">
          {drawn ? '다시 뽑기 ✨' : '이름 뽑기 ✨'}
        </button>
        {fixedSurname && !note ? (
          <div className="draw-note lock-note">
            <IconLock /> 성 고정: <b>{fixedSurname.ko}</b>
            <button className="link-btn" onClick={() => setFixedSurname(null)}>
              풀기
            </button>
          </div>
        ) : (
          <div className={`draw-note${note?.warn ? ' warn' : ''}`}>{note?.text ?? (drawn ? '★ 즐겨찾기한 카드는 다시 뽑아도 남아요 · 🔒 성 고정 · 단축키 R' : `한 번에 ${SLOTS}개씩 뽑습니다 · 단축키 R`)}</div>
        )}
      </div>

      <footer className="foot" style={{ position: 'relative' }}>
        <button className="foot-btn" onClick={() => setPanel('favorites')}>
          <IconStar /> 즐겨찾기 <span className="count">{favorites.length}</span>
        </button>
        <button className="foot-btn" onClick={() => setPanel(panel === 'export' ? null : 'export')} aria-expanded={panel === 'export'}>
          <IconExport /> 내보내기
        </button>
        {panel === 'export' && (
          <div className="menu" style={{ left: 110 }} role="menu">
            <button role="menuitem" disabled={!favorites.length} onClick={() => exportFavorites('txt')}>
              즐겨찾기 TXT로 저장
            </button>
            <button role="menuitem" disabled={!favorites.length} onClick={() => exportFavorites('csv')}>
              즐겨찾기 CSV로 저장 (엑셀)
            </button>
            <button role="menuitem" disabled={!favorites.length} onClick={() => (setPanel(null), copy(toClipboardText(favorites), `즐겨찾기 ${favorites.length}개를 복사했습니다`))}>
              즐겨찾기 전체 복사
            </button>
            <hr />
            <button role="menuitem" disabled={!current.length} onClick={() => (setPanel(null), copy(toClipboardText(current), '지금 카드의 이름을 복사했습니다'))}>
              지금 카드 {current.length}개 복사
            </button>
            <button role="menuitem" disabled={!current.length || imaging} onClick={() => (setPanel(null), saveImage(current))}>
              지금 카드 {current.length}장 이미지로 저장 (SNS용)
            </button>
          </div>
        )}
        <span className="spacer" />
        <button className="foot-btn" onClick={() => setPanel('settings')}>
          <IconGear /> 설정
        </button>
        <button className="foot-btn" onClick={() => setPanel('about')}>
          <IconInfo /> 프로그램 정보
        </button>
      </footer>

      {panel === 'export' && <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setPanel(null)} />}

      {panel === 'favorites' && (
        <>
          <div className="scrim" onClick={() => setPanel(null)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="즐겨찾기">
            <div className="drawer-head">
              <h2>즐겨찾기 {favorites.length}</h2>
              <button className="icon-btn" aria-label="닫기" autoFocus onClick={() => setPanel(null)}>
                <IconClose />
              </button>
            </div>
            <div className="drawer-tools">
              <button className="small-btn" disabled={!favorites.length} onClick={() => exportFavorites('txt')}>
                TXT 저장
              </button>
              <button className="small-btn" disabled={!favorites.length} onClick={() => exportFavorites('csv')}>
                CSV 저장
              </button>
              <button className="small-btn" disabled={!favorites.length} onClick={() => copy(toClipboardText(favorites), `즐겨찾기 ${favorites.length}개를 복사했습니다`)}>
                전체 복사
              </button>
            </div>
            {favorites.length > 0 && (
              <div className="drawer-filter">
                <input className="text-in" type="search" placeholder="이름·메모·작품 검색" value={favQuery} onChange={(e) => setFavQuery(e.target.value)} aria-label="즐겨찾기 검색" />
                <select className="text-in" value={favWork} onChange={(e) => setFavWork(e.target.value)} aria-label="작품별 보기">
                  <option value="__all">전체 작품</option>
                  {works.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                  <option value="__none">미분류</option>
                </select>
              </div>
            )}
            <datalist id="work-list">
              {works.map((w) => (
                <option key={w} value={w} />
              ))}
            </datalist>
            {favorites.length === 0 ? (
              <div className="empty">
                아직 담은 이름이 없습니다.
                <br />
                카드의 ☆를 누르면 여기에 모입니다.
              </div>
            ) : shownFavorites.length === 0 ? (
              <div className="empty">찾는 이름이 없습니다.</div>
            ) : (
              <ul className="fav-list">
                {shownFavorites.map((f) => (
                  <li className="fav" key={f.id}>
                    <div className="fav-row">
                      <div className="fav-main">
                        <div className="fav-name">
                          {f.ko} {f.work && <span className="work-tag">{f.work}</span>}
                        </div>
                        {f.orig && <div className="fav-orig">{f.orig}</div>}
                        {extraLine(f) && <div className="fav-orig">{extraLine(f)}</div>}
                        <div className="fav-meta">
                          {metaOf(f)} · {f.savedAt.slice(0, 10)}
                        </div>
                        {f.memo && editing !== f.id && <div className="fav-memo">{f.memo}</div>}
                      </div>
                      <button className={`icon-btn${editing === f.id ? ' on' : ''}`} title="메모·작품 분류" aria-label={`${f.ko} 메모와 작품 분류`} onClick={() => setEditing(editing === f.id ? null : f.id)}>
                        ✎
                      </button>
                      <button className="icon-btn" title="복사" aria-label={`${f.ko} 복사`} onClick={() => copy(copyLabel(f))}>
                        <IconCopy />
                      </button>
                      <button className="icon-btn" title="삭제" aria-label={`${f.ko} 삭제`} onClick={() => persistFavorites(favorites.filter((x) => x.id !== f.id))}>
                        <IconTrash />
                      </button>
                    </div>
                    {editing === f.id && (
                      <div className="fav-edit">
                        <label>
                          작품
                          <input className="text-in" list="work-list" maxLength={60} placeholder="예: 천명수선기 (비우면 미분류)" defaultValue={f.work ?? ''} onBlur={(e) => updateFavorite(f.id, { work: e.target.value.trim() })} />
                        </label>
                        <label>
                          메모
                          <textarea className="text-in" rows={3} maxLength={2000} placeholder="어떤 인물에게 붙일지, 이름을 고른 이유…" defaultValue={f.memo ?? ''} onBlur={(e) => updateFavorite(f.id, { memo: e.target.value })} />
                        </label>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </>
      )}

      {panel === 'cond' && (
        <>
          <div className="scrim" onClick={() => setPanel(null)} />
          <div className="dialog" role="dialog" aria-modal="true" aria-label="조건 뽑기">
            <h2>조건 뽑기</h2>
            <p>이름(성 제외) 부분에 적용합니다. 외국 이름은 한글 표기 기준입니다.</p>
            <div className="row">
              <span>글자 수</span>
              <span className="seg" role="radiogroup" aria-label="글자 수">
                {(
                  [
                    ['any', '상관없음'],
                    ['1', '1자'],
                    ['2', '2자'],
                    ['3', '3자'],
                    ['4+', '4자 이상'],
                  ] as [NameConditions['len'], string][]
                ).map(([id, t]) => (
                  <button key={id} role="radio" aria-checked={settings.cond.len === id} onClick={() => setCond({ len: id })}>
                    {t}
                  </button>
                ))}
              </span>
            </div>
            <div className="row">
              <span>
                첫 글자
                <div className="hint-text">‘연’처럼 한 글자, 또는 ‘ㅅ’처럼 자음만</div>
              </span>
              <input className="text-in short" maxLength={2} value={settings.cond.first} placeholder="상관없음" autoFocus onChange={(e) => setCond({ first: e.target.value.trim() })} aria-label="첫 글자" />
            </div>
            <div className="row">
              <span>끝 글자 받침</span>
              <span className="seg" role="radiogroup" aria-label="끝 글자 받침">
                {(
                  [
                    ['any', '상관없음'],
                    ['yes', '있음'],
                    ['no', '없음'],
                  ] as [NameConditions['final'], string][]
                ).map(([id, t]) => (
                  <button key={id} role="radio" aria-checked={settings.cond.final === id} onClick={() => setCond({ final: id })}>
                    {t}
                  </button>
                ))}
              </span>
            </div>
            <div className="dialog-actions">
              <button className="small-btn" disabled={!hasConditions(settings.cond)} onClick={() => setCond({ ...NO_CONDITIONS })}>
                조건 지우기
              </button>
              <button className="small-btn" onClick={() => setPanel(null)}>
                닫기
              </button>
            </div>
          </div>
        </>
      )}

      {panel === 'avoid' && (
        <>
          <div className="scrim" onClick={() => setPanel(null)} />
          <div className="dialog" role="dialog" aria-modal="true" aria-label="피할 이름">
            <h2>이미 쓴 이름 피하기</h2>
            <p>작품 등장인물 이름을 붙여 넣으세요. 쉼표나 줄바꿈으로 나눕니다. 같은 이름, 같은 이름자(예: ‘유연서’가 있으면 ‘김연서’), 성만 붙은 이름은 뽑지 않습니다.</p>
            <textarea className="text-in" rows={8} value={avoidDraft} placeholder={'예)\n유연서, 이서희, 은휘겸\n레티시아 로젠베르크'} autoFocus onChange={(e) => setAvoidDraft(e.target.value)} aria-label="피할 이름 목록" />
            <p className="hint-text">{parseNameList(avoidDraft).length}개 인식 · 이 컴퓨터에만 저장됩니다</p>
            <div className="dialog-actions">
              <button className="small-btn" onClick={() => setAvoidDraft('')}>
                모두 지우기
              </button>
              <button
                className="small-btn primary"
                onClick={() => {
                  updateSettings({ avoidText: avoidDraft });
                  setNote(null);
                  setPanel(null);
                  flash(`피할 이름 ${parseNameList(avoidDraft).length}개를 적용했습니다`);
                }}
              >
                적용
              </button>
            </div>
          </div>
        </>
      )}

      {panel === 'settings' && (
        <>
          <div className="scrim" onClick={() => setPanel(null)} />
          <div className="dialog" role="dialog" aria-modal="true" aria-label="설정">
            <h2>설정</h2>
            <div className="row">
              <span>화면 테마</span>
              <span className="seg" role="radiogroup" aria-label="화면 테마">
                {(
                  [
                    ['system', '시스템'],
                    ['light', '라이트'],
                    ['dark', '다크'],
                  ] as [ThemePref, string][]
                ).map(([id, t]) => (
                  <button key={id} role="radio" aria-checked={settings.theme === id} onClick={() => updateSettings({ theme: id })}>
                    {t}
                  </button>
                ))}
              </span>
            </div>
            <div className="row">
              <span>
                카드 전환 애니메이션
                {reducedMotion && <div style={{ fontSize: 11, color: 'var(--muted)' }}>운영체제의 ‘애니메이션 줄이기’가 켜져 있어 꺼진 상태로 동작합니다</div>}
              </span>
              <span className="seg" role="radiogroup" aria-label="애니메이션">
                <button role="radio" aria-checked={settings.animation} onClick={() => updateSettings({ animation: true })}>
                  켜기
                </button>
                <button role="radio" aria-checked={!settings.animation} onClick={() => updateSettings({ animation: false })}>
                  끄기
                </button>
              </span>
            </div>
            <div className="row">
              <span>
                이번 실행에서 본 이름 기록
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{history.current.size}개 · 같은 이름이 반복되지 않도록 씁니다</div>
              </span>
              <button
                className="small-btn"
                onClick={() => {
                  history.current.clear();
                  setNote(null);
                  flash('최근 기록을 비웠습니다');
                }}
              >
                기록 비우기
              </button>
            </div>
            <div className="dialog-actions">
              <button className="small-btn" onClick={() => setPanel(null)}>
                닫기
              </button>
            </div>
          </div>
        </>
      )}

      {panel === 'about' && (
        <>
          <div className="scrim" onClick={() => setPanel(null)} />
          <div className="dialog" role="dialog" aria-modal="true" aria-label="프로그램 정보">
            <div className="about-logo">
              {symbol}
              {wordmark}
            </div>
            <p style={{ color: 'var(--text)' }}>작명 아틀리에 · 버전 {info?.version}</p>
            <ul>
              <li>인터넷 연결, 로그인, 서버 없이 이 컴퓨터 안에서만 작동합니다.</li>
              <li>즐겨찾기와 설정은 이 컴퓨터에만 저장됩니다.{info && <br />}{info?.dataPath}</li>
              <li>실제 문화권 이름은 공개 통계·자료를 참고해 직접 검수한 목록에서 고릅니다. 한글 표기는 외래어 표기법을 기준으로 했지만 실제 발음·역사 관습과 완전히 같다고 보장하지 않습니다.</li>
              <li>생성된 이름이 실존 인물의 이름과 우연히 같을 수 있습니다.</li>
              <li>성별 분류는 참고용이며, 특정 성별만 쓸 수 있는 이름이라는 뜻이 아닙니다.</li>
            </ul>
            <p>
              글꼴: 나눔명조·나눔고딕 (SIL Open Font License 1.1) · 프로그램: Electron, React (MIT)
              <br />
              PLOTIVE 텀블벅 펀딩 이벤트 무료 배포판 · © 2026 TALEUNE
            </p>
            <div className="dialog-actions">
              <button className="small-btn" onClick={() => setPanel(null)}>
                닫기
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
