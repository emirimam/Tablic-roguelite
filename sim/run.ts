// Headless simulator za balans: node sim/run.ts --runs 1000 --bot greedy|smart --deck deck_classic --stake 0 --seed S
import { apply, newRun, previewCapture, type Action } from '../src/core/run.ts';
import { computeRules } from '../src/core/rules.ts';
import { findCaptures, canCaptureAny } from '../src/core/capture.ts';
import { REG, ANTES } from '../src/core/data.ts';
import type { RunState } from '../src/core/types.ts';

declare const process: { argv: string[] };
const args: Record<string, string> = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s: string) => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ') || 'true']; }));
const RUNS = Number(args.runs ?? 500);
const BOT = (args.bot ?? 'smart') as 'greedy' | 'smart';
const DECK = args.deck ?? 'deck_classic';
const STAKE = Number(args.stake ?? 0);
const SEED = args.seed ?? 'SIM';
// --scale 0.7  ili  --scale 0.9,0.8,0.7,...  (eksperiment: množi ciljeve po kafani u memoriji)
if (args.scale) {
  const f = String(args.scale).split(',').map(Number);
  ANTES.targets.forEach((row, i) => row.forEach((v, j) => { row[j] = Math.round(v * (f[i] ?? f[f.length - 1]!)); }));
  console.log('ciljevi:', ANTES.targets.map(r => r.join('/')).join('  '));
}

function bestCapture(run: RunState): { a: Action; s: number } | null {
  const r = run.round!;
  const rules = computeRules(run);
  let best: { a: Action; s: number } | null = null;
  for (const h of r.hand) for (const o of findCaptures(h, r.table.filter(c => !c.faceDown), rules.aceAny)) {
    const p = previewCapture(run, h.id, o.tableIds);
    if (p && (!best || p.total > best.s)) best = { a: { type: 'capture', handId: h.id, tableIds: o.tableIds }, s: p.total };
  }
  return best;
}

/** smart: ako je najbolje nošenje slabo (Par), probaj spuštanje koje sljedeći potez pretvara u Zbir/Duplu. */
function roundAction(run: RunState): Action {
  const r = run.round!;
  const best = bestCapture(run);
  if (BOT === 'smart' && r.laysLeft > 0 && r.table.length < 9 && (!best || best.s < 60)) {
    let bestLay: { a: Action; s: number } | null = null;
    for (const lay of r.hand) {
      const sim = apply(run, { type: 'lay', handId: lay.id }).state;
      if (sim.phase !== 'round') continue;
      const nb = bestCapture(sim);
      if (nb && (!bestLay || nb.s > bestLay.s)) bestLay = { a: { type: 'lay', handId: lay.id }, s: nb.s };
    }
    if (bestLay && bestLay.s > (best?.s ?? 0) * 1.6) return bestLay.a;
  }
  if (best) return best.a;
  const low = [...r.hand].sort((a, b) => a.rank - b.rank)[0]!;
  return { type: 'lay', handId: low.id };
}

function shopAction(run: RunState): Action {
  const s = run.shop!;
  const rules = computeRules(run);
  // gosti: kupi najjeftinijeg dostupnog ako ima mjesta; rakije za tipove koje najčešće pravimo
  const order = s.items.map((it, i) => ({ it, i })).filter(x => !x.it.sold && x.it.price <= run.money);
  const reg = order.filter(x => x.it.kind === 'regular' && run.regulars.length < rules.regularSlots).sort((a, b) => (REG[b.it.id]!.rarity > REG[a.it.id]!.rarity ? 1 : -1))[0];
  if (reg) return { type: 'buy', index: reg.i };
  const brandy = order.find(x => x.it.kind === 'brandy' && run.consumables.length < rules.consumableSlots && BOT === 'smart');
  if (brandy) return { type: 'buy', index: brandy.i };
  if (BOT === 'smart' && run.anteVoucher && !run.anteVoucherBought && run.money >= 15) return { type: 'buyVoucher' };
  return { type: 'leaveShop' };
}

interface Result { ante: number; round: number; won: boolean; best: number; regs: string[]; boss?: string }
function playOne(seed: string): Result {
  let run = newRun({ seed, seeded: true, deckId: DECK, stakeLevel: STAKE });
  for (let i = 0; i < 5000; i++) {
    let a: Action;
    switch (run.phase) {
      case 'map': a = { type: 'startRound' }; break;
      case 'round': a = roundAction(run); break;
      case 'cashout': a = { type: 'collect' }; break;
      case 'shop': {
        // rakije odmah pij
        const bi = run.consumables.findIndex(c => ['slivovitz', 'loza', 'pear', 'quince', 'herbal'].includes(c));
        if (bi >= 0) { run = apply(run, { type: 'useConsumable', index: bi }).state; continue; }
        a = shopAction(run); break;
      }
      case 'pack': a = { type: 'packSkip' }; break;
      default: return { ante: run.ante, round: run.roundIndex, won: run.phase === 'won', best: run.stats.bestCapture, regs: run.regulars.map(r => r.id), boss: run.bossForAnte };
    }
    const res = apply(run, a);
    if (res.events.some(e => e.type === 'error')) {
      const ek = (res.events.find(e => e.type === 'error') as { key: string }).key + ':' + run.phase + ':' + a.type;
      ERR[ek] = (ERR[ek] ?? 0) + 1;
      if (run.phase === 'shop') { run = apply(run, { type: 'leaveShop' }).state; continue; }
      if (run.phase === 'round') { const low = run.round!.hand[0]!; run = apply(run, { type: 'lay', handId: low.id }).state; continue; }
      break;
    }
    run = res.state;
  }
  return { ante: run.ante, round: run.roundIndex, won: run.phase === 'won', best: run.stats.bestCapture, regs: run.regulars.map(r => r.id) };
}

const ERR: Record<string, number> = {};
const t0 = performance.now();
const results: Result[] = [];
for (let i = 0; i < RUNS; i++) results.push(playOne(`${SEED}${i}`));
const passAnte = (n: number) => results.filter(r => r.won || r.ante > n).length / RUNS;
const passFirst = results.filter(r => r.won || r.ante > 1 || r.round > 0).length / RUNS;
console.log(`TABLA sim · bot=${BOT} · deck=${DECK} · stake=${STAKE} · ${RUNS} partija · ${((performance.now() - t0) / 1000).toFixed(1)} s`);
console.log(`Kafana 1, runda 1 (300): ${(passFirst * 100).toFixed(1)}%`);
for (let a = 1; a <= 8; a++) console.log(`Prošao kafanu ${a}: ${(passAnte(a) * 100).toFixed(1)}%`);
console.log(`Pobjeda: ${(results.filter(r => r.won).length / RUNS * 100).toFixed(1)}% · prosječno najbolje nošenje: ${Math.round(results.reduce((s, r) => s + r.best, 0) / RUNS)}`);
void canCaptureAny;
const lost1 = results.filter(r => !r.won && r.ante === 1);
const by: Record<string, number> = {};
for (const r of lost1) { const k = r.round === 2 ? 'boss:' + r.boss : 'runda ' + (r.round + 1); by[k] = (by[k] ?? 0) + 1; }
console.log('Porazi u kafani 1:', JSON.stringify(by));
console.log('Greške bota:', JSON.stringify(ERR));
