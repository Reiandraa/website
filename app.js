import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import EmblaCarousel from "embla-carousel";

gsap.registerPlugin(ScrollToPlugin);

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

function render() {
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

    requestAnimationFrame(render);
}

render();

const siteNav = document.querySelector('#siteNav');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.panel, #footer');
let projectsScrollMode = false;

const sectionObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const currentSection = entry.target.id;
            projectsScrollMode = currentSection === 'projects';

            navLinks.forEach(link => {
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
let emblaApi = null;
let projectCarouselMoving = false;
const projectsSectionIndex = verticalSections.indexOf(
    document.querySelector("#projects")
);

function goToSection(index) {
    if (index < 0 || index >= verticalSections.length) {
        return;
    }

    if (isSectionAnimating) {
        return;
    }

    currentSection = index;
    isSectionAnimating = true;

    gsap.to(window, {
        duration: 0.8,
        scrollTo: {
            y: verticalSections[index],
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

if (projectsViewport) {
    emblaApi = EmblaCarousel(
        projectsViewport,
        {
            align: "end",
            containScroll: "trimSnaps",
            dragFree: false,
            loop: false,
            skipSnaps: false,
            slidesToScroll: 1
        }
    );

    emblaApi.on("settle", () => {
        projectCarouselMoving = false;
    });
}

let wheelLocked = false;

window.addEventListener(
    "wheel",
    event => {
        if (event.deltaY === 0) {
            return;
        }

        const direction = event.deltaY > 0 ? 1 : -1;
        let nextSection = currentSection + direction;

        const projectsIsActive =
            projectsScrollMode ||
            currentSection === projectsSectionIndex;

        if (projectsIsActive && emblaApi) {
            if (projectCarouselMoving) {
                event.preventDefault();
                return;
            }

            const scrollingDown = event.deltaY > 0;
            const canMove = scrollingDown
                ? emblaApi.canScrollNext()
                : emblaApi.canScrollPrev();

            if (canMove) {
                event.preventDefault();
                projectCarouselMoving = true;

                if (scrollingDown) {
                    emblaApi.scrollNext();
                } else {
                    emblaApi.scrollPrev();
                }

                return;
            }

            projectsScrollMode = false;
            nextSection = projectsSectionIndex + direction;
        }

        if (wheelLocked) {
            event.preventDefault();
            return;
        }

        if (nextSection < 0 || nextSection >= verticalSections.length) {
            return;
        }

        event.preventDefault();
        wheelLocked = true;
        goToSection(nextSection);

        setTimeout(() => {
            wheelLocked = false;
        }, 900);
    },
    { passive: false }
);
