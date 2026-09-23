import { gsap } from 'gsap';

// Reveal only existing secondary ornaments; parent transforms remain available
// for their established pointer interaction. Nothing is hidden before JS runs.
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const profiles = { about: { y: 5, duration: 0.65 }, projects: { y: 10, duration: 0.8 }, contact: { y: 3, duration: 0.55 } };
let cleanup = () => {};
function setup() {
  cleanup();
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const active = new Map();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const artwork = entry.target.querySelector('svg');
      const profile = profiles[entry.target.closest('section').id];
      const tween = gsap.fromTo(artwork, { opacity: 0.25, y: profile.y }, {
        opacity: 1, y: 0, duration: profile.duration, ease: 'power2.out',
        clearProps: 'opacity,transform',
        onComplete: () => active.delete(artwork)
      });
      active.set(artwork, tween);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('#about .extra-ornaments .hero-ornament, #projects .extra-ornaments .hero-ornament, #contact .extra-ornaments .hero-ornament').forEach(el => observer.observe(el));
  cleanup = () => {
    observer.disconnect();
    active.forEach((tween, artwork) => {
      tween.kill();
      gsap.set(artwork, { clearProps: 'opacity,transform' });
    });
    active.clear();
  };
}
setup();
motion.addEventListener('change', setup);
