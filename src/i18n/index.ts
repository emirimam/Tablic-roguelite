import bs from './bs.json';
import en from './en.json';

export type Lang = 'bs' | 'en';
const DICTS: Record<Lang, Record<string, string>> = { bs, en };
let lang: Lang = 'bs';

export function setLang(l: Lang) { lang = l; document.documentElement.lang = l; }
export function getLang(): Lang { return lang; }

/** Prevod s parametrima: t('fx.mult', { n: 4 }) → "+4 Mult". */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const s = DICTS[lang][key] ?? DICTS.bs[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k];
    if (v === undefined) return '{' + k + '}';
    return typeof v === 'number' ? fmtNum(v) : v;
  });
}

export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  if (Math.abs(n) >= 1e15) return n.toExponential(2).replace('+', '');
  const isInt = Number.isInteger(n);
  const s = isInt ? Math.round(n).toString() : n.toFixed(lang === 'bs' ? 2 : 2).replace(/\.?0+$/, '');
  const [i, d] = s.split('.');
  const sep = lang === 'bs' ? '.' : ',';
  const dec = lang === 'bs' ? ',' : '.';
  const grouped = i!.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return d ? grouped + dec + d : grouped;
}

export function allKeys(l: Lang): string[] { return Object.keys(DICTS[l]); }
