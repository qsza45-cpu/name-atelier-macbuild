// Share image (SNS): draws one card (1080×1350, 4:5) or all three (1920×1080, 16:9) on a canvas with the
// NAME ATELIER design assets and the PLOTIVE logo, and returns a PNG data URL. Missing assets fall back to code drawing.
import type { AtelierApi } from '../shared/types';

export interface ShareCard {
  ko: string;
  orig: string;
  meta: string; // 로맨스 · 로판식 · 여성
  extra?: string; // 한자 뜻 or 애칭
}

const PALETTE = {
  light: { bg: '#f4ede2', surface: '#fffaf2', text: '#2a2026', muted: '#6b5c64', gold: '#b48a42', line: '#e2d3bf', accent: '#7b2d4a' },
  dark: { bg: '#16111a', surface: '#211a26', text: '#f2eadf', muted: '#b9aab3', gold: '#d6b46e', line: '#3b3040', accent: '#e59bb5' },
};
const SERIF = "'NanumMyeongjo', 'Batang', serif";
const LATIN = "Georgia, 'Times New Roman', serif";
const SANS = "'NanumGothic', 'Malgun Gothic', sans-serif";

async function loadImage(api: AtelierApi, rel: string): Promise<HTMLImageElement | null> {
  const url = await api.assetDataUrl(rel).catch(() => null);
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 9-slice: corners keep their size, edges stretch (same rule as the CSS border-image). */
function nineSlice(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, srcInset: number, inset: number) {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  const s = srcInset;
  const d = inset;
  const cols = [
    [0, s, x, d],
    [s, sw - 2 * s, x + d, w - 2 * d],
    [sw - s, s, x + w - d, d],
  ];
  const rows = [
    [0, s, y, d],
    [s, sh - 2 * s, y + d, h - 2 * d],
    [sh - s, s, y + h - d, d],
  ];
  for (const [sx, sW, dx, dW] of cols) for (const [sy, sH, dy, dH] of rows) if (!(sx === s && sy === s)) ctx.drawImage(img, sx, sy, sW, sH, dx, dy, dW, dH);
}

/** Splits text into at most `maxLines` lines that fit `maxW`, preferring breaks at spaces; shrinks the font if needed. */
function fitLines(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, startPx: number, minPx: number, maxW: number, maxLines: number) {
  for (let px = startPx; px >= minPx; px -= 2) {
    ctx.font = font(px);
    const words = text.replace(/(^| )(폰|드) /g, '$1$2 ').split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width <= maxW || !cur) cur = next;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) return { px, lines };
  }
  ctx.font = font(minPx);
  return { px: minPx, lines: [text] };
}

