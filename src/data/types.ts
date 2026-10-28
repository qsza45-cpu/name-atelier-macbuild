// Shared shapes for the curated name data (src/data/names/*).
export type Genre = 'fantasy' | 'romance' | 'modern' | 'murim';
export type G = 'm' | 'f' | 'u';
// nick: common nicknames in Korean form (Elizabeth → ['리즈', '베스']); western styles only.
export interface GivenName { ko: string; orig: string; roman?: string; g: G; tags?: Genre[]; nick?: string[] }
export interface Surname { ko: string; orig: string; roman?: string; tags?: Genre[] }
export interface StyleData { id: string; label: string; order: 'surname-first' | 'given-first'; sep: string; given: GivenName[]; surnames: Surname[] }
