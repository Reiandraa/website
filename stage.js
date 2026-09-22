import { gsap } from 'gsap';

// All interaction/timing tuning lives here. No ScrollTrigger or page layout changes.
const OPEN_DISTANCE = 750;
// Wheel has no gesture-end event: require a brief quiet gap, reset by every momentum event.
const WHEEL_QUIET_MS = 160;
const CLOSE_SECONDS = 0.6;
const OPEN_SECONDS = 0.6;
const ENTERED = 'reiandraaStageEntered';
const TRANSITION = 'reiandraaStageTransition';
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const isHome = url => /^\/(?:index\.html)?$/.test(url.pathname);
const overlay = document.createElement('div');
overlay.className = 'kelir';
overlay.innerHTML = '<svg class="kelir-panel kelir-left" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path/></svg><svg class="kelir-panel kelir-right" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path transform="translate(100 0) scale(-1 1)"/></svg><div class="kelir-hint" hidden>Scroll or swipe to open the stage<button type="button">Enter / skip intro</button></div>';
document.body.append(overlay);
const panels = overlay.querySelectorAll('.kelir-panel');
const hint = overlay.querySelector('.kelir-hint');
let mode = root.dataset.kelir || 'idle';
let progress = 0;
let touchY = null;
let tween;
let inertElements = [];
let navigationTimeout;
let handoffTimer;
let handoffInput;
const holdHero = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
const remember = () => { try { sessionStorage.setItem(ENTERED, 'true'); } catch {} };
function lock(state) {
  mode = state;
  root.dataset.kelir = state;
  inertElements = [...document.body.children].filter(el => el !== overlay && !el.inert);
  inertElements.forEach(el => { el.inert = true; });
}
function render(value) {
  // The rail follows the base travel; lower fabric leads by a small amount.
  // Monotone control points keep the edge draped, never bowed back inward.
  // The offset vanishes at both endpoints, so reversing progress closes cleanly.
  const drape = 18 * 4 * value * (1 - value);
  const upper = 100 - drape * 0.30;
  const middle = 100 - drape * 0.58;
  const lower = 100 - drape;
  const shape = `M0 0 H100 C100 16 ${upper} 33 ${middle} 52 C${100-drape*.78} 70 ${100-drape*.94} 88 ${lower} 100 H0 Z`;
  panels.forEach(panel => panel.querySelector("path").setAttribute("d", shape));
  gsap.set(panels[0], { xPercent: -100 * value });
  gsap.set(panels[1], { xPercent: 100 * value });
}
function release() {
  tween?.kill();
  clearTimeout(navigationTimeout);
  clearTimeout(handoffTimer);
  mode = 'idle';
  hint.hidden = true;
  render(1);
  delete root.dataset.kelir;
  root.classList.remove('kelir-boot');
  inertElements.forEach(el => { el.inert = false; });
  inertElements = [];
}
function finishIntro(input) {
  remember();
  const focused = overlay.contains(document.activeElement);
  holdHero();
  release();
  if (['wheel', 'touch', 'keyboard'].includes(input)) {
    mode = 'handoff';
    handoffInput = input;
    root.dataset.kelir = 'handoff';
    if (input === 'wheel') armWheelEnd();
  }
  if (focused) document.querySelector('a[href]')?.focus({ preventScroll: true });
}
function armWheelEnd() {
  clearTimeout(handoffTimer);
  handoffTimer = setTimeout(() => { if (mode === "handoff") { holdHero(); release(); } }, WHEEL_QUIET_MS);
}
function scrub(delta, input) {
  progress = Math.max(0, Math.min(1, progress + delta / OPEN_DISTANCE));
  render(progress);
  hint.style.opacity = String(Math.max(0, 1 - progress * 4));
  if (progress === 1) finishIntro(input);
}
function swallow(event) { event.preventDefault(); event.stopImmediatePropagation(); }
window.addEventListener('wheel', event => {
  if (mode === 'idle' || event.ctrlKey) return;
  swallow(event);
  if (mode === 'intro') scrub(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1), 'wheel');
  if (mode === 'handoff') armWheelEnd();
}, { capture: true, passive: false });
window.addEventListener('touchstart', event => {
  if (mode !== 'idle' && event.touches.length === 1) touchY = event.touches[0].clientY;
}, { capture: true, passive: true });
window.addEventListener('touchmove', event => {
  if (mode === 'idle' || event.touches.length !== 1) return;
  swallow(event);
  const next = event.touches[0].clientY;
  if (mode === 'intro' && touchY !== null) scrub(touchY - next, 'touch');
  touchY = next;
}, { capture: true, passive: false });
function endTouch(event) {
  if (event.touches?.length) return;
  touchY = null;
  if (mode === 'handoff' && handoffInput === 'touch') { holdHero(); release(); }
}
window.addEventListener('touchend', endTouch, { passive: true });
window.addEventListener('touchcancel', endTouch, { passive: true });
window.addEventListener('scroll', () => { if (mode === 'intro' || mode === 'handoff') holdHero(); }, { passive: true });
window.addEventListener('keyup', () => {
  if (mode === 'handoff' && handoffInput === 'keyboard') { holdHero(); release(); }
});
window.addEventListener('keydown', event => {
  if (mode === 'idle' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (mode === 'intro' && ['Tab', 'Enter', 'Escape', 'End'].includes(event.key)) {
    if (event.key !== 'Tab') swallow(event);
    finishIntro();
  } else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home'].includes(event.key)) {
    swallow(event);
    if (mode === 'intro') scrub(event.key === 'Home' ? -OPEN_DISTANCE : ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -120 : 120, 'keyboard');
  }
}, { capture: true });
hint.querySelector('button').addEventListener('click', finishIntro);

