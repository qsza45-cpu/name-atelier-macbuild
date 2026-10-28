// TXT/CSV/clipboard text for names. Files are UTF-8; CSV gets a BOM so Excel opens Korean correctly.
import type { Genre } from '../data/types';
import { label, type GenderSel, type StyleId } from './generate';

export interface ExportRow {
  ko: string;
  orig: string;
  roman?: string;
  genre: Genre;
  style: StyleId;
  gender: GenderSel;
  savedAt?: string;
}

const meta = (r: ExportRow) => `${label.genre(r.genre)} · ${label.style(r.style)} · ${label.gender(r.gender)}`;
const day = (iso?: string) => (iso ? iso.slice(0, 10) : '');

/** One line per name: "샬럿 펨버턴 (Charlotte Pemberton)". */
export function toClipboardText(rows: ExportRow[]) {
  return rows.map((r) => (r.orig ? `${r.ko} (${r.orig})` : r.ko)).join('\n');
}

export function toTxt(rows: ExportRow[], title: string) {
  const lines = [`NAME ATELIER — ${title}`, `만든 날: ${new Date().toISOString().slice(0, 10)}  ·  ${rows.length}개`, ''];
  for (const r of rows) {
    lines.push(r.orig ? `${r.ko} (${r.orig})` : r.ko);
    lines.push(`    ${meta(r)}${r.savedAt ? ` · 저장 ${day(r.savedAt)}` : ''}`);
  }
  return lines.join('\r\n') + '\r\n';
}

const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export function toCsv(rows: ExportRow[]) {
  const head = ['이름', '원어 표기', '로마자', '장르', '이름 스타일', '성별 분류', '저장일'];
  const body = rows.map((r) => [r.ko, r.style === 'ko' ? '' : r.orig, r.roman ?? '', label.genre(r.genre), label.style(r.style), label.gender(r.gender), day(r.savedAt)].map(cell).join(','));
  return '﻿' + [head.join(','), ...body].join('\r\n') + '\r\n';
}
