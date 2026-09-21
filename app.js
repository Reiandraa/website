import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

const body = document.querySelector('#body');
const arm = document.querySelector('#arm');
const shoulder = document.querySelector('#leftShoulder');
const dot = document.querySelector('#cursorDot');

const handStick = document.querySelector('#handStick');
const bodyStick = document.querySelector('#bodyStick');

const BODY_PIVOT = { x: 165, y: 280 };
const ARM_PIVOT = { x: 342, y: 41 };
const ARM_FINGER = { x: 2.5, y: 21 };
const BODY_SCALE = 0.38;
const ARM_SCALE = 0.38;

const vx = ARM_FINGER.x - ARM_PIVOT.x;
const vy = ARM_FINGER.y - ARM_PIVOT.y;
const baseAngle = Math.atan2(vy, vx);

let mouse = {
    x: innerWidth / 2,
    y: innerHeight / 2
};

addEventListener('pointermove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}, { passive: true });

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const cursorEnabled = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference)");
let cursorFrame;

function render() {
    if (!cursorEnabled.matches) return;
    const angle = Math.atan2(
        mouse.y - innerHeight / 2,
        mouse.x - innerWidth / 2
    );

    const delta = angle - baseAngle;
    const c = Math.cos(delta);
    const s = Math.sin(delta);
    const rotatedX = vx * c - vy * s;
    const rotatedY = vx * s + vy * c;
    const shoulderX = mouse.x - rotatedX * ARM_SCALE;
    const shoulderY = mouse.y - rotatedY * ARM_SCALE;

    const bodyAngle = Math.max(-0.24, Math.min(0.24, delta * 0.12));

    body.style.transform =
        'translate(' + (shoulderX - BODY_PIVOT.x) + 'px, ' +
        (shoulderY - BODY_PIVOT.y) + 'px) rotate(' + bodyAngle +
        'rad) scale(' + BODY_SCALE + ')';

    shoulder.style.left = shoulderX + 'px';
    shoulder.style.top = shoulderY + 'px';
    shoulder.style.transform =
        'translate(-50%, -50%) rotate(' + bodyAngle +
        'rad) scale(' + BODY_SCALE + ')';

    arm.style.transform =
        'translate(' + (shoulderX - ARM_PIVOT.x) + 'px, ' +
        (shoulderY - ARM_PIVOT.y) + 'px) rotate(' + delta +
        'rad) scale(' + ARM_SCALE + ')';

    dot.style.left = mouse.x + 'px';
    dot.style.top = mouse.y + 'px';

    handStick.style.left = mouse.x + 'px';
    handStick.style.top = mouse.y + 'px';
    handStick.style.height = Math.max(0, innerHeight - mouse.y) + 'px';

    const bodyRect = body.getBoundingClientRect();
    const bodyStickX = bodyRect.left + bodyRect.width / 2;
    const bodyStickY = bodyRect.top + bodyRect.height * 0.70;

    bodyStick.style.left = bodyStickX + 'px';
    bodyStick.style.top = bodyStickY + 'px';
    bodyStick.style.height = Math.max(0, innerHeight - bodyStickY) + 'px';

    cursorFrame = requestAnimationFrame(render);
}

render();
cursorEnabled.addEventListener("change", () => {
    cancelAnimationFrame(cursorFrame);
    render();
});

const siteNav = document.querySelector('#siteNav');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.panel, #footer');


const sectionObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const currentSection = entry.target.id;


            navLinks.forEach(link => {
                if (link.dataset.section === currentSection) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
                link.classList.toggle(
                    'active',
                    link.dataset.section === currentSection
                );
            });

            if (currentSection === 'hero') {
                siteNav.classList.remove('nav-scrolled');
            } else {
                siteNav.classList.add('nav-scrolled');
            }

            siteNav.classList.toggle(
                'nav-dark',
                currentSection === 'about' ||
                currentSection === 'contact' ||
                currentSection === 'footer'
            );
        });
    },
    { threshold: 0.6 }
);

sections.forEach(section => {
    sectionObserver.observe(section);
});

const verticalSections = [
    document.querySelector("#hero"),
    document.querySelector("#about"),
    document.querySelector("#projects"),
    document.querySelector("#contact"),
    document.querySelector("#footer")
].filter(Boolean);

let currentSection = 0;
let isSectionAnimating = false;

const projectsViewport = document.querySelector("#projectsViewport");
const projectsTrack = document.querySelector("#projectsTrack");
const projectsSection = document.querySelector("#projects");
const projectTravel = () => {
    const styles = getComputedStyle(projectsViewport);
    const availableWidth = projectsViewport.clientWidth
        - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    return Math.max(0, projectsTrack.scrollWidth - availableWidth);
};

const progressDots = document.querySelectorAll('[data-project-progress] span');
function updateProjectProgress(progress) {
    const active = Math.round(progress * (progressDots.length - 1));
    progressDots.forEach((dot, index) => {
        dot.style.width = index === active ? '2rem' : '0.375rem';
        dot.style.backgroundColor = index === active ? '#D7A64A' : 'rgba(215, 166, 74, 0.3)';
    });
}
updateProjectProgress(0);

