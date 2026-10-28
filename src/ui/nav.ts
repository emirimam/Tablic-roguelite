// Prostorna navigacija (strelice/D-pad) i Gamepad API mapiranje na isti sistem.
type Dir = 'up' | 'down' | 'left' | 'right';

const FOCUSABLE = 'button:not(:disabled), input, [tabindex="0"]';

function visible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
}

export function moveFocus(dir: Dir, scope: ParentNode = document) {
  const all = [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(visible);
  if (!all.length) return;
  const cur = document.activeElement as HTMLElement | null;
  if (!cur || !all.includes(cur)) { all[0]!.focus(); return; }
  const a = cur.getBoundingClientRect();
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best: HTMLElement | null = null, bestScore = Infinity;
  for (const el of all) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    const bx = b.left + b.width / 2, by = b.top + b.height / 2;
    const dx = bx - ax, dy = by - ay;
    let main: number, cross: number;
    if (dir === 'left') { if (dx >= -4) continue; main = -dx; cross = Math.abs(dy); }
    else if (dir === 'right') { if (dx <= 4) continue; main = dx; cross = Math.abs(dy); }
    else if (dir === 'up') { if (dy >= -4) continue; main = -dy; cross = Math.abs(dx); }
    else { if (dy <= 4) continue; main = dy; cross = Math.abs(dx); }
    const score = main + cross * 2.2;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) { best.focus(); best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}

export interface NavHandlers {
  onKey(key: string): boolean; // vrati true ako je obrađeno
}

export function initNav(h: NavHandlers) {
  window.addEventListener('keydown', e => {
    if ((e.target as HTMLElement).tagName === 'INPUT' && !['Escape', 'Enter'].includes(e.key)) return;
    const map: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const d = map[e.key];
    if (d) { e.preventDefault(); moveFocus(d); return; }
    if (h.onKey(e.key)) e.preventDefault();
  });
  // Gamepad: A=Enter, B=Escape, X=capture, Y=lay, LB/RB=ruka/sto, Start=meni
  const prev: boolean[] = [];
  let axisCool = 0;
  const poll = () => {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const press = (i: number, fn: () => void) => {
        const v = !!p.buttons[i]?.pressed;
        if (v && !prev[i]) fn();
        prev[i] = v;
      };
      press(0, () => (document.activeElement as HTMLElement | null)?.click());
      press(1, () => h.onKey('Escape'));
      press(2, () => h.onKey('c'));
      press(3, () => h.onKey('v'));
      press(4, () => h.onKey('[hand]'));
      press(5, () => h.onKey('[table]'));
      press(9, () => h.onKey('Escape'));
      press(12, () => moveFocus('up')); press(13, () => moveFocus('down'));
      press(14, () => moveFocus('left')); press(15, () => moveFocus('right'));
      const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0;
      if (axisCool <= 0) {
        if (Math.abs(ax) > 0.6 || Math.abs(ay) > 0.6) {
          moveFocus(Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'right' : 'left') : (ay > 0 ? 'down' : 'up'));
          axisCool = 12;
        }
      } else axisCool--;
      break;
    }
    requestAnimationFrame(poll);
  };
  window.addEventListener('gamepadconnected', () => requestAnimationFrame(poll), { once: true });
}
