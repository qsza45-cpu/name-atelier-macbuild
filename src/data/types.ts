// Shared shapes for the curated name data (src/data/names/*).
export type Genre = 'fantasy' | 'romance' | 'modern' | 'murim';
export type G = 'm' | 'f' | 'u';
// nick: common nicknames in Korean form (Elizabeth → ['리즈', '베스']); western styles only.
// Mood tags (분위기), reviewed per name: era m=현대적 c=고전적 · tone s=부드러운 h=강한 · flair p=평범한 f=화려한.
export type Era = 'm' | 'c';
export type Tone = 's' | 'h';
export type Flair = 'p' | 'f';
export interface Mood { era?: Era; tone?: Tone; flair?: Flair }
export interface GivenName extends Mood { ko: string; orig: string; roman?: string; g: G; tags?: Genre[]; nick?: string[] }
export interface Surname { ko: string; orig: string; roman?: string; tags?: Genre[] }
export interface StyleData { id: string; label: string; order: 'surname-first' | 'given-first'; sep: string; given: GivenName[]; surnames: Surname[] }
