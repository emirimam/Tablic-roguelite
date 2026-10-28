import { apply, newRun, previewCapture, mustForceLay, targetFor, sellPrice, voucherPrice, type Action, type GameEvent } from '../core/run.ts';
import { computeRules } from '../core/rules.ts';
import { capturableIds, findCaptures, plausibleSelection } from '../core/capture.ts';
import { processEvents, type MetaState } from '../core/meta.ts';
import { serializeRun, deserializeRun, deserializeMeta } from '../core/save.ts';
import { seedFromNumber, normalizeSeed } from '../core/rng.ts';
import { ACHIEVEMENTS, BOSS, BOSSES, BRANDIES, BRANDY, CUP, CUPS, DECKS, REG, REGULARS, RULES, STAKES, VOUCHERS } from '../core/data.ts';
import { TUTORIAL } from '../core/tutorial.ts';
import { applyClassic, bestMove, classicPoints, newClassic, type ClassicAction, type ClassicEvent, type ClassicState } from '../core/classic.ts';
import { evaluateSelection } from '../core/capture.ts';
import { RANK_LABEL, SUIT_SYMBOL } from '../core/cards.ts';
import type { Card, RunState } from '../core/types.ts';
import type { ScoreStep } from '../core/scoring.ts';
import { t, fmtNum, setLang } from '../i18n/index.ts';
import { cardHTML, regularHTML, consumableHTML, packHTML, voucherHTML, bossHTML, escapeHtml } from '../render/cards.ts';
import { initAudio, sfx, playMusic, setVolumes } from '../audio/audio.ts';
import { initTooltip, hide as hideTip, consumeLongPress } from './tooltip.ts';
import { initNav } from './nav.ts';
import type { Platform } from '../platform/platform.ts';

const APP_VERSION = '0.9.0';
const DEMO = import.meta.env.VITE_DEMO === '1';
const RUN_KEY = 'tabla.run.v1';
const META_KEY = 'tabla.meta.v1';
const CLASSIC_KEY = 'tabla.classic.v1';

type Screen = 'splash' | 'menu' | 'first' | 'mode' | 'goal' | 'newrun' | 'game' | 'classic' | 'collection' | 'stats' | 'settings' | 'rules';

interface UI {
  screen: Screen;
  colTab: string;
  nr: { deck: string; stake: number; seed: string };
  hand: string | null;
  table: string[];
  cons: { index: number; targets: string[] } | null;
  packIndex: number | null;
  packTargets: string[];
  regSel: string | null;
  animating: boolean;
  skip: boolean;
  tutStep: number;
  shopWarned: boolean;
  confirm: string | null;
  prevTable: Set<string>;
  prevHand: Set<string>;
  chand: string | null;
  ctable: string[];
  aiBusy: boolean;
  ctarget: number;
  goalBack: Screen;
}

let P: Platform;
let meta: MetaState;
let run: RunState | null = null;
let root: HTMLElement;
const ui: UI = {
  screen: 'splash', colTab: 'regulars', nr: { deck: 'deck_classic', stake: 0, seed: '' },
  hand: null, table: [], cons: null, packIndex: null, packTargets: [], regSel: null,
  animating: false, skip: false, tutStep: 0, shopWarned: false, confirm: null, prevTable: new Set(), prevHand: new Set(),
  chand: null, ctable: [], aiBusy: false, ctarget: 101, goalBack: 'mode',
};
let cl: ClassicState | null = null;

// ---------------------------------------------------------------- start
export function startApp(platform: Platform) {
  P = platform;
  root = document.getElementById('app')!;
  meta = deserializeMeta(P.storage.get(META_KEY));
  if (!P.storage.get(META_KEY)) meta.settings.lang = P.locale().toLowerCase().startsWith('en') ? 'en' : 'bs';
  const raw = P.storage.get(RUN_KEY);
  if (raw) {
    run = deserializeRun(raw);
    if (!run) { P.storage.remove(RUN_KEY); setTimeout(() => toast('⚠️', t('err.save'), true), 600); }
  }
  try { const c = P.storage.get(CLASSIC_KEY); if (c) { const parsed = JSON.parse(c) as ClassicState; if (parsed.version === 1 && parsed.phase !== 'matchEnd') cl = parsed; } } catch { P.storage.remove(CLASSIC_KEY); }
  applySettings();
  initTooltip(root);
  initNav({ onKey });
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  initDrag();
  const unlockAudio = () => { initAudio(); setVolumes(meta.settings.sfx, meta.settings.music); musicFor(); };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('resize', () => render());
  (window as unknown as { __tablaBusy: () => boolean }).__tablaBusy = () => ui.animating;
  // Test-hook samo za E2E (?e2e): predloži nošenje bez trošenja NAJBOLJE
  if (location.search.includes('e2e')) (window as unknown as { __tablaSuggest: () => boolean }).__tablaSuggest = () => {
    if (!run?.round) return false;
    const b = bestSelection(run); if (!b) return false;
    ui.hand = b.hand; ui.table = b.table; render(); return true;
  };
  render();
  // Deep linkovi: #play = odmah nova partija, #tutorial = tutorijal, #rules = pravila
  const hash = location.hash.slice(1);
  if (hash === 'play' || hash.startsWith('play=')) { startRun({ deck: 'deck_classic', stake: 0, seed: hash.slice(5) }); run = apply(run!, { type: 'startRound' }).state; render(); musicFor(); return; }
  if (hash === 'tutorial') { startTutorial(0); return; }
  if (hash === 'classic') { startClassic(101); return; }
  if (hash === 'rules') { go('rules'); return; }
  setTimeout(() => { if (ui.screen === 'splash') go(meta.tutorialDone || meta.stats.runs > 0 ? 'menu' : 'first'); }, 1400);
}

function applySettings() {
  const s = meta.settings;
  setLang(s.lang);
  document.body.classList.toggle('cb4', s.colorblind);
  document.body.classList.toggle('crt', s.crt);
  document.body.classList.toggle('reduced', s.reducedMotion);
  document.documentElement.style.setProperty('--speed', String(s.speed));
  document.documentElement.style.setProperty('--ts', String(s.textScale));
  setVolumes(s.sfx, s.music);
}

function save() {
  P.storage.set(META_KEY, JSON.stringify(meta));
  if (run && run.tutorial === undefined && run.phase !== 'gameover' && !(run.phase === 'won' && !run.endless && false)) P.storage.set(RUN_KEY, serializeRun(run));
  if (run && run.phase === 'gameover') P.storage.remove(RUN_KEY);
  if (cl && cl.phase !== 'matchEnd') P.storage.set(CLASSIC_KEY, JSON.stringify(cl)); else P.storage.remove(CLASSIC_KEY);
}

function go(s: Screen) { ui.screen = s; ui.confirm = null; hideTip(); render(); musicFor(); if (s === 'classic') scheduleAi(); }

function musicFor() {
  if (ui.screen === 'game' && run?.phase === 'round') playMusic(run.round?.boss ? 'boss' : 'game');
  else if (ui.screen === 'game' || ui.screen === 'classic') playMusic('game');
  else playMusic('menu');
}

// ---------------------------------------------------------------- render
function render() {
  hideTip();
  let html = '';
  switch (ui.screen) {
    case 'splash': html = `<div class="menu-screen"><div class="menu-box"><div class="neon-sign">${t('neon.open')}</div><div class="logo">${t('game.title')}</div><div class="logo-sub">${t('game.subtitle')}</div></div></div>`; break;
    case 'menu': html = menuScreen(); break;
    case 'first': html = firstScreen(); break;
    case 'mode': html = modeScreen(); break;
    case 'goal': html = goalScreen(); break;
    case 'classic': html = classicScreen(); break;
    case 'newrun': html = newRunScreen(); break;
    case 'collection': html = collectionScreen(); break;
    case 'stats': html = statsScreen(); break;
    case 'settings': html = settingsScreen(); break;
    case 'rules': html = `<div class="page"><div class="page-inner"><div class="page-head"><h2>${t('rules.title')}</h2>${back()}</div><div class="panel rules-body">${t('rules.body')}</div></div></div>`; break;
    case 'game': html = gameScreen(); break;
  }
  root.innerHTML = html + '<div class="toast-wrap" id="toasts"></div>';
  // focus prvi element radi gamepad navigacije
  const auto = root.querySelector<HTMLElement>('[data-autofocus]');
  if (auto && !root.contains(document.activeElement) && matchMedia('(pointer: fine)').matches) auto.focus({ preventScroll: true });
  if (run?.round) { ui.prevTable = new Set(run.round.table.map(c => c.id)); ui.prevHand = new Set(run.round.hand.map(c => c.id)); }
}

const back = (to = 'menu') => `<button class="btn ghost small" data-a="go" data-to="${to}">← ${t('menu.back')}</button>`;

