// Proceduralno crtanje karata, gostiju i predmeta u DOM-u (bez slika, bez tuđih dizajna).
import type { Card, RegularInstance } from '../core/types.ts';
import { RANK_LABEL, SUIT_SYMBOL } from '../core/cards.ts';
import { BOSS, BRANDY, PACK, REG, VOUCHER, num } from '../core/data.ts';
import { t, fmtNum } from '../i18n/index.ts';

// Pozicije pipova (x%, y%) za 2–10; donja polovina se rotira.
const PIPS: Record<number, [number, number][]> = {
  2: [[50, 20], [50, 80]],
  3: [[50, 20], [50, 50], [50, 80]],
  4: [[30, 20], [70, 20], [30, 80], [70, 80]],
  5: [[30, 20], [70, 20], [50, 50], [30, 80], [70, 80]],
  6: [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80], [70, 80]],
  7: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [30, 80], [70, 80]],
  8: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [50, 65], [30, 80], [70, 80]],
  9: [[30, 18], [70, 18], [30, 39], [70, 39], [50, 50], [30, 61], [70, 61], [30, 82], [70, 82]],
  10: [[30, 18], [70, 18], [50, 29], [30, 39], [70, 39], [30, 61], [70, 61], [50, 71], [30, 82], [70, 82]],
};

export function cardHTML(c: Card, opts: { cls?: string; attrs?: string; tip?: boolean } = {}): string {
  if (c.faceDown) {
    return `<button class="card back ${opts.cls ?? ''}" data-card="${c.id}" ${opts.attrs ?? ''} aria-label="?"><span class="back-q">?</span></button>`;
  }
  const sym = SUIT_SYMBOL[c.suit];
  const rank = RANK_LABEL[c.rank];
  const red = c.suit === 'H' || c.suit === 'D';
  let center = '';
  if (c.rank === 1) center = `<span class="ace-pip">${sym}</span>`;
  else if (c.rank >= 11) center = `<span class="face"><span class="face-frame"><span class="face-rank">${rank}</span><span class="face-suit">${sym}</span><span class="face-crown">${c.rank === 13 ? '♛' : c.rank === 12 ? '❀' : '⚜'}</span></span></span>`;
  else center = (PIPS[c.rank] ?? []).map(([x, y]) => `<span class="pip${y > 52 ? ' flip' : ''}" style="left:${x}%;top:${y}%">${sym}</span>`).join('');
  const marks: string[] = [];
  if (c.enhancement) marks.push(`<span class="mark enh-${c.enhancement}">${enhBadge(c.enhancement)}</span>`);
  if (c.seal) marks.push(`<span class="seal seal-${c.seal}"></span>`);
  const tip = cardTip(c);
  return `<button class="card suit-${c.suit} ${red ? 'red' : 'black'} ${c.enhancement ? 'e-' + c.enhancement : ''} ${c.edition ? 'ed-' + c.edition : ''} ${opts.cls ?? ''}" data-card="${c.id}" ${tip ? `data-tip="${escapeAttr(tip)}"` : ''} ${opts.attrs ?? ''} aria-label="${rank}${sym}">
    <span class="idx tl">${rank}<i>${sym}</i></span>
    <span class="pips">${center}</span>
    <span class="idx br">${rank}<i>${sym}</i></span>
    ${marks.join('')}
  </button>`;
}

function enhBadge(e: string): string {
  return ({ gold: '★', glass: '◇', bonus: '+30', mult: '+4', wild: '✦', steel: '▣' } as Record<string, string>)[e] ?? '';
}

export function cardTip(c: Card): string {
  const parts: string[] = [];
  if (c.enhancement) parts.push(t('enh.' + c.enhancement));
  if (c.seal) parts.push(t('seal.' + c.seal));
  if (c.edition) parts.push(t('edition.' + c.edition));
  return parts.join('<br>');
}

export function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export function escapeHtml(s: string): string { return escapeAttr(s); }

export function regularDesc(id: string, inst?: RegularInstance): string {
  const d = REG[id];
  if (!d) return '';
  const params: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(d.params)) params[k] = typeof v === 'number' ? v : v;
  let s = t(`regular.${id}.desc`, params);
  if (inst) {
    const c = inst.counters;
    if (id === 'porter' || id === 'collector') s += `<br><em>${t('tip.counter', { v: '+' + fmtNum(c.chips ?? 0) + ' Chips' })}</em>`;
    if (id === 'teacher') s += `<br><em>${t('tip.counter', { v: '+' + fmtNum(c.mult ?? 0) + ' Mult' })}</em>`;
    if (id === 'legend') s += `<br><em>${t('tip.counter', { v: '×' + fmtNum(c.x ?? 1) + ' Mult' })}</em>`;
    if (inst.edition) s += `<br>${t('edition.' + inst.edition)}`;
    if (inst.disabled) s += `<br><b>${t('tip.disabled')}</b>`;
  }
  return s;
}