// Native horizontal swiping on phones; preserve the pinned desktop animation.
let projectsTrigger = null;
const projectModes = gsap.matchMedia();
projectModes.add('(min-width: 768px)', () => {
    projectsViewport.scrollLeft = 0;
    const animation = gsap.to(projectsTrack, {
        x: () => -projectTravel(),
        ease: 'none',
        scrollTrigger: {
            trigger: projectsSection,
            start: 'top top',
            end: () => `+=${Math.max(1, projectTravel())}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: self => updateProjectProgress(self.progress)
        }
    });
    projectsTrigger = animation.scrollTrigger;
    return () => { projectsTrigger = null; };
});
projectModes.add('(max-width: 767px)', () => {
    const updateMobileProgress = () => {
        const maxScroll = projectsViewport.scrollWidth - projectsViewport.clientWidth;
        updateProjectProgress(maxScroll > 0 ? projectsViewport.scrollLeft / maxScroll : 0);
    };
    updateMobileProgress();
    projectsViewport.addEventListener('scroll', updateMobileProgress, { passive: true });
    window.addEventListener('resize', updateMobileProgress);
    return () => {
        projectsViewport.removeEventListener('scroll', updateMobileProgress);
        window.removeEventListener('resize', updateMobileProgress);
    };
});

// Recalculate travel after fonts settle, as well as on ScrollTrigger's resize refresh.
document.fonts.ready.then(() => ScrollTrigger.refresh());
const projectsSectionIndex = verticalSections.indexOf(
    document.querySelector("#projects")
);

let sectionTween;
reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches && isSectionAnimating) sectionTween?.progress(1);
});

function goToSection(index, fromBelow = false) {
    if (index < 0 || index >= verticalSections.length) {
        return;
    }

    if (isSectionAnimating) {
        return;
    }

    currentSection = index;
    isSectionAnimating = true;

    sectionTween = gsap.to(window, {
        duration: reducedMotion.matches ? 0 : 0.8,
        scrollTo: {
            y: index === projectsSectionIndex && projectsTrigger
                ? (fromBelow ? projectsTrigger.end : projectsTrigger.start)
                : verticalSections[index],
            autoKill: false
        },
        ease: "power2.inOut",
        onComplete: () => {
            isSectionAnimating = false;
        }
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', event => {
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        const targetIndex = verticalSections.indexOf(targetSection);

        if (targetIndex === -1) {
            return;
        }

        event.preventDefault();
        goToSection(targetIndex);
    });
});

document.querySelectorAll(
    '#hero a[href="#projects"], #hero a[href="#contact"]'
).forEach(link => {
    link.addEventListener('click', event => {
        const targetSection = document.querySelector(link.getAttribute('href'));
        const targetIndex = verticalSections.indexOf(targetSection);

        if (targetIndex === -1) {
            return;
        }

        event.preventDefault();
        goToSection(targetIndex);
    });
});

document.querySelectorAll(
    '#footer a[href="#about"], #footer a[href="#projects"], #footer a[href="#contact"]'
).forEach(link => {
    link.addEventListener('click', event => {
        const targetSection = document.querySelector(link.getAttribute('href'));
        const targetIndex = verticalSections.indexOf(targetSection);

        if (targetIndex === -1) {
            return;
        }

        event.preventDefault();
        goToSection(targetIndex);
    });
});


let wheelLocked = false;

window.addEventListener(
    "wheel",
    event => {
        if (matchMedia("(max-width: 767px), (pointer: coarse)").matches) return;
        const scrollY = window.scrollY;
        const inProjects = projectsTrigger && scrollY >= projectsTrigger.start - 1
            && scrollY <= projectsTrigger.end + 1;
        const delta = inProjects && Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX : event.deltaY;

        if (delta === 0) return;

        if (wheelLocked || isSectionAnimating) {
            event.preventDefault();
            return;
        }

        // Consume wheel movement only while there are project cards to explore.
        // Native vertical scroll also drives this animation for touch and keyboard.
        if (inProjects) {
            currentSection = projectsSectionIndex;
            const canExplore = delta > 0
                ? scrollY < projectsTrigger.end - 1
                : scrollY > projectsTrigger.start + 1;

            if (canExplore) {
                event.preventDefault();
                const pixels = delta * (event.deltaMode === 1 ? 16
                    : event.deltaMode === 2 ? window.innerHeight : 1);
                window.scrollTo({
                    top: gsap.utils.clamp(projectsTrigger.start, projectsTrigger.end, scrollY + pixels),
                    behavior: "instant"
                });
                return;
            }
        } else {
            // Keep section navigation in sync after touch, keyboard, or anchor scrolling.
            currentSection = verticalSections.reduce((nearest, section, index) =>
                Math.abs(section.getBoundingClientRect().top)
                    < Math.abs(verticalSections[nearest].getBoundingClientRect().top)
                    ? index : nearest, 0);
        }

        const direction = delta > 0 ? 1 : -1;
        const nextSection = currentSection + direction;
        if (nextSection < 0 || nextSection >= verticalSections.length) return;

        event.preventDefault();
        wheelLocked = true;
        goToSection(nextSection, direction < 0);

        setTimeout(() => {
            wheelLocked = false;
        }, 900);
    },
    { passive: false }
);

// Each light section has an independent, event-driven ornament field.
const ornamentMotion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
document.querySelectorAll('#hero, #about, #projects, #contact, #footer').forEach(section => {
    const ornaments = [...section.querySelectorAll('.hero-ornament')];
    function resetOrnaments() {
        ornaments.forEach(ornament => {
            ornament.style.setProperty('--ox', '0px');
            ornament.style.setProperty('--oy', '0px');
        });
    }
    section.addEventListener('pointermove', event => {
        if (!ornamentMotion.matches || event.pointerType === 'touch') return;
        const bounds = section.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        ornaments.forEach(ornament => {
            const depth = Number(ornament.dataset.depth);
            ornament.style.setProperty('--ox', `${x * depth}px`);
            ornament.style.setProperty('--oy', `${y * depth}px`);
        });
    }, { passive: true });
    section.addEventListener('pointerleave', resetOrnaments);
    ornamentMotion.addEventListener('change', resetOrnaments);
});