function menuScreen(): string {
  const canContinue = run && run.tutorial === undefined && run.phase !== 'gameover';
  return `<div class="menu-screen"><div class="menu-box">
    <div class="neon-sign">${t('neon.open')}</div>
    <div class="logo">${t('game.title')}</div>
    <div class="logo-sub">${t('game.subtitle')}</div>
    <div style="height:10px"></div>
    ${canContinue ? `<button class="btn big" data-a="continue" data-autofocus>${t('menu.continue')}</button>` : ''}
    ${cl ? `<button class="btn ${canContinue ? 'ghost' : 'big'}" data-a="go" data-to="classic" ${canContinue ? '' : 'data-autofocus'}>${t('menu.continueClassic')}</button>` : ''}
    <button class="btn ${canContinue || cl ? 'ghost' : 'big'}" data-a="go" data-to="mode" ${canContinue || cl ? '' : 'data-autofocus'}>${t('menu.new')}</button>
    <button class="btn ghost" data-a="tutorial" data-i="0">${t('menu.tutorial')}</button>
    <div class="row" style="width:100%;justify-content:center">
      <button class="btn ghost small" data-a="go" data-to="collection">${t('menu.collection')}</button>
      <button class="btn ghost small" data-a="go" data-to="stats">${t('menu.stats')}</button>
      <button class="btn ghost small" data-a="go" data-to="rules">${t('menu.rules')}</button>
      <button class="btn ghost small" data-a="go" data-to="settings">${t('menu.settings')}</button>
    </div>
    <div class="menu-foot">${t('menu.version', { v: APP_VERSION })}<br>${t('menu.credits')}</div>
  </div></div>`;
}

function firstScreen(): string {
  return `<div class="menu-screen"><div class="menu-box panel">
    <div class="neon-sign">${t('neon.open')}</div>
    <h2 style="color:var(--lamp);text-align:center">${t('first.title')}</h2>
    <p style="text-align:center;line-height:1.5;color:var(--ink-dim)">${t('first.body')}</p>
    <button class="btn big" data-a="tutorial" data-i="0" data-autofocus>${t('first.learn')}</button>
    <button class="btn ghost" data-a="tutorial" data-i="2">${t('first.know')}</button>
  </div></div>`;
}

function newRunScreen(): string {
  const decks = DECKS.map(d => {
    const locked = !meta.unlockedDecks.includes(d.id);
    return `<button class="choice ${ui.nr.deck === d.id ? 'sel' : ''} ${locked ? 'locked' : ''}" ${locked ? 'disabled' : ''} data-a="nrDeck" data-id="${d.id}">
      <div class="deck-swatch" style="--c:${d.color}"></div><b>${t(`deck.${d.id}.name`)}</b><small>${locked ? '🔒 ' + t(`deck.${d.id}.unlock`) : t(`deck.${d.id}.desc`)}</small></button>`;
  }).join('');
  const stakes = STAKES.map((s, i) => {
    const locked = i > meta.stakeUnlocked;
    return `<button class="choice ${ui.nr.stake === i ? 'sel' : ''} ${locked ? 'locked' : ''}" ${locked ? 'disabled' : ''} data-a="nrStake" data-i="${i}">
      <b>${i + 1}. ${t(`stake.${s.id}.name`)}</b><small>${locked ? '🔒' : t(`stake.${s.id}.desc`)}${i > 0 && !locked ? '<br>' + t('stake.includes') : ''}</small></button>`;
  }).join('');
  return `<div class="page"><div class="page-inner">
    <div class="page-head"><h2>${t('new.title')}</h2><span class="row"><button class="btn ghost small" data-a="goal" data-back="newrun">${t('goal.button')}</button>${back('mode')}</span></div>
    <div class="panel"><div class="label">${t('new.deck')}</div><div class="choice-grid" style="margin-top:8px">${decks}</div></div>
    <div class="panel"><div class="label">${t('new.stake')}</div><div class="choice-grid" style="margin-top:8px">${stakes}</div></div>
    <div class="panel row" style="justify-content:space-between">
      <label class="row"><span class="label">${t('new.seed')}</span><input class="seed" maxlength="8" data-in="seed" value="${escapeHtml(ui.nr.seed)}" placeholder="—"></label>
      <small style="color:var(--ink-dim)">${t('new.seedHint')}</small>
      <button class="btn big" data-a="startRun" data-autofocus>${t('new.start')}</button>
    </div>
  </div></div>`;
}

function collectionScreen(): string {
  const tabs = ['regulars', 'bosses', 'brandies', 'cups', 'vouchers', 'achievements'];
  let body = '';
  if (ui.colTab === 'regulars') body = `<div class="col-grid">${REGULARS.map(r => `<div class="col-item ${meta.seen.regulars.includes(r.id) ? '' : 'unseen'}">${regularHTML(r.id)}<small class="r-${r.rarity}">${t('rarity.' + r.rarity)}</small></div>`).join('')}</div>`;
  if (ui.colTab === 'bosses') body = `<div class="choice-grid">${BOSSES.map(b => `<div class="${meta.seen.bosses.includes(b.id) ? '' : 'col-item unseen'}">${bossHTML(b.id)}</div>`).join('')}</div>`;
  if (ui.colTab === 'brandies') body = `<div class="col-grid">${BRANDIES.map(b => `<div class="col-item">${consumableHTML(b.id)}<small>${t(`brandy.${b.id}.desc`)}</small></div>`).join('')}</div>`;
  if (ui.colTab === 'cups') body = `<div class="col-grid">${CUPS.map(c => `<div class="col-item">${consumableHTML(c.id)}<small>${t(`cup.${c.id}.desc`)}</small></div>`).join('')}</div>`;
  if (ui.colTab === 'vouchers') body = `<div class="col-grid">${VOUCHERS.map(v => `<div class="col-item">${voucherHTML(v.id)}<small>${t(`voucher.${v.id}.desc`)}</small></div>`).join('')}</div>`;
  if (ui.colTab === 'achievements') body = `<div class="choice-grid">${ACHIEVEMENTS.map(a => `<div class="ach ${meta.achievements.includes(a.id) ? '' : 'locked'}"><span class="ai">${a.icon}</span><span><b>${t(`ach.${a.id}.name`)}</b><br><small>${t(`ach.${a.id}.desc`)}</small></span></div>`).join('')}</div>`;
  return `<div class="page"><div class="page-inner">
    <div class="page-head"><h2>${t('col.title')}</h2>${back()}</div>
    <div class="tabs">${tabs.map(x => `<button class="${ui.colTab === x ? 'on' : ''}" data-a="colTab" data-id="${x}">${t('col.' + x)}</button>`).join('')}</div>
    <div class="panel">${body}</div></div></div>`;
}

function statsScreen(): string {
  const s = meta.stats;
  const fav = Object.entries(s.regularPicks).sort((a, b) => b[1] - a[1])[0];
  const item = (k: string, v: string) => `<div class="stat"><span class="label">${t(k)}</span><b>${v}</b></div>`;
  return `<div class="page"><div class="page-inner"><div class="page-head"><h2>${t('stats.title')}</h2>${back()}</div>
    <div class="stat-grid">
      ${item('stats.runs', fmtNum(s.runs))}${item('stats.wins', fmtNum(s.wins))}${item('stats.best', fmtNum(s.bestCapture))}
      ${item('stats.tablas', fmtNum(s.totalTablas))}${item('stats.furthest', fmtNum(s.furthestAnte))}
      ${item('stats.favorite', fav ? `${REG[fav[0]]?.icon ?? ''} ${t(`regular.${fav[0]}.name`)}` : '—')}
      ${item('stats.achievements', `${meta.achievements.length}/${ACHIEVEMENTS.length}`)}
      ${item('stats.classic', `${meta.classic.won} / ${meta.classic.played}`)}
    </div></div></div>`;
}

function settingsScreen(): string {
  const s = meta.settings;
  const seg = (key: string, opts: [string, string][], cur: string) => `<span class="seg">${opts.map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" data-a="set" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</span>`;
  const onoff = (key: string, v: boolean) => seg(key, [['1', t('set.on')], ['0', t('set.off')]], v ? '1' : '0');
  const row = (label: string, ctrl: string) => `<div class="set-row"><span>${label}</span><span>${ctrl}</span></div>`;
  return `<div class="page"><div class="page-inner"><div class="page-head"><h2>${t('set.title')}</h2>${back()}</div><div class="panel">
    ${row(t('set.lang'), seg('lang', [['bs', 'Bosanski'], ['en', 'English']], s.lang))}
    ${row(t('set.music'), `<input type="range" min="0" max="1" step="0.05" value="${s.music}" data-in="music">`)}
    ${row(t('set.sfx'), `<input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-in="sfx">`)}
    ${row(t('set.speed'), seg('speed', [['1', '1×'], ['2', '2×'], ['4', '4×']], String(s.speed)))}
    ${row(t('set.shake'), onoff('shake', s.shake))}
    ${row(t('set.reduced'), onoff('reducedMotion', s.reducedMotion))}
    ${row(t('set.colorblind'), onoff('colorblind', s.colorblind))}
    ${row(t('set.crt'), onoff('crt', s.crt))}
    ${row(t('set.textScale'), seg('textScale', [['1', '100%'], ['1.25', '125%'], ['1.5', '150%']], String(s.textScale)))}
    ${row('', `<button class="btn ghost small" data-a="fullscreen">${t('btn.fullscreen')}</button>`)}
    ${row('', `<span class="row"><button class="btn ghost small" data-a="reset" data-k="run">${ui.confirm === 'run' ? t('set.confirm') : t('set.resetRun')}</button>
      <button class="btn red small" data-a="reset" data-k="all">${ui.confirm === 'all' ? t('set.confirm') : t('set.resetAll')}</button></span>`)}
  </div></div></div>`;
}

