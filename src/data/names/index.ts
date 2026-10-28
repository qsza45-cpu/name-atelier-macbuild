// 이름 데이터 진입점. STYLES = 실재 문화권 이름 + 로판식(실존 유럽 이름 기반), 화면 표시 순서대로.
import type { StyleData } from '../types';
import { STYLE as ko } from './ko';
import { ROFAN } from './rofan';
import { STYLE as us } from './us';
import { STYLE as gb } from './gb';
import { STYLE as fr } from './fr';
import { STYLE as de } from './de';
import { STYLE as jp } from './jp';

export const STYLES: StyleData[] = [ko, ROFAN, us, gb, fr, de, jp];

export { ROFAN } from './rofan';
export { FANTASY } from './fantasy';
export type { FantasyPools } from './fantasy';
export { MURIM, XIANXIA } from './hanja';
export type { HanjaPools, HanjaSyl, HanjaSurname } from './hanja';
