// Tooltip: hover (miš), dugo držanje (dodir) i fokus (tastatura/gamepad).
let tip: HTMLDivElement;
let pressTimer: number | null = null;
let suppressClick = false;

export function initTooltip(root: HTMLElement) {
  tip = document.createElement('div');
  tip.id = 'tooltip';
  document.body.appendChild(tip);
  root.addEventListener('pointerover', e => {
    if ((e as PointerEvent).pointerType !== 'mouse') return;
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (el) show(el); else hide();
  });
  root.addEventListener('pointerout', e => {
    const to = (e as PointerEvent).relatedTarget as HTMLElement | null;
    if (!to || !to.closest('[data-tip]')) hide();
  });
  root.addEventListener('focusin', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (el && el.matches(':focus-visible')) show(el); else hide();
  });
  root.addEventListener('focusout', hide);
  root.addEventListener('pointerdown', e => {
    if ((e as PointerEvent).pointerType === 'mouse') return;
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (!el) return;
    pressTimer = window.setTimeout(() => { show(el); suppressClick = true; }, 450);
  });
  const cancel = () => { if (pressTimer) clearTimeout(pressTimer); pressTimer = null; };
  root.addEventListener('pointerup', () => { cancel(); if (suppressClick) setTimeout(hide, 1600); });
  root.addEventListener('pointercancel', cancel);
  root.addEventListener('pointermove', e => { if ((e as PointerEvent).pointerType !== 'mouse') cancel(); });
  root.addEventListener('contextmenu', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (el) { e.preventDefault(); show(el); }
  });
}

/** Dugo držanje ne smije okinuti klik. */
export function consumeLongPress(): boolean {
  if (suppressClick) { suppressClick = false; return true; }
  return false;
}

function show(el: HTMLElement) {
  const html = el.dataset.tip;
  if (!html) return hide();
  tip.innerHTML = html;
  tip.style.display = 'block';
  const r = el.getBoundingClientRect();
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = r.left + r.width / 2 - tw / 2;
  let y = r.top - th - 10;
  if (y < 8) y = r.bottom + 10;
  x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
  y = Math.max(8, Math.min(window.innerHeight - th - 8, y));
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}

export function hide() { if (tip) tip.style.display = 'none'; }