// ---------------------------------------------------------------- igra
function roundName(i: number) { return t(['round.small', 'round.big', 'round.boss'][i]!); }

function gameScreen(): string {
  if (!run) return menuScreen();
  switch (run.phase) {
    case 'map': return mapScreen(run);
    case 'round': return roundScreen(run);
    case 'cashout': return cashoutScreen(run);
    case 'shop': return shopScreen(run);
    case 'pack': return packScreen(run);
    case 'gameover': return endScreen(run, false);
    case 'won': return run.tutorial !== undefined ? tutorialDoneScreen(run) : endScreen(run, true);
  }
}

function regsRow(r: RunState, mode: 'round' | 'shop'): string {
  const rules = computeRules(r);
  const items = r.regulars.map((inst, i) => regularHTML(inst.id, {
    inst, cls: ui.regSel === inst.uid ? 'sel' : '',
    attrs: `data-reg="${inst.uid}" data-a="regSel" data-uid="${inst.uid}" data-i="${i}" draggable="true"`,
    extraTip: mode === 'shop' ? t('tip.sell', { n: sellPrice(r, inst) }) : '',
  })).join('');
  const empty = Math.max(0, rules.regularSlots - r.regulars.length);
  return `<div class="regs" aria-label="${t('hud.regulars', { n: r.regulars.length, max: rules.regularSlots })}">${items}${'<span class="slot-empty"></span>'.repeat(empty)}</div>`;
}

function regControls(r: RunState): string {
  if (!ui.regSel) return '';
  const i = r.regulars.findIndex(x => x.uid === ui.regSel);
  if (i < 0) return '';
  const inst = r.regulars[i]!;
  const canSell = r.phase !== 'round';
  return `<div class="row" style="justify-content:center">
    <button class="btn ghost small" data-a="moveReg" data-from="${i}" data-to="${i - 1}" ${i === 0 ? 'disabled' : ''}>${t('btn.moveLeft')}</button>
    <button class="btn ghost small" data-a="moveReg" data-from="${i}" data-to="${i + 1}" ${i === r.regulars.length - 1 ? 'disabled' : ''}>${t('btn.moveRight')}</button>
    ${canSell ? `<button class="btn red small" data-a="sellReg" data-uid="${inst.uid}">${t('btn.sell', { n: sellPrice(r, inst) })}</button>` : ''}
  </div>`;
}

function consBox(r: RunState): string {
  const rules = computeRules(r);
  const items = r.consumables.map((id, i) => consumableHTML(id, { cls: ui.cons?.index === i ? 'sel' : '', attrs: `data-a="consSel" data-i="${i}"` })).join('');
  let ctrl = '';
  if (ui.cons) {
    const id = r.consumables[ui.cons.index];
    if (id) {
      const cup = CUP[id];
      const needs = cup && cup.max > 0;
      ctrl = `<div class="hint warn">${needs ? t('hint.cupTargets', { n: cup.max }) : ''}</div>
        <div class="row"><button class="btn green small" data-a="useCons">${t('btn.use')}</button><button class="btn ghost small" data-a="sellCons">${t('btn.sell', { n: 1 })}</button></div>`;
    }
  }
  return `<div class="box"><div class="label">${t('hud.consumables', { n: r.consumables.length, max: rules.consumableSlots })}</div><div class="cons-row" style="margin-top:8px">${items || '<small style="color:var(--ink-dim)">—</small>'}</div>${ctrl}</div>`;
}

function infoBox(r: RunState): string {
  return `<div class="box"><div class="info-line"><span class="label">${t('hud.money')}</span><span class="money">${fmtNum(r.money)} 💰</span></div>
    <div class="info-line"><span class="label">${t('hud.ante', { n: r.ante })}${r.endless ? ' ∞' : ''}</span><span>${roundName(r.roundIndex)}</span></div>
    <div class="info-line"><span class="label">${t('hud.deck')}</span><span>${r.round ? r.round.drawPile.length + '/' : ''}${r.deck.length}</span></div></div>`;
}

function menuBox(r: RunState): string {
  return `<div class="box hide-m"><div class="info-line"><span class="label">${t('hud.seed')}</span><span style="font-family:var(--display)">${r.seed}</span></div>
    <div style="margin-top:8px;display:grid;gap:6px"><button class="btn ghost small" data-a="goal" data-back="game">${t('goal.button')}</button><button class="btn ghost small" data-a="go" data-to="menu">${t('hud.menu')}</button></div></div>`;
}

function roundScreen(r: RunState): string {
  const rd = r.round!;
  const rules = computeRules(r);
  const tut = r.tutorial !== undefined ? TUTORIAL[r.tutorial] : undefined;
  const step = tut?.steps[ui.tutStep];
  const allowHand = step ? new Set((step.hand ?? []).map(k => 't' + k)) : null;
  const allowTable = step ? new Set((step.table ?? []).map(k => 't' + k)) : null;
  const handCard = rd.hand.find(c => c.id === ui.hand) ?? null;
  const visibleTable = rd.table.filter(c => !c.faceDown);
  const can = handCard && !ui.cons ? capturableIds(handCard, visibleTable, rules.aceAny) : new Set<string>();
  // preview
  let preview: ReturnType<typeof previewCapture> = null;
  let plausible = false;
  const hasHidden = ui.table.some(id => rd.table.find(c => c.id === id)?.faceDown);
  if (handCard && ui.table.length) {
    if (hasHidden) plausible = plausibleSelection(handCard, rd.table.filter(c => ui.table.includes(c.id)), rules.aceAny);
    else preview = previewCapture(r, handCard.id, ui.table);
  }
  const forced = mustForceLay(r);
  const full = rd.table.length >= RULES.tableMax;
  const captureOk = (!!preview || plausible) && (!step || step.until === 'capture');
  const layOk = !!handCard && (forced || (rd.laysLeft > 0 && !full)) && (!step || step.until === 'lay');
  let hint = '';
  if (ui.cons) hint = '';
  else if (forced) hint = full ? t('hint.forcedDiscard') : t('hint.forced');
  else if (!handCard) hint = t('hint.pickHand');
  else if (!ui.table.length) hint = t('hint.pickTable');
  else if (!preview && !plausible) hint = t('hint.invalid');
  if (rd.boss === 'darkness' && rd.table.some(c => c.faceDown) && !hint) hint = t('hint.dark');

  const tableHTML = rd.table.map(c => {
    const cls = [ui.table.includes(c.id) ? 'sel' : '', can.has(c.id) && !ui.table.includes(c.id) ? 'can' : '', ui.prevTable.size && !ui.prevTable.has(c.id) ? 'enter' : '',
      allowTable && !allowTable.has(c.id) ? 'locked' : '', allowTable?.has(c.id) && !ui.table.includes(c.id) && ui.hand ? 'pulse' : ''].join(' ');
    return cardHTML(c, { cls, attrs: `data-a="tableCard" data-id="${c.id}"` });
  }).join('');
  const handHTML = rd.hand.map(c => {
    const target = ui.cons?.targets.includes(c.id);
    const cls = [ui.hand === c.id || target ? 'sel' : '', ui.prevHand.size && !ui.prevHand.has(c.id) ? 'enter' : '',
      allowHand && !allowHand.has(c.id) ? 'locked' : '', allowHand?.has(c.id) && ui.hand !== c.id ? 'pulse' : ''].join(' ');
    return cardHTML(c, { cls, attrs: `data-a="handCard" data-id="${c.id}"` });
  }).join('');

  const pct = Math.min(100, (rd.score / rd.target) * 100);
  const capDanger = rd.capturesLeft <= 1 && rd.score < rd.target * 0.7;
  const typeLine = preview
    ? `${t('type.' + preview.captureType)}${preview.steps.some(s => s.source.kind === 'tabla') ? ' + ' + t('type.tabla') : ''} <small>${t('type.level', { n: r.levels[preview.captureType as 'pair'] })} · = ${fmtNum(preview.total)}${handCard?.rank === 1 ? ' · ' + t('preview.value', { label: 'A', v: preview.value }) : ''}${r.regulars.some(x => x.id === 'gambler') ? ' · ' + t('preview.dice') : ''}</small>`
    : plausible ? '? × ?' : '';
  const tutBox = step ? `<div class="box tut-box"><div class="tut-tag">${t('tut.round', { n: (r.tutorial ?? 0) + 1 })}</div><div>${t(`tut.${r.tutorial}.${ui.tutStep}`)}</div>${step.until === 'next' ? `<div style="margin-top:8px"><button class="btn small" data-a="tutNext" data-autofocus>${t('btn.next')}</button></div>` : ''}</div>` : '';

  return `<div class="game" id="gameRoot">
    <div class="side left">
      <div class="box score-box">
        <div class="info-line"><span class="round-name">${roundName(r.roundIndex)}</span><span class="label">${t('hud.ante', { n: r.ante })}</span></div>
        ${r.tutorial === undefined ? anteTrack(r) : ''}
        ${rd.boss ? bossHTML(rd.boss) : ''}
        <div class="info-line" style="margin-top:6px"><span class="label">${t('hud.target')}</span><span class="target">${fmtNum(rd.target)}</span></div>
        <div class="info-line"><span class="label">${t('hud.score')}</span><span class="score" id="scoreVal">${fmtNum(rd.score)}</span></div>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="cxm"><div class="cbox" id="cbox">${preview ? fmtNum(preview.chips) : '0'}</div><div class="x">×</div><div class="mbox" id="mbox">${preview ? fmtNum(preview.mult) : '0'}</div></div>
        <div class="ctype" id="ctype">${typeLine}</div>
      </div>
      <div class="box"><div class="counters">
        <div class="counter cap ${capDanger ? 'danger' : ''}"><span class="label">${t('hud.captures')}</span><b>${rd.capturesLeft}</b></div>
        <div class="counter lay"><span class="label">${t('hud.lays')}</span><b>${rd.laysLeft}</b></div>
      </div></div>
      ${infoBox(r)}
    </div>
    <div class="center">
      ${tutBox}
      ${regsRow(r, 'round')}
      ${regControls(r)}
      <div class="felt" id="felt" aria-label="Sto">${tableHTML}</div>
      <div class="hint ${forced ? 'warn' : ''}">${hint}</div>
      <div class="hand" id="hand">${handHTML}</div>
      <div class="actions">
        <button class="btn blue" data-a="best" ${step || (rd.bestLeft ?? RULES.bestPerRound) <= 0 ? 'disabled' : ''} title="${t('best.tip', { n: RULES.bestPerRound })}">${t('btn.bestN', { n: rd.bestLeft ?? RULES.bestPerRound })}</button>
        <button class="btn" data-a="capture" ${captureOk ? '' : 'disabled'} ${captureOk ? 'data-autofocus' : ''}>${t('btn.capture')}</button>
        <button class="btn red" data-a="lay" ${layOk ? '' : 'disabled'}>${forced && full ? t('btn.discard') : t('btn.lay')}</button>
      </div>
    </div>
    <div class="side right">
      ${consBox(r)}
      ${menuBox(r)}
    </div>
  </div>`;
}

