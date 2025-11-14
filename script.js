// script.js - full functionality: nav toggle (right->left), overlay, accessible focus-trap,
// subscribe form (validation + localStorage demo), toast system, footer year update

/* ===== Config ===== */
const NAV_ID = 'mainNav';
const TOGGLE_ID = 'navToggle';
const SUB_FORM_ID = 'subscribeForm';
const SUB_MSG_ID = 'subscribeMsg';
const CLEAR_BTN_ID = 'clearBtn';
const TOAST_DURATION = 3500;
const MOBILE_BREAKPOINT = 768;

/* ===== Utilities ===== */
const $ = id => document.getElementById(id);
const qsa = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));
const debounce = (fn, t = 100) => {
    let h;
    return (...a) => {
        clearTimeout(h);
        h = setTimeout(() => fn(...a), t);
    };
};
const isVisible = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));

/* ===== Toast system ===== */
const toastContainerId = 'site-toasts';

function ensureToastContainer() {
    let c = $(toastContainerId);
    if (!c) {
        c = document.createElement('div');
        c.id = toastContainerId;
        Object.assign(c.style, { position: 'fixed', right: '16px', bottom: '16px', zIndex: 1400, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', pointerEvents: 'none' });
        document.body.appendChild(c);
    }
    return c;
}

function showToast(msg, opts = {}) {
    const container = ensureToastContainer();
    const el = document.createElement('div');
    el.className = 'site-toast';
    el.textContent = msg;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    Object.assign(el.style, { pointerEvents: 'auto', maxWidth: '320px' });
    container.appendChild(el);
    const duration = ('duration' in opts) ? opts.duration : TOAST_DURATION;
    setTimeout(() => {
        el.style.transition = 'opacity .25s, transform .25s';
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

/* ===== Create overlay element (for closing nav) ===== */
let overlay = null;

function ensureOverlay() {
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        overlay.tabIndex = -1; // allow focus if needed
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => closeNav());
    }
    return overlay;
}

/* ===== NAV (right->left) behavior ===== */
function initNav() {
    const toggle = $(TOGGLE_ID),
        nav = $(NAV_ID);
    if (!toggle || !nav) return;

    // ARIA initial
    toggle.setAttribute('aria-controls', NAV_ID);
    toggle.setAttribute('aria-expanded', 'false');
    nav.setAttribute('aria-hidden', 'true');

    function getFocusableNav() {
        return qsa('a, button, input, [tabindex]:not([tabindex="-1"])', nav).filter(el => !el.hasAttribute('disabled') && isVisible(el));
    }

    let lastFocused = null;

    window.openNav = function() {
        if (nav.classList.contains('open')) return;
        nav.classList.add('open');
        document.documentElement.classList.add('nav-open');
        document.body.classList.add('nav-open');
        toggle.setAttribute('aria-expanded', 'true');
        nav.setAttribute('aria-hidden', 'false');
        lastFocused = document.activeElement;
        const focusables = getFocusableNav();
        if (focusables.length) focusables[0].focus();
        ensureOverlay().classList.add('visible');
        document.addEventListener('keydown', onKeydown, true);
        document.addEventListener('click', onDocClick, true);
    };

    window.closeNav = function() {
        if (!nav.classList.contains('open')) return;
        nav.classList.remove('open');
        document.documentElement.classList.remove('nav-open');
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        nav.setAttribute('aria-hidden', 'true');
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        const ov = overlay;
        if (ov) ov.classList.remove('visible');
        document.removeEventListener('keydown', onKeydown, true);
        document.removeEventListener('click', onDocClick, true);
    };

    function toggleNav() {
        if (nav.classList.contains('open')) closeNav();
        else openNav();
    }

    function onDocClick(e) {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
    }

    function onKeydown(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            e.preventDefault();
            closeNav();
            return;
        }
        if (e.key === 'Tab' && nav.classList.contains('open')) {
            const f = getFocusableNav();
            if (f.length === 0) {
                e.preventDefault();
                nav.focus();
                return;
            }
            const first = f[0],
                last = f[f.length - 1],
                active = document.activeElement;
            if (e.shiftKey) {
                if (active === first || active === nav) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    toggle.addEventListener('click', ev => {
        ev.stopPropagation();
        toggleNav();
    });
    toggle.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            toggle.click();
        }
    });

    // close on nav link click (unless data-no-close)
    nav.addEventListener('click', ev => {
        const t = ev.target.closest('a, button');
        if (!t) return;
        if (nav.classList.contains('open') && !t.hasAttribute('data-no-close')) setTimeout(() => closeNav(), 120);
    });

    // close on resize to desktop
    window.addEventListener('resize', debounce(() => { if (window.innerWidth >= MOBILE_BREAKPOINT && nav.classList.contains('open')) closeNav(); }, 120));
}

/* ===== Subscribe form handling ===== */
function initSubscribe() {
    const form = $(SUB_FORM_ID),
        msg = $(SUB_MSG_ID),
        clearBtn = $(CLEAR_BTN_ID);
    if (!form || !msg) return;

    function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const name = (form.name && form.name.value || '').trim();
        const email = (form.email && form.email.value || '').trim();
        if (!name || !email) {
            msg.textContent = 'कृपया नाम और ईमेल भरें।';
            msg.style.color = 'crimson';
            return;
        }
        if (!validEmail(email)) {
            msg.textContent = 'कृपया मान्य ईमेल डालें।';
            msg.style.color = 'crimson';
            return;
        }
        // demo: save to localStorage
        try {
            const key = 'learnmanch_subscribers_v1';
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            arr.push({ name, email, when: new Date().toISOString() });
            localStorage.setItem(key, JSON.stringify(arr));
        } catch (e) {}
        msg.textContent = `धन्यवाद ${name}! आपने सफलतापूर्वक subscribe कर लिया।`;
        msg.style.color = 'lightgreen';
        showToast(`Subscribed: ${name} (${email})`);
        form.reset();
    });

    clearBtn && clearBtn.addEventListener('click', () => {
        form.reset();
        msg.textContent = '';
    });
    // email hint
    const emailInput = form.email;
    if (emailInput) {
        emailInput.addEventListener('input', debounce(() => {
            const v = emailInput.value.trim();
            if (!v) { msg.textContent = ''; return; }
            if (validEmail(v)) {
                msg.textContent = 'ईमेल सही लग रहा है।';
                msg.style.color = 'lightgreen';
            } else {
                msg.textContent = 'ईमेल का फ़ॉर्मेट सही नहीं है।';
                msg.style.color = 'crimson';
            }
        }, 420));
    }
}