export async function renderShareImage(api: AtelierApi, cards: ShareCard[], dark: boolean): Promise<string> {
  const trio = cards.length > 1;
  const W = trio ? 1920 : 1080;
  const H = trio ? 1080 : 1350;
  const c = PALETTE[dark ? 'dark' : 'light'];
  await Promise.all(['700 80px NanumMyeongjo', '400 40px NanumMyeongjo', '400 30px NanumGothic', '700 30px NanumGothic'].map((f) => document.fonts.load(f).catch(() => null)));
  const [bg, frame, crest, wordmark, plotive] = await Promise.all([
    loadImage(api, `design/bg_main_${dark ? 'dark' : 'light'}.jpg`),
    loadImage(api, `design/card_frame_${dark ? 'dark' : 'light'}.png`),
    loadImage(api, 'design/card_crest.png'),
    loadImage(api, `design/logo_wordmark_${dark ? 'light' : 'dark'}.png`),
    loadImage(api, `partner/plotive_logo_horizontal_${dark ? 'white' : 'dark'}.png`),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background: cover-fit art, else a soft gradient.
  if (bg) {
    const scale = Math.max(W / bg.naturalWidth, H / bg.naturalHeight);
    const bw = bg.naturalWidth * scale;
    const bh = bg.naturalHeight * scale;
    ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, dark ? '#1e1724' : '#fbf5ec');
    g.addColorStop(1, c.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Header: wordmark + 작명 아틀리에.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const headY = trio ? 70 : 80;
  if (wordmark) {
    const h = trio ? 54 : 60;
    const w = (wordmark.naturalWidth / wordmark.naturalHeight) * h;
    ctx.drawImage(wordmark, (W - w) / 2, headY, w, h);
  } else {
    ctx.fillStyle = c.text;
    ctx.font = `600 46px ${LATIN}`;
    ctx.fillText('NAME ✦ ATELIER', W / 2, headY + 46);
  }
  ctx.fillStyle = c.muted;
  ctx.font = `400 ${trio ? 26 : 30}px ${SERIF}`;
  ctx.fillText('작명 아틀리에 · 웹소설 캐릭터 이름 공방', W / 2, headY + (trio ? 96 : 108));

  // Cards.
  const cw = trio ? 540 : 740;
  const ch = trio ? 660 : 880;
  const gap = 46;
  const top = trio ? 220 : 250;
  const x0 = (W - (cw * cards.length + gap * (cards.length - 1))) / 2;
  const k = cw / 264; // CSS card is 264px wide
  cards.forEach((card, i) => {
    const x = x0 + i * (cw + gap);
    const y = top;
    ctx.save();
    ctx.shadowColor = dark ? 'rgba(0,0,0,0.5)' : 'rgba(74,40,52,0.18)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, x, y, cw, ch, 18 * k);
    ctx.fillStyle = c.surface;
    ctx.fill();
    ctx.restore();
    if (frame) nineSlice(ctx, frame, x, y, cw, ch, 54, 18 * k);
    else {
      roundRect(ctx, x + 10 * k, y + 10 * k, cw - 20 * k, ch - 20 * k, 10 * k);
      ctx.strokeStyle = c.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // crest
    const crestY = y + 30 * k;
    if (crest) {
      const w = 120 * k;
      ctx.drawImage(crest, x + (cw - w) / 2, crestY, w, 28 * k);
    } else {
      ctx.fillStyle = c.gold;
      ctx.font = `${16 * k}px ${SERIF}`;
      ctx.fillText('✦', x + cw / 2, crestY + 20 * k);
    }
    // name, original spelling, divider, meta, extra — centred as a block
    const maxW = cw - 60 * k;
    const name = fitLines(ctx, card.ko, (px) => `700 ${px}px ${SERIF}`, Math.round(32 * k), Math.round(18 * k), maxW, 2);
    const lineH = name.px * 1.32;
    const origPx = Math.round(13 * k);
    const metaPx = Math.round(11 * k);
    const extraPx = Math.round(10.5 * k);
    ctx.font = `400 ${extraPx}px ${SANS}`;
    const extra = card.extra ? fitLines(ctx, card.extra, (px) => `400 ${px}px ${SANS}`, extraPx, Math.round(8 * k), maxW, 2) : null;
    const blockH = name.lines.length * lineH + (card.orig ? origPx * 1.8 : 0) + 22 * k + metaPx * 1.6 + (extra ? extra.lines.length * extra.px * 1.5 + 6 * k : 0);
    let cy = y + 30 * k + 28 * k + (ch - 58 * k - 40 * k - blockH) / 2 + name.px;
    ctx.fillStyle = c.text;
    ctx.font = `700 ${name.px}px ${SERIF}`;
    for (const l of name.lines) {
      ctx.fillText(l, x + cw / 2, cy);
      cy += lineH;
    }
    cy -= lineH - name.px;
    if (card.orig) {
      cy += origPx * 1.3;
      ctx.fillStyle = c.muted;
      ctx.font = `400 ${origPx}px ${LATIN}`;
      ctx.fillText(card.orig, x + cw / 2, cy, maxW);
    }
    cy += 14 * k;
    ctx.strokeStyle = c.gold;
    ctx.lineWidth = Math.max(1.5, k * 0.6);
    ctx.beginPath();
    ctx.moveTo(x + cw / 2 - 22 * k, cy);
    ctx.lineTo(x + cw / 2 - 6 * k, cy);
    ctx.moveTo(x + cw / 2 + 6 * k, cy);
    ctx.lineTo(x + cw / 2 + 22 * k, cy);
    ctx.stroke();
    ctx.fillStyle = c.gold;
    ctx.beginPath();
    ctx.arc(x + cw / 2, cy, 2 * k, 0, Math.PI * 2);
    ctx.fill();
    cy += 8 * k + metaPx * 1.2;
    ctx.fillStyle = c.muted;
    ctx.font = `400 ${metaPx}px ${SANS}`;
    ctx.fillText(card.meta, x + cw / 2, cy, maxW);
    if (extra) {
      cy += 6 * k;
      ctx.font = `400 ${extra.px}px ${SANS}`;
      for (const l of extra.lines) {
        cy += extra.px * 1.5;
        ctx.fillText(l, x + cw / 2, cy, maxW);
      }
    }
  });

  // Footer: NAME ATELIER × PLOTIVE.
  const fy = H - (trio ? 92 : 104);
  const logoH = trio ? 36 : 40;
  ctx.font = `600 ${trio ? 24 : 26}px ${LATIN}`;
  const left = 'NAME ATELIER  ×  ';
  const leftW = ctx.measureText(left).width;
  const logoW = plotive ? (plotive.naturalWidth / plotive.naturalHeight) * logoH : ctx.measureText('PLOTIVE').width;
  const startX = (W - leftW - logoW) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = c.text;
  ctx.fillText(left, startX, fy + logoH * 0.72);
  if (plotive) ctx.drawImage(plotive, startX + leftW, fy, logoW, logoH);
  else ctx.fillText('PLOTIVE', startX + leftW, fy + logoH * 0.72);
  ctx.textAlign = 'center';
  ctx.fillStyle = c.muted;
  ctx.font = `400 ${trio ? 20 : 22}px ${SANS}`;
  ctx.fillText('PLOTIVE 텀블벅 펀딩 이벤트 무료 배포판', W / 2, fy + logoH + (trio ? 34 : 40));

  return canvas.toDataURL('image/png');
}