function mapScreen(r: RunState): string {
  const rounds = [0, 1, 2].map(i => {
    const cur = i === r.roundIndex, done = i < r.roundIndex, boss = i === 2;
    const reward = boss && r.stakeLevel >= 1 ? 0 : RULES.roundReward[i]!;
    return `<div class="map-round ${cur ? 'cur' : ''} ${done ? 'done' : ''} ${boss ? 'boss' : ''}">
      <span class="label">${done ? t('map.done') : cur ? t('map.current') : ''}</span>
      <span class="round-name">${roundName(i)}</span>
      <span class="target">${t('map.target', { n: targetFor(r, i as 0 | 1 | 2) })}</span>
      <small class="money">${t('map.reward', { n: reward })}</small>
      ${boss && r.bossForAnte ? bossHTML(r.bossForAnte) + `<small style="color:var(--ink-dim)">${t('map.bossWarn')}</small>` : ''}
    </div>`;
  }).join('');
  return `<div class="page"><div class="page-inner">
    <div class="page-head"><h2>${t('map.title', { n: r.ante })}${r.endless ? ' · ' + t('hud.endless') : ''}</h2><span class="money">${fmtNum(r.money)} 💰</span></div>
    ${regsRow(r, 'shop')}
    <div class="map-rounds">${rounds}</div>
    <div class="row" style="justify-content:center"><button class="btn big" data-a="act" data-type="startRound" data-autofocus>${t('btn.play')}</button>
      <button class="btn ghost" data-a="go" data-to="menu">${t('hud.menu')}</button></div>
  </div></div>`;
}

function cashoutScreen(r: RunState): string {
  const lines = r.cashout ?? [];
  const total = lines.reduce((a, l) => a + l.amount, 0);
  const lineHTML = lines.map((l, i) => {
    const label = l.key === 'cash.regular' ? `${REG[String(l.params?.id)]?.icon ?? ''} ${t(`regular.${l.params?.id}.name`)}` : t(l.key, l.params ?? {});
    return `<div class="cash-line" style="animation-delay:${i * 0.18}s"><span>${label}</span><span class="money">+${fmtNum(l.amount)}</span></div>`;
  }).join('');
  return `<div class="overlay-screen"><div class="panel center-col">
    <div class="neon-sign" style="font-size:1.6rem">${t('cash.title')}</div>
    <div class="cash-lines">${lineHTML}<div class="cash-line total" style="animation-delay:${lines.length * 0.18}s"><span>${t('cash.total')}</span><span class="money">+${fmtNum(total)} 💰</span></div></div>
    <button class="btn big" data-a="act" data-type="collect" data-autofocus>${r.tutorial !== undefined ? t('btn.next') : t('btn.collect')}</button>
  </div></div>`;
}

function shopScreen(r: RunState): string {
  const shop = r.shop!;
  const items = shop.items.map((it, i) => {
    const art = it.kind === 'regular' ? regularHTML(it.id, { edition: it.edition }) : consumableHTML(it.id);
    return `<div class="offer ${it.sold ? 'sold' : ''}">${art}<span class="price">${it.price} 💰</span><button class="btn small" data-a="act" data-type="buy" data-index="${i}" ${it.sold || r.money < it.price ? 'disabled' : ''}>${t('btn.buy')}</button></div>`;
  }).join('');
  const packs = shop.packs.map((p, i) => `<div class="offer ${p.sold ? 'sold' : ''}">${packHTML(p.id)}<span class="price">${p.price} 💰</span><button class="btn small" data-a="act" data-type="buyPack" data-index="${i}" ${p.sold || r.money < p.price ? 'disabled' : ''}>${t('btn.buy')}</button></div>`).join('');
  const vPrice = voucherPrice(r);
  const voucher = r.anteVoucher ? `<div class="offer ${r.anteVoucherBought ? 'sold' : ''}">${voucherHTML(r.anteVoucher)}<span class="price">${vPrice} 💰</span><button class="btn small" data-a="act" data-type="buyVoucher" ${r.anteVoucherBought || r.money < vPrice ? 'disabled' : ''}>${t('btn.buy')}</button></div>` : '';
  const firstHint = r.firstRun && !r.regulars.length ? `<div class="box tut-box">${t('shop.firstHint')}</div>` : '';
  return `<div class="page"><div class="page-inner">
    <div class="page-head"><h2>🍺 ${t('shop.title')}</h2><span class="money" style="font-size:1.5rem">${fmtNum(r.money)} 💰</span></div>
    ${firstHint}
    <div class="panel"><div class="label">${t('shop.yourRegulars')} · <small>${t('shop.dragHint')}</small></div><div style="margin-top:8px">${regsRow(r, 'shop')}</div>${regControls(r)}</div>
    <div class="shop-grid">
      <div class="panel"><div class="label">${t('shop.items')}</div><div class="offers" style="margin-top:10px">${items}</div>
        <div class="row" style="justify-content:center;margin-top:12px"><button class="btn blue small" data-a="act" data-type="reroll" ${r.money < shop.rerollCost ? 'disabled' : ''}>${t('btn.reroll', { n: shop.rerollCost })}</button></div></div>
      <div class="panel"><div class="label">${t('shop.packs')} · ${t('shop.voucher')}</div><div class="offers" style="margin-top:10px">${packs}${voucher}</div></div>
    </div>
    ${consBox(r)}
    <div class="row" style="justify-content:center"><button class="btn big green" data-a="leaveShop" data-autofocus>${t('btn.leave')} →</button></div>
  </div></div>`;
}

function packScreen(r: RunState): string {
  const p = r.pack!;
  const opts = p.options.map((o, i) => {
    const taken = p.taken.includes(i);
    let art = '';
    if (o.kind === 'regular') art = regularHTML(o.id, { edition: o.edition });
    else if (o.kind === 'card') art = cardHTML(o.card, { tip: true });
    else art = consumableHTML(o.id);
    return `<div class="offer ${taken ? 'sold' : ''}"><div data-a="packOpt" data-i="${i}" class="${ui.packIndex === i ? 'sel-wrap' : ''}" style="${ui.packIndex === i ? 'outline:3px solid var(--neon2);border-radius:14px;outline-offset:4px' : ''}">${art}</div>
      <button class="btn small" data-a="packOpt" data-i="${i}" ${taken ? 'disabled' : ''}>${t('btn.pick')}</button></div>`;
  }).join('');
  const selCup = ui.packIndex !== null ? p.options[ui.packIndex] : undefined;
  const cupDef = selCup?.kind === 'cup' ? CUP[selCup.id] : undefined;
  const cards = p.cards.length ? `<div class="panel"><div class="hint warn">${cupDef && cupDef.max > 0 ? t('hint.cupTargetsPack', { n: cupDef.max }) : ''}</div>
    <div class="hand" style="flex-wrap:wrap">${p.cards.map(c => cardHTML(c, { cls: ui.packTargets.includes(c.id) ? 'sel' : '', attrs: `data-a="packCard" data-id="${c.id}"` })).join('')}</div>
    ${cupDef ? `<div class="row" style="justify-content:center"><button class="btn green" data-a="packConfirm">${t('btn.use')}</button></div>` : ''}</div>` : '';
  return `<div class="page"><div class="page-inner">
    <div class="page-head"><h2>${t(`pack.${p.id}.name`)}</h2><span class="label">${t('pack.picks', { n: p.picksLeft })}</span></div>
    <div class="panel"><div class="offers">${opts}</div></div>
    ${cards}
    <div class="row" style="justify-content:center"><button class="btn ghost" data-a="act" data-type="packSkip">${t('btn.skip')}</button></div>
  </div></div>`;
}

