// Runs before first paint; the module takes over once the document is ready.
(() => {
  const root = document.documentElement;
  const home = /^\/(?:index\.html)?$/.test(location.pathname);
  const path = value => new URL(value, location.href).pathname.replace(/\/$/, '') || '/';
  let entered = false, arrival = false;
  try {
    entered = sessionStorage.getItem('reiandraaStageEntered') === 'true';
    const pending = JSON.parse(sessionStorage.getItem('reiandraaStageTransition') || 'null');
    arrival = pending && Date.now() - pending.at < 15000 && path(pending.to) === path(location.href);
    sessionStorage.removeItem('reiandraaStageTransition');
  } catch { /* Storage restrictions must never prevent access. */ }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    try { if (home) sessionStorage.setItem('reiandraaStageEntered', 'true'); } catch {}
    return;
  }
  if (arrival || (home && !entered)) {
    root.dataset.kelir = arrival ? 'arrival' : 'intro';
    root.classList.add('kelir-boot');
    // Fail open if the module cannot load (offline, script error, etc.).
    window.kelirBootTimeout = setTimeout(() => {
      delete root.dataset.kelir;
      root.classList.remove('kelir-boot');
    }, 8000);
  }
})();