function animate(open, done) {
  const state = { value: open ? 0 : 1 };
  tween = gsap.to(state, { value: open ? 1 : 0, duration: reduced.matches ? 0 : open ? OPEN_SECONDS : CLOSE_SECONDS, ease: 'power2.inOut', onUpdate: () => render(state.value), onComplete: done });
}
async function destinationReady() {
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  // CSS and DOM are ready before the module executes; await images/fonts, bounded for unavailable external assets.
  await Promise.race([Promise.all([loaded, document.fonts.ready]), new Promise(resolve => setTimeout(resolve, 3000))]);
  if (mode === 'arrival') animate(true, release);
}
clearTimeout(window.kelirBootTimeout);
if (mode !== 'idle') {
  lock(mode);
  render(0);
  root.classList.remove('kelir-boot');
  if (mode === 'intro') { holdHero(); hint.hidden = false; }
  else { remember(); destinationReady(); }
} else render(1);

// Only crossings of the homepage boundary get a curtain. Anchor links remain untouched.
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const to = new URL(link.href, location.href);
  const from = new URL(location.href);
  if (to.origin !== from.origin || isHome(to) === isHome(from)) return;
  if (mode === 'handoff') release();
  if (mode !== 'idle') { swallow(event); return; }
  remember();
  if (reduced.matches) return;
  // If storage is unavailable, use ordinary navigation rather than risk an uncovered swap.
  try { sessionStorage.setItem(TRANSITION, JSON.stringify({ to: to.href, at: Date.now() })); } catch { return; }
  swallow(event);
  lock('closing');
  render(1);
  animate(false, () => {
    location.assign(to.href);
    // Recover if a browser/extension cancels navigation.
    navigationTimeout = setTimeout(() => { try { sessionStorage.removeItem(TRANSITION); } catch {} release(); }, 8000);
  });
}, { capture: true });
window.addEventListener('pageshow', event => { if (event.persisted) release(); });
reduced.addEventListener('change', () => { if (reduced.matches && (mode === 'intro' || mode === 'handoff')) finishIntro(); });