function endScreen(r: RunState, won: boolean): string {
  return `<div class="overlay-screen"><div class="panel center-col" style="max-width:520px">
    <div class="neon-sign">${won ? t('won.title') : t('over.title')}</div>
    <p>${won ? t('won.body', { best: fmtNum(r.stats.bestCapture) }) : t('over.body', { ante: r.ante, best: fmtNum(r.stats.bestCapture) })}</p>
    <p style="color:var(--ink-dim)">${t('over.stats', { c: r.stats.captures, t: r.stats.tablas, b: r.stats.bossesBeaten })}</p>
    <div class="row" style="justify-content:center"><span class="label">${t('hud.seed')}</span><b style="font-family:var(--display);letter-spacing:.2em">${r.seed}</b><button class="btn ghost small" data-a="copySeed">${t('btn.copySeed')}</button></div>
    ${won ? `<small style="color:var(--ink-dim)">${t('won.endlessHint')}</small><button class="btn big" data-a="act" data-type="continueEndless" data-autofocus>${t('btn.endless')}</button>` : ''}
    <div class="row" style="justify-content:center"><button class="btn ${won ? 'ghost' : 'big'}" data-a="go" data-to="newrun" ${won ? '' : 'data-autofocus'}>${t('btn.newRun')}</button><button class="btn ghost" data-a="go" data-to="menu">${t('btn.menu')}</button></div>
  </div></div>`;
}

function tutorialDoneScreen(r: RunState): string {
  const i = r.tutorial ?? 0;
  const last = i >= TUTORIAL.length - 1;
  return `<div class="overlay-screen"><div class="panel center-col" style="max-width:520px">
    <div class="neon-sign">${last ? t('tut.done.title') : t('cash.title')}</div>
    ${last ? `<p style="line-height:1.5">${t('tut.done.body')}</p>` : ''}
    ${last ? `<button class="btn big" data-a="firstRun" data-autofocus>${t('btn.firstRun')}</button>` : `<button class="btn big" data-a="tutorial" data-i="${i + 1}" data-autofocus>${t('tut.nextRound')} →</button>`}
    <button class="btn ghost" data-a="go" data-to="menu">${t('btn.menu')}</button>
  </div></div>`;
}

// ---------------------------------------------------------------- akcije
async function dispatch(a: Action): Promise<boolean> {
  if (!run || ui.animating) return false;
  const prev = run;
  const { state, events } = apply(run, a);
  const err = events.find(e => e.type === 'error');
  if (err && err.type === 'error') { sfx.error(); toast('⚠️', t(err.key), true); return false; }
  const mr = processEvents(meta, prev, state, events);
  meta = mr.meta;
  const cap = events.find(e => e.type === 'captured');
  if (cap && cap.type === 'captured') {
    ui.animating = true;
    try { await animateCapture(cap, events); } finally { ui.animating = false; ui.skip = false; }
  }
  run = state;
  afterEvents(events, prev);
  for (const id of mr.achievements) { P.achievements.unlock(id); toast(ACHIEVEMENTS.find(x => x.id === id)?.icon ?? '🏆', `${t('ach.title')}<b>${t(`ach.${id}.name`)}</b>`); }
  for (const id of mr.unlocks) toast('🔓', `${t('unlock.title')}<b>${t(`deck.${id}.name`)}</b>`);
  save();
  if (DEMO && run.phase === 'shop' && run.ante >= 2 && run.roundIndex === 2) { run = null; P.storage.remove(RUN_KEY); go('menu'); toast('🎬', t('demo.end')); return true; }
  render();
  musicFor();
  return true;
}

function afterEvents(events: GameEvent[], prev: RunState) {
  const tut = run?.tutorial !== undefined ? TUTORIAL[run.tutorial!] : undefined;
  for (const e of events) {
    switch (e.type) {
      case 'captured': ui.hand = null; ui.table = []; if (tut && tut.steps[ui.tutStep]?.until === 'capture') ui.tutStep++; break;
      case 'laid': sfx.lay(); ui.hand = null; ui.table = []; if (tut && tut.steps[ui.tutStep]?.until === 'lay') ui.tutStep++; break;
      case 'glassBroken': sfx.glass(); toast('🥂', t('fx.glass')); break;
      case 'missInDark': toast('🕯️', t('fx.missDark'), true); break;
      case 'discarded': toast('🥴', t('fx.discard')); break;
      case 'roundWon': sfx.win(); break;
      case 'roundLost': sfx.lose(); break;
      case 'bossDefeated': break;
      case 'consumableUsed': sfx.pop(); ui.cons = null; break;
      case 'regularAdded': sfx.buy(); break;
    }
  }
  if (run?.phase === 'round' && prev.phase !== 'round') { sfx.card(); if (run.round?.boss) sfx.boss(); }
}

function cardEl(id: string) { return root.querySelector<HTMLElement>(`[data-card="${CSS.escape(id)}"]`); }

function wait(ms: number) {
  const s = meta.settings.speed;
  return new Promise<void>(res => (ui.skip ? res() : setTimeout(res, ms / s)));
}

function pop(el: Element | null, text: string, cls: string) {
  if (!el || ui.skip) return;
  const r = el.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'pop ' + cls;
  d.textContent = text;
  d.style.left = r.left + r.width / 2 + 'px';
  d.style.top = r.top + 6 + 'px';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 900 / meta.settings.speed);
}

function shake() {
  if (!meta.settings.shake || meta.settings.reducedMotion || ui.skip) return;
  const g = root.querySelector('#gameRoot') ?? root;
  g.classList.remove('shake'); void (g as HTMLElement).offsetWidth; g.classList.add('shake');
}

function banner(text: string, cls = '') {
  if (ui.skip) return;
  const b = document.createElement('div');
  b.className = 'big-banner ' + cls;
  b.innerHTML = `<span>${escapeHtml(text)}</span>`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1300 / meta.settings.speed);
}