export function regularHTML(id: string, opts: { inst?: RegularInstance; cls?: string; attrs?: string; extraTip?: string; edition?: string } = {}): string {
  const d = REG[id]!;
  const ed = opts.inst?.edition ?? opts.edition;
  const tip = `<b>${t(`regular.${id}.name`)}</b> <small class="r-${d.rarity}">${t('rarity.' + d.rarity)}</small><br>${regularDesc(id, opts.inst)}${opts.extraTip ? '<br>' + opts.extraTip : ''}${!opts.inst && ed ? '<br>' + t('edition.' + ed) : ''}`;
  const counter = opts.inst ? counterBadge(id, opts.inst) : '';
  return `<button class="regular rar-${d.rarity} ${ed ? 'ed-' + ed : ''} ${opts.inst?.disabled ? 'disabled' : ''} ${opts.cls ?? ''}" data-tip="${escapeAttr(tip)}" ${opts.attrs ?? ''} aria-label="${escapeAttr(t(`regular.${id}.name`))}">
    <span class="portrait"><span class="r-icon">${d.icon}</span></span>
    <span class="r-name">${t(`regular.${id}.name`)}</span>
    ${counter}
  </button>`;
}

function counterBadge(id: string, inst: RegularInstance): string {
  const c = inst.counters;
  if ((id === 'porter' || id === 'collector') && c.chips) return `<span class="r-counter chips">+${fmtNum(c.chips)}</span>`;
  if (id === 'teacher' && c.mult) return `<span class="r-counter mult">+${fmtNum(c.mult)}</span>`;
  if (id === 'legend' && (c.x ?? 1) > 1) return `<span class="r-counter mult">×${fmtNum(c.x ?? 1)}</span>`;
  return '';
}

const BRANDY_COLOR: Record<string, string> = { slivovitz: '#7b3f8c', loza: '#d9b44a', pear: '#c7d36b', quince: '#e3a83c', herbal: '#4f8f4a', mead: '#e8a317' };

export function consumableHTML(id: string, opts: { cls?: string; attrs?: string; extraTip?: string } = {}): string {
  const isBrandy = !!BRANDY[id];
  const name = t(`${isBrandy ? 'brandy' : 'cup'}.${id}.name`);
  const desc = t(`${isBrandy ? 'brandy' : 'cup'}.${id}.desc`);
  const tip = `<b>${name}</b><br>${desc}${opts.extraTip ? '<br>' + opts.extraTip : ''}`;
  const art = isBrandy
    ? `<span class="bottle" style="--liq:${BRANDY_COLOR[id] ?? '#c99'}"><span class="neck"></span><span class="body"></span></span>`
    : `<span class="fildzan"><span class="cup-body"></span><span class="cup-sym">${cupSymbol(id)}</span></span>`;
  return `<button class="consumable ${isBrandy ? 'brandy' : 'cup'} ${opts.cls ?? ''}" data-tip="${escapeAttr(tip)}" ${opts.attrs ?? ''} aria-label="${escapeAttr(name)}">${art}<span class="c-name">${name}</span></button>`;
}

function cupSymbol(id: string): string {
  return ({ cup_luck: '★', cup_sediment: '◇', cup_bird: '🕊', cup_heart: '♥', cup_road: '✦', cup_ring: '◯', cup_clubs: '♣', cup_diamonds: '♦', cup_hearts: '♥', cup_spades: '♠', cup_key: '⚿', cup_cross: '✝', cup_mirror: '⧉', cup_coin: '¤', cup_sun: '☀' } as Record<string, string>)[id] ?? '☕';
}

export function packHTML(id: string, opts: { cls?: string; attrs?: string; extraTip?: string } = {}): string {
  const d = PACK[id]!;
  const tip = `<b>${t(`pack.${id}.name`)}</b><br>${t(`pack.${id}.desc`)}${opts.extraTip ? '<br>' + opts.extraTip : ''}`;
  return `<button class="pack pack-${d.kind} ${opts.cls ?? ''}" data-tip="${escapeAttr(tip)}" ${opts.attrs ?? ''}><span class="pack-icon">${d.icon}</span><span class="c-name">${t(`pack.${id}.name`)}</span></button>`;
}

export function voucherHTML(id: string, opts: { cls?: string; attrs?: string; extraTip?: string } = {}): string {
  const d = VOUCHER[id]!;
  const tip = `<b>${t(`voucher.${id}.name`)}</b><br>${t(`voucher.${id}.desc`)}${opts.extraTip ? '<br>' + opts.extraTip : ''}`;
  return `<button class="voucher ${opts.cls ?? ''}" data-tip="${escapeAttr(tip)}" ${opts.attrs ?? ''}><span class="pack-icon">${d.icon}</span><span class="c-name">${t(`voucher.${id}.name`)}</span></button>`;
}

export function bossHTML(id: string, cls = ''): string {
  const d = BOSS[id]!;
  return `<div class="boss-badge ${cls}" data-tip="${escapeAttr(`<b>${t(`boss.${id}.name`)}</b><br>${t(`boss.${id}.desc`)}`)}" tabindex="0"><span class="boss-icon">${d.icon}</span><span><b>${t(`boss.${id}.name`)}</b><small>${t(`boss.${id}.desc`)}</small></span></div>`;
}

export function regularParam(id: string, key: string): number { return num(REG[id]!, key); }