/* ===== Small helpers: data-toast & smooth scroll ===== */
function initHelpers() {
    // data-toast on elements
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn[data-toast]');
        if (!btn) return;
        const txt = btn.getAttribute('data-toast') || btn.textContent.trim();
        showToast(txt);
    });
    // smooth anchor scroll
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (href === '#') { e.preventDefault(); return; }
        const t = document.querySelector(href);
        if (t) {
            e.preventDefault();
            t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

/* ===== Footer year update ===== */
function updateFooterYear() {
    try {
        const p = document.querySelector('.site-footer .container p');
        if (!p) return;
        const year = new Date().getFullYear();
        const txt = p.textContent.trim();
        const rep = txt.replace(/\d{4}/, year);
        p.textContent = rep.includes(String(year)) ? rep : `${txt} © ${year}`;
    } catch (e) {}
}

/* ===== Focus-visible polyfill ===== */
function initFocusVisible() {
    let hadKeyboard = false;
    document.addEventListener('keydown', (e) => { if (e.key === 'Tab') hadKeyboard = true; }, true);
    document.addEventListener('mousedown', () => hadKeyboard = false, true);
    document.addEventListener('touchstart', () => hadKeyboard = false, true);
    document.addEventListener('focusin', (e) => { if (hadKeyboard) e.target.classList.add('keyboard-focused'); });
    document.addEventListener('focusout', (e) => { e.target.classList.remove('keyboard-focused'); });
}

/* ===== Init all on DOM ready ===== */
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initSubscribe();
    initHelpers();
    updateFooterYear();
    initFocusVisible();
    // create overlay element now (but hidden)
    ensureOverlay();
});


// Select all join buttons
const joinButtons = document.querySelectorAll(".join-btn");

// Create popup dynamically
const popup = document.createElement("div");
popup.classList.add("popup");
popup.innerHTML = `
  <div class="popup-content">
    <h3>Join Course</h3>
    <p>Enter your details to enroll in this course.</p>
    <input type="text" id="userName" placeholder="Enter your name" />
    <input type="email" id="userEmail" placeholder="Enter your email" />
    <button id="submitJoin">Enroll Now</button>
    <button id="closePopup">Cancel</button>
  </div>
`;
document.body.appendChild(popup);

// Show popup when "Join Now" is clicked
joinButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        popup.classList.add("show");
    });
});

// Handle popup buttons
popup.addEventListener("click", (e) => {
    if (e.target.id === "closePopup") {
        popup.classList.remove("show");
    } else if (e.target.id === "submitJoin") {
        const name = document.getElementById("userName").value.trim();
        const email = document.getElementById("userEmail").value.trim();

        if (name && email) {
            alert(`🎉 Thank you ${name}! You’ve successfully joined the course.`);
            popup.classList.remove("show");
            document.getElementById("userName").value = "";
            document.getElementById("userEmail").value = "";
        } else {
            alert("⚠️ Please fill all fields before submitting.");
        }
    }
});