function confetti() {
  if (meta.settings.reducedMotion || ui.skip) return;
  const colors = ['#ff4f8b', '#f2b33d', '#44e3d2', '#5fd28a', '#3b8cff'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-20px';
    c.style.background = colors[i % colors.length]!;
    c.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
    c.style.animationDuration = (1.2 + Math.random() * 1.4) / meta.settings.speed + 's';
    c.style.animationDelay = Math.random() * 0.3 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

function stepText(s: ScoreStep): { text: string; cls: string }[] {
  const out: { text: string; cls: string }[] = [];
  if (s.source.kind === 'retrigger') out.push({ text: t('fx.again'), cls: 'info' });
  if (s.chipsDelta) out.push({ text: t('fx.chips', { n: s.chipsDelta }), cls: 'chips' });
  if (s.multDelta) out.push({ text: t('fx.mult', { n: s.multDelta }), cls: 'mult' });
  if (s.xMult !== 1) out.push({ text: s.xMult === 0 ? t('fx.zero') : t('fx.xmult', { n: Math.round(s.xMult * 100) / 100 }), cls: 'xmult' });
  if (s.money) out.push({ text: t('fx.money', { n: s.money }), cls: 'money' });
  return out;
}

async function animateCapture(ev: Extract<GameEvent, { type: 'captured' }>, _events: GameEvent[]) {
  const cbox = root.querySelector('#cbox'), mbox = root.querySelector('#mbox'), ctype = root.querySelector('#ctype');
  if (ctype) ctype.innerHTML = t('type.' + ev.captureType) + (ev.tabla ? ' + ' + t('type.tabla') : '');
  const ids = [ev.handCard.id, ...ev.tableCards.map(c => c.id)];
  sfx.card();
  for (const id of ids) cardEl(id)?.classList.add('scoring');
  if (cbox) cbox.textContent = '0';
  if (mbox) mbox.textContent = '0';
  let n = 0;
  for (const s of ev.result.steps) {
    let el: Element | null = null;
    if (s.source.kind === 'card' || s.source.kind === 'retrigger' || s.source.kind === 'enh' || s.source.kind === 'seal' || s.source.kind === 'held') el = cardEl(s.source.cardId);
    else if (s.source.kind === 'regular' || (s.source.kind === 'edition' && s.source.uid)) {
      const uid = s.source.kind === 'regular' ? s.source.uid : s.source.uid!;
      el = root.querySelector(`[data-reg="${uid}"]`);
      if (el && !ui.skip) { el.classList.remove('trigger'); void (el as HTMLElement).offsetWidth; el.classList.add('trigger'); }
    } else if (s.source.kind === 'edition' && s.source.cardId) el = cardEl(s.source.cardId);
    else el = s.multDelta || s.xMult !== 1 ? mbox : cbox;
    for (const p of stepText(s)) pop(el, p.text, p.cls);
    if (cbox) cbox.textContent = fmtNum(s.chips);
    if (mbox) mbox.textContent = fmtNum(Math.round(s.mult * 10) / 10);
    const hit = s.xMult !== 1 || s.multDelta ? mbox : cbox;
    if (hit && !ui.skip) { hit.classList.remove('hit'); void (hit as HTMLElement).offsetWidth; hit.classList.add('hit'); }
    if (!ui.skip) {
      if (s.xMult !== 1) { sfx.xmult(); shake(); } else if (s.multDelta) sfx.mult(n); else sfx.chips(n);
      if (s.money) sfx.coin();
    }
    n++;
    await wait(s.source.kind === 'base' ? 320 : s.xMult !== 1 ? 380 : 230);
  }
  if (ev.tabla) {
    banner(t('fx.tabla'));
    if (!ui.skip) { sfx.tabla(); confetti(); shake(); }
    await wait(1000);
  }
  const total = ev.result.total;
  banner(fmtNum(total), 'total');
  if (!ui.skip) sfx.total(Math.log10(Math.max(10, total)));
  if (total >= 1000) shake();
  const sv = root.querySelector('#scoreVal');
  if (sv && run?.round) {
    const from = run.round.score, to = from + total;
    const steps = ui.skip ? 1 : 14;
    for (let i = 1; i <= steps; i++) { sv.textContent = fmtNum(Math.round(from + (to - from) * i / steps)); await wait(28); }
    sv.classList.add('bump');
  }
  for (const id of ids) cardEl(id)?.classList.add('fly-out');
  await wait(420);
}

function bestSelection(r: RunState): { hand: string; table: string[] } | null {
  const rd = r.round!;
  const rules = computeRules(r);
  let best: { hand: string; table: string[]; s: number } | null = null;
  for (const h of rd.hand) {
    for (const o of findCaptures(h, rd.table.filter(c => !c.faceDown), rules.aceAny)) {
      const p = previewCapture(r, h.id, o.tableIds);
      if (p && (!best || p.total > best.s)) best = { hand: h.id, table: o.tableIds, s: p.total };
    }
  }
  return best;
}

function tutAllowed(kind: 'hand' | 'table', id: string): boolean {
  if (run?.tutorial === undefined) return true;
  const step = TUTORIAL[run.tutorial]?.steps[ui.tutStep];
  if (!step) return true;
  const list = (kind === 'hand' ? step.hand : step.table) ?? [];
  return list.map(k => 't' + k).includes(id);
}

function startTutorial(i: number) {
  run = newRun({ seed: 'TUTOR00' + (i + 1), seeded: true, deckId: 'deck_classic', stakeLevel: 0, tutorial: i });
  run = apply(run, { type: 'startRound' }).state;
  ui.tutStep = 0; ui.hand = null; ui.table = []; ui.cons = null;
  ui.prevTable = new Set(); ui.prevHand = new Set();
  go('game');
}

function startRun(opts: { deck: string; stake: number; seed: string; firstRun?: boolean }) {
  const seed = normalizeSeed(opts.seed);
  const seeded = seed.length === 8;
  run = newRun({ seed: seeded ? seed : seedFromNumber(Date.now() ^ Math.floor(Math.random() * 1e9)), seeded, deckId: opts.deck, stakeLevel: opts.stake, firstRun: opts.firstRun });
  meta.stats.runs++;
  ui.hand = null; ui.table = []; ui.cons = null; ui.regSel = null; ui.shopWarned = false;
  ui.prevTable = new Set(); ui.prevHand = new Set();
  save();
  go('game');
}

async function onClick(e: MouseEvent) {
  if (consumeLongPress()) return;
  if (ui.animating) { ui.skip = true; return; }
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-a]');
  if (!el || (el as HTMLButtonElement).disabled) return;
  const d = el.dataset;
  const a = d.a!;
  switch (a) {
    case 'go': {
      const to = d.to as Screen;
      if (to === 'menu' && run?.tutorial !== undefined && run.phase !== 'won') { /* izlaz iz tutorijala */ }
      go(to); break;
    }
    case 'continue': go('game'); break;
    case 'tutorial': startTutorial(Number(d.i)); break;
    case 'firstRun': meta.tutorialDone = true; startRun({ deck: 'deck_classic', stake: 0, seed: '', firstRun: meta.stats.runs === 0 }); break;
    case 'nrDeck': ui.nr.deck = d.id!; render(); break;
    case 'nrStake': ui.nr.stake = Number(d.i); render(); break;
    case 'startRun': if (run?.tutorial === undefined && run && run.phase !== 'gameover' && ui.confirm !== 'newrun') { ui.confirm = 'newrun'; toast('⚠️', t('set.confirm')); return; } startRun({ deck: ui.nr.deck, stake: ui.nr.stake, seed: ui.nr.seed }); break;
    case 'colTab': ui.colTab = d.id!; render(); break;
    case 'set': {
      const s = meta.settings as unknown as Record<string, unknown>;
      const k = d.k!, v = d.v!;
      if (k === 'lang') s.lang = v;
      else if (k === 'speed') s.speed = Number(v);
      else if (k === 'textScale') s.textScale = Number(v);
      else s[k] = v === '1';
      applySettings(); save(); render(); break;
    }
    case 'fullscreen': if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.().catch(() => {}); break;
    case 'reset': {
      if (ui.confirm !== d.k) { ui.confirm = d.k!; render(); return; }
      if (d.k === 'run') { run = null; P.storage.remove(RUN_KEY); }
      else { P.storage.remove(RUN_KEY); P.storage.remove(META_KEY); location.reload(); }
      ui.confirm = null; render(); break;
    }
    case 'copySeed': try { await navigator.clipboard.writeText(run?.seed ?? ''); el.textContent = t('btn.copied'); } catch { /* clipboard nije dostupan */ } break;
    case 'act': {
      const type = d.type as Action['type'];
      const act = (d.index !== undefined ? { type, index: Number(d.index) } : { type }) as Action;
      if (type === 'buy' || type === 'buyPack' || type === 'buyVoucher') { if (await dispatch(act)) sfx.buy(); }
      else if (type === 'collect') { if (await dispatch(act)) sfx.cash(); }
      else await dispatch(act);
      if (type === 'buyPack') { ui.packIndex = null; ui.packTargets = []; render(); }
      break;
    }
    case 'leaveShop': {
      if (run?.firstRun && !run.regulars.length && run.money >= 4 && !ui.shopWarned) { ui.shopWarned = true; toast('🤔', t('shop.noRegularWarn')); return; }
      ui.regSel = null; ui.cons = null;
      await dispatch({ type: 'leaveShop' }); break;
    }
    case 'handCard': {
      const id = d.id!;
      if (ui.cons) {
        const tg = ui.cons.targets;
        ui.cons.targets = tg.includes(id) ? tg.filter(x => x !== id) : [...tg, id];
        sfx.select(); render(); return;
      }
      if (!tutAllowed('hand', id)) return;
      if (ui.hand === id) { ui.hand = null; ui.table = []; sfx.deselect(); }
      else { ui.hand = id; ui.table = []; sfx.select(); }
      render(); break;
    }
    case 'tableCard': {
      const id = d.id!;
      if (!tutAllowed('table', id)) return;
      ui.table = ui.table.includes(id) ? ui.table.filter(x => x !== id) : [...ui.table, id];
      sfx.select(); render(); break;
    }
    case 'best': {
      if (!run) return;
      const b = bestSelection(run);
      if (!b) { toast('🤷', t('hint.mustLay')); return; }
      if (!(await dispatch({ type: 'useBest' }))) return;
      ui.hand = b.hand; ui.table = b.table; sfx.select(); render(); break;
    }
    case 'goal': ui.goalBack = (d.back as Screen) ?? 'mode'; go('goal'); break;
    case 'goalOk': meta.goalSeen = true; save(); go(ui.goalBack === 'mode' ? 'newrun' : ui.goalBack); break;
    case 'pickRogue': if (!meta.goalSeen) { ui.goalBack = 'mode'; go('goal'); } else go('newrun'); break;
    case 'ctarget': ui.ctarget = Number(d.v); render(); break;
    case 'classicStart': startClassic(ui.ctarget); break;
    case 'cHand': if (!cl || cl.turn !== 0 || ui.aiBusy) return; ui.chand = ui.chand === d.id ? null : d.id!; ui.ctable = []; sfx.select(); render(); break;
    case 'cTable': if (!cl || cl.turn !== 0 || ui.aiBusy) return; ui.ctable = ui.ctable.includes(d.id!) ? ui.ctable.filter(x => x !== d.id) : [...ui.ctable, d.id!]; sfx.select(); render(); break;
    case 'cBest': {
      if (!cl) return;
      const b = bestMove(cl, 0);
      if (!b) { toast('🤷', t('hint.mustLay')); return; }
      if (await classicDispatch({ type: 'useBest' })) { ui.chand = b.handId; ui.ctable = b.tableIds; render(); }
      break;
    }
    case 'cCapture': if (ui.chand && ui.ctable.length) await classicDispatch({ type: 'capture', handId: ui.chand, tableIds: ui.ctable }); break;
    case 'cLay': if (ui.chand) await classicDispatch({ type: 'lay', handId: ui.chand }); break;
    case 'cNext': await classicDispatch({ type: 'nextDeal' }); break;
    case 'cNew': cl = null; save(); go('mode'); break;
    case 'capture': if (ui.hand && ui.table.length) await dispatch({ type: 'capture', handId: ui.hand, tableIds: ui.table }); break;
    case 'lay': if (ui.hand) await dispatch({ type: 'lay', handId: ui.hand }); break;
    case 'tutNext': ui.tutStep++; render(); break;
    case 'regSel': ui.regSel = ui.regSel === d.uid ? null : d.uid!; render(); break;
    case 'moveReg': ui.regSel = run?.regulars[Number(d.from)]?.uid ?? null; await dispatch({ type: 'moveRegular', from: Number(d.from), to: Number(d.to) }); break;
    case 'sellReg': ui.regSel = null; if (await dispatch({ type: 'sellRegular', uid: d.uid! })) sfx.cash(); break;
    case 'consSel': {
      const i = Number(d.i);
      ui.cons = ui.cons?.index === i ? null : { index: i, targets: [] };
      ui.hand = null; ui.table = [];
      render(); break;
    }
    case 'useCons': if (ui.cons) await dispatch({ type: 'useConsumable', index: ui.cons.index, targets: ui.cons.targets }); break;
    case 'sellCons': if (ui.cons) { const i = ui.cons.index; ui.cons = null; if (await dispatch({ type: 'sellConsumable', index: i })) sfx.cash(); } break;
    case 'packOpt': {
      if (!run?.pack) return;
      const i = Number(d.i);
      const o = run.pack.options[i];
      if (o?.kind === 'cup' && (CUP[o.id]?.max ?? 0) > 0) { ui.packIndex = i; ui.packTargets = []; render(); return; }
      ui.packIndex = null; ui.packTargets = [];
      await dispatch({ type: 'packPick', index: i });
      break;
    }
    case 'packCard': {
      const id = d.id!;
      ui.packTargets = ui.packTargets.includes(id) ? ui.packTargets.filter(x => x !== id) : [...ui.packTargets, id];
      sfx.select(); render(); break;
    }
    case 'packConfirm': if (ui.packIndex !== null) { const i = ui.packIndex; const tg = ui.packTargets; if (await dispatch({ type: 'packPick', index: i, targets: tg })) { ui.packIndex = null; ui.packTargets = []; render(); } } break;
  }
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement;
  const k = el.dataset.in;
  if (k === 'seed') { ui.nr.seed = normalizeSeed(el.value); if (el.value !== ui.nr.seed) el.value = ui.nr.seed; }
  if (k === 'music' || k === 'sfx') { meta.settings[k] = Number(el.value); applySettings(); if (e.type === 'change') save(); }
}

function onKey(key: string): boolean {
  initAudio();
  if (ui.animating) { ui.skip = true; return true; }
  const k = key.toLowerCase();
  if (key === 'Escape') {
    if (ui.screen === 'game' && run?.phase === 'round' && (ui.hand || ui.cons)) { ui.hand = null; ui.table = []; ui.cons = null; render(); return true; }
    if (ui.screen !== 'menu' && ui.screen !== 'splash') { go('menu'); return true; }
    return false;
  }
  if (ui.screen === 'splash') { go(meta.tutorialDone || meta.stats.runs > 0 ? 'menu' : 'first'); return true; }
  if (ui.screen === 'classic') {
    const clk = (sel: string) => { const b = root.querySelector<HTMLButtonElement>(sel); if (b && !b.disabled) b.click(); return true; };
    if (k === 'c') return clk('[data-a="cCapture"]');
    if (k === 'v') return clk('[data-a="cLay"]');
    if (k === 'b') return clk('[data-a="cBest"]');
    return false;
  }
  if (ui.screen !== 'game' || run?.phase !== 'round') return false;
  const click = (sel: string) => { const b = root.querySelector<HTMLButtonElement>(sel); if (b && !b.disabled) b.click(); return true; };
  if (k === 'c') return click('[data-a="capture"]');
  if (k === 'v') return click('[data-a="lay"]');
  if (k === 'b') return click('[data-a="best"]');
  if (key === '[hand]') { root.querySelector<HTMLElement>('#hand .card')?.focus(); return true; }
  if (key === '[table]') { root.querySelector<HTMLElement>('#felt .card')?.focus(); return true; }
  return false;
}

function initDrag() {
  let from: number | null = null;
  root.addEventListener('dragstart', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.regular[data-i]');
    if (!el) return;
    from = Number(el.dataset.i);
    el.classList.add('dragging');
    e.dataTransfer?.setData('text/plain', String(from));
  });
  root.addEventListener('dragover', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.regular[data-i]');
    if (el && from !== null) { e.preventDefault(); el.classList.add('drop-target'); }
  });
  root.addEventListener('dragleave', e => { (e.target as HTMLElement).closest('.regular')?.classList.remove('drop-target'); });
  root.addEventListener('drop', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.regular[data-i]');
    if (!el || from === null) return;
    e.preventDefault();
    const to = Number(el.dataset.i);
    const f = from; from = null;
    if (f !== to) void dispatch({ type: 'moveRegular', from: f, to });
  });
  root.addEventListener('dragend', () => { from = null; });
}

