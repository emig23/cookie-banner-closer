export interface CmpRule {
  id: string;
  name: string;
  banner: string[];
  reject: string[];
  necessary: string[];
}

export interface PhraseSet {
  lang: string;
  reject: string[];
  necessary: string[];
  bannerKeywords: string[];
  payWall: string[];
}

export interface Detection {
  source: 'cmp' | 'heuristic';
  cmpId: string | null;
  cmpName: string | null;
  banner: HTMLElement;
  rejectButton: HTMLElement | null;
  necessaryButton: HTMLElement | null;
}