function toast(icon: string, html: string, err = false) {
  const wrap = root.querySelector('#toasts') ?? document.body;
  const d = document.createElement('div');
  d.className = 'toast' + (err ? ' err' : '');
  d.innerHTML = `<span class="ti">${icon}</span><span>${html}</span>`;
  wrap.appendChild(d);
  while (wrap.children.length > 3) wrap.firstElementChild?.remove();
  setTimeout(() => d.remove(), 3200);
}

// pomoćno za konzolu/debug (ne koristi se u igri)
export const debug = { get run() { return run; }, get meta() { return meta; }, BOSS, BRANDY, label: (c: Card) => RANK_LABEL[c.rank] + SUIT_SYMBOL[c.suit] };

// ---------------------------------------------------------------- izbor moda, cilj igre
function modeScreen(): string {
  const seg = [[0, t('mode.classic.t0')], [51, t('mode.classic.t51')], [101, t('mode.classic.t101')]] as const;
  return `<div class="page"><div class="page-inner">
    <div class="page-head"><h2>${t('mode.title')}</h2>${back()}</div>
    <div class="mode-grid">
      <div class="panel mode-card">
        <div class="mode-icon">🍻</div>
        <h3>${t('mode.rogue.name')}</h3>
        <p>${t('mode.rogue.desc')}</p>
        <p class="mode-goal">${t('mode.rogue.goal')}</p>
        <div class="row"><button class="btn big" data-a="pickRogue" data-autofocus>${t('mode.pick')}</button><button class="btn ghost small" data-a="goal" data-back="mode">${t('goal.button')}</button></div>
      </div>
      <div class="panel mode-card">
        <div class="mode-icon">🃏</div>
        <h3>${t('mode.classic.name')}</h3>
        <p>${t('mode.classic.desc')}</p>
        <p class="mode-goal">${t('mode.classic.goal')}</p>
        <div class="row"><span class="label">${t('mode.classic.target')}</span><span class="seg">${seg.map(([v, l]) => `<button class="${ui.ctarget === v ? 'on' : ''}" data-a="ctarget" data-v="${v}">${l}</button>`).join('')}</span></div>
        <div class="row"><button class="btn big green" data-a="classicStart">${t('mode.pick')}</button></div>
      </div>
    </div>
  </div></div>`;
}

function goalScreen(): string {
  const steps = [1, 2, 3, 4].map(i => `<li>${t('goal.step' + i)}</li>`).join('');
  return `<div class="page"><div class="page-inner" style="max-width:720px">
    <div class="page-head"><h2>${t('goal.title')}</h2>${back(ui.goalBack)}</div>
    <div class="panel goal">
      <p class="mode-goal">${t('goal.lead')}</p>
      <ol class="goal-steps">${steps}</ol>
      <p style="color:var(--ink-dim)">${t('goal.best', { n: RULES.bestPerRound })}</p>
      <div class="row" style="justify-content:center"><button class="btn big" data-a="goalOk" data-autofocus>${t('goal.ok')}</button></div>
    </div>
  </div></div>`;
}

function anteTrack(r: RunState): string {
  if (r.ante > 8) return `<div class="label" style="margin-top:4px">${t('hud.endless')} · ${t('hud.ante', { n: r.ante })}</div>`;
  const groups = Array.from({ length: 8 }, (_, a) => {
    const ante = a + 1;
    const pips = [0, 1, 2].map(i => {
      const done = ante < r.ante || (ante === r.ante && i < r.roundIndex);
      const cur = ante === r.ante && i === r.roundIndex;
      return `<i class="${done ? 'done' : cur ? 'cur' : ''} ${i === 2 ? 'boss' : ''}"></i>`;
    }).join('');
    return `<span class="at ${ante === r.ante ? 'cur' : ''}">${pips}</span>`;
  }).join('');
  return `<div class="ante-track" title="${t('hud.progress', { a: r.ante, r: r.roundIndex + 1 })}">${groups}</div><div class="label">${t('hud.progress', { a: r.ante, r: r.roundIndex + 1 })}</div>`;
}

// ---------------------------------------------------------------- klasični Tablić
function startClassic(target: number) {
  cl = newClassic(seedFromNumber(Date.now() ^ Math.floor(Math.random() * 1e9)), target);
  meta.classic.played++;
  ui.chand = null; ui.ctable = []; ui.aiBusy = false;
  save();
  sfx.card();
  go('classic');
}

const cardName = (c: Card) => RANK_LABEL[c.rank] + SUIT_SYMBOL[c.suit];

function moveText(m: NonNullable<ClassicState['lastMove']>): string {
  const who = m.player === 0 ? 'you' : 'ai';
  if (m.kind === 'lay') return t(`classic.${who}Lays`, { card: cardName(m.card) });
  return t(`classic.${who}Captures`, { card: cardName(m.card), cards: m.captured.map(cardName).join(' + '), p: m.points }) + (m.tabla ? ' · ' + t('type.tabla') + '!' : '');
}

function handleClassicEvents(events: ClassicEvent[]) {
  for (const e of events) {
    if (e.type === 'move') {
      if (e.move.kind === 'lay') sfx.lay(); else { sfx.card(); if (e.move.points) sfx.coin(); }
      if (e.move.tabla) { banner(t('fx.tabla')); sfx.tabla(); confetti(); shake(); }
    }
    if (e.type === 'dealt') sfx.card();
    if (e.type === 'dealEnd') sfx.cash();
    if (e.type === 'matchEnd') {
      if (e.winner === 0) { meta.classic.won++; sfx.win(); confetti(); } else if (e.winner === 1) { meta.classic.lost++; sfx.lose(); }
    }
  }
}

async function classicDispatch(a: ClassicAction): Promise<boolean> {
  if (!cl || ui.aiBusy) return false;
  const r = applyClassic(cl, a);
  const err = r.events.find(e => e.type === 'error');
  if (err && err.type === 'error') { sfx.error(); toast('⚠️', t(err.key), true); return false; }
  cl = r.state;
  if (a.type !== 'useBest') { ui.chand = null; ui.ctable = []; }
  handleClassicEvents(r.events);
  save();
  render();
  scheduleAi();
  return true;
}

function scheduleAi() {
  if (!cl || cl.phase !== 'play' || cl.turn !== 1 || ui.aiBusy || ui.screen !== 'classic') return;
  ui.aiBusy = true;
  render();
  setTimeout(() => {
    ui.aiBusy = false;
    if (!cl || ui.screen !== 'classic') return;
    const r = applyClassic(cl, { type: 'ai' });
    cl = r.state;
    handleClassicEvents(r.events);
    save();
    render();
    scheduleAi();
  }, 1100 / meta.settings.speed);
}

function classicScreen(): string {
  if (!cl) return modeScreen();
  const s = cl;
  if (s.phase === 'dealEnd' || s.phase === 'matchEnd') return classicResultScreen(s);
  const myTurn = s.turn === 0 && !ui.aiBusy;
  const hand = s.hands[0].find(c => c.id === ui.chand) ?? null;
  const can = hand ? capturableIds(hand, s.table) : new Set<string>();
  const sel = s.table.filter(c => ui.ctable.includes(c.id));
  const valid = hand && sel.length ? evaluateSelection(hand, sel) : null;
  const pts = valid && hand ? [hand, ...sel].reduce((x, c) => x + classicPoints(c), 0) + (sel.length === s.table.length ? 1 : 0) : 0;
  let hint = '';
  if (!myTurn) hint = t('classic.turnAi');
  else if (!hand) hint = t('classic.hint');
  else if (!sel.length) hint = can.size ? t('hint.pickTable') : t('classic.noCapture');
  else hint = valid ? t('classic.preview', { p: pts }) + (sel.length === s.table.length ? ' · ' + t('type.tabla') + '!' : '') : t('hint.invalid');
  const table = s.table.map(c => cardHTML(c, { cls: [ui.ctable.includes(c.id) ? 'sel' : '', can.has(c.id) && !ui.ctable.includes(c.id) ? 'can' : '', s.lastMove?.kind === 'lay' && s.lastMove.card.id === c.id ? 'enter' : ''].join(' '), attrs: `data-a="cTable" data-id="${c.id}"` })).join('');
  const myHand = s.hands[0].map(c => cardHTML(c, { cls: ui.chand === c.id ? 'sel' : '', attrs: `data-a="cHand" data-id="${c.id}" ${myTurn ? '' : 'disabled'}` })).join('');
  const aiHand = s.hands[1].map(c => cardHTML({ ...c, faceDown: true }, { cls: 'mini', attrs: 'disabled tabindex="-1"' })).join('');
  const target = s.target === 0 ? t('mode.classic.t0') : t('classic.toTarget', { n: s.target });
  const side = (p: 0 | 1) => `<div class="counter ${p === 0 ? 'cap' : 'lay'}"><span class="label">${p === 0 ? t('classic.you') : t('classic.ai')}</span><b>${s.scores[p]}</b><small>${t('classic.captured', { n: s.piles[p].length, t: s.tablas[p], p: s.piles[p].reduce((x, c) => x + classicPoints(c), 0) + s.tablas[p] })}</small></div>`;
  return `<div class="game" id="gameRoot">
    <div class="side left">
      <div class="box score-box">
        <div class="info-line"><span class="round-name">${t('mode.classic.name')}</span><span class="label">${t('classic.deal', { n: s.dealNo })}</span></div>
        <div class="label" style="margin:4px 0 8px">${target}</div>
        <div class="counters">${side(0)}${side(1)}</div>
      </div>
      <div class="box"><div class="info-line"><span class="label">${t('classic.deckLeft')}</span><span>${s.drawPile.length}</span></div>
        <div class="info-line"><span class="label">${t('btn.best')}</span><span>${s.bestLeft}</span></div></div>
    </div>
    <div class="center">
      <div class="opp-row ${s.turn === 1 ? 'active' : ''}"><span class="opp-name">🤖 ${t('classic.ai')}${s.turn === 1 ? ' · ' + t('classic.thinking') : ''}</span><span class="opp-hand">${aiHand}</span></div>
      <div class="hint">${s.lastMove ? moveText(s.lastMove) : '&nbsp;'}</div>
      <div class="felt" id="felt">${table}</div>
      <div class="hint ${valid ? 'warn' : ''}">${hint}</div>
      <div class="hand" id="hand">${myHand}</div>
      <div class="actions">
        <button class="btn blue" data-a="cBest" ${myTurn && s.bestLeft > 0 ? '' : 'disabled'}>${t('btn.bestN', { n: s.bestLeft })}</button>
        <button class="btn" data-a="cCapture" ${myTurn && valid ? '' : 'disabled'}>${t('btn.capture')}</button>
        <button class="btn red" data-a="cLay" ${myTurn && hand ? '' : 'disabled'}>${t('btn.lay')}</button>
      </div>
    </div>
    <div class="side right">
      <div class="box hide-m"><div class="label">${t('menu.rules')}</div><p style="font-size:.85rem;line-height:1.45;color:var(--ink-dim);margin:6px 0 0">${t('classic.rules')}</p></div>
      <div class="box"><button class="btn ghost small" data-a="go" data-to="menu" style="width:100%">${t('hud.menu')}</button></div>
    </div>
  </div>`;
}

function classicResultScreen(s: ClassicState): string {
  const r = s.dealResult!;
  const row = (k: string, a: number | string, b: number | string, cls = '') => `<tr class="${cls}"><td>${t(k)}</td><td>${a}</td><td>${b}</td></tr>`;
  const end = s.phase === 'matchEnd';
  const title = !end ? t('classic.dealEnd') : s.scores[0] === s.scores[1] ? t('classic.draw') : s.scores[0] > s.scores[1] ? t('classic.win') : t('classic.lose');
  return `<div class="overlay-screen"><div class="panel center-col" style="max-width:520px;width:100%">
    <div class="neon-sign" style="font-size:1.5rem">${title}</div>
    <table class="result-table">
      <tr><th></th><th>${t('classic.you')}</th><th>${t('classic.ai')}</th></tr>
      ${row('classic.rowCount', r.cardsCount[0], r.cardsCount[1])}
      ${row('classic.rowCards', r.cardPoints[0], r.cardPoints[1])}
      ${row('classic.rowMost', r.mostCards[0], r.mostCards[1])}
      ${row('classic.rowTablas', r.tablas[0], r.tablas[1])}
      ${row('classic.rowTotal', r.total[0], r.total[1], 'total')}
      ${row('classic.match', s.scores[0], s.scores[1], 'total')}
    </table>
    ${s.target ? `<small style="color:var(--ink-dim)">${t('classic.toTarget', { n: s.target })}</small>` : ''}
    <div class="row" style="justify-content:center">
      ${end ? `<button class="btn big green" data-a="classicStart" data-autofocus>${t('btn.newRun')}</button><button class="btn ghost" data-a="cNew">${t('mode.title')}</button>` : `<button class="btn big" data-a="cNext" data-autofocus>${t('classic.nextDeal')}</button>`}
      <button class="btn ghost" data-a="go" data-to="menu">${t('btn.menu')}</button>
    </div>
  </div></div>`;
}
