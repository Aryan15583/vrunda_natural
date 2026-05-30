/* ============================================================
   VRUNDA NATURAL — vrunda.js
   Shared site-wide JS: transitions, dark mode, nav, header
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. DARK MODE ────────────────────────────────────────────── */
  var darkBtn = document.getElementById('darkToggle');

  // Single source of truth — apply dark class + update button icon
  function setTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    if (darkBtn) darkBtn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('vn-dark', isDark ? '1' : '0');
  }

  // On page load — use saved choice, else fall back to OS
  var saved = localStorage.getItem('vn-dark');
  if (saved === '1')      { setTheme(true);  }
  else if (saved === '0') { setTheme(false); }
  else {
    setTheme(!!(window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches));
  }

  // Button click — toggle and save
  if (darkBtn) {
    darkBtn.addEventListener('click', function () {
      setTheme(!document.body.classList.contains('dark'));
    });
  }

  // Browser/OS theme changes — follow it and save it
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function (e) {
        setTheme(e.matches);
      });
  }

  // Sync across all open tabs
  window.addEventListener('storage', function (e) {
    if (e.key === 'vn-dark') {
      var isDark = e.newValue === '1';
      document.body.classList.toggle('dark', isDark);
      if (darkBtn) darkBtn.textContent = isDark ? '☀️' : '🌙';
    }
  });

  /* ── 2. PAGE TRANSITION — smooth fade in/out ─────────────── */
  var overlay = document.createElement('div');
  overlay.id = 'page-transition';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:99999',
    'background:var(--green)',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.38s cubic-bezier(.4,0,.2,1)',
  ].join(';');
  document.body.appendChild(overlay);

  window.addEventListener('DOMContentLoaded', function () {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'none';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.style.opacity = '0';
      });
    });
  });

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href]');
    if (!anchor) return;
    var href = anchor.getAttribute('href');
    if (!href) return;
    var isExternal = anchor.hostname && anchor.hostname !== location.hostname;
    var isHash     = href.charAt(0) === '#';
    var isSpecial  = /^(mailto:|tel:|javascript:)/.test(href);
    var isBlank    = anchor.target === '_blank';
    var isSamePage = href.indexOf('#') !== -1 &&
                     (href.charAt(0) === '#' ||
                      anchor.pathname === location.pathname);
    if (isExternal || isHash || isSpecial || isBlank || isSamePage) return;
    e.preventDefault();
    var dest = anchor.href;
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    setTimeout(function () { window.location.href = dest; }, 360);
  });

  /* ── 3. LOADER ───────────────────────────────────────────── */
  window.addEventListener('load', function () {
    var loader = document.getElementById('loader');
    if (loader) {
      setTimeout(function () { loader.classList.add('hidden'); }, 700);
    }
  });

  /* ── 4. STICKY HEADER ────────────────────────────────────── */
  var header = document.getElementById('mainHeader');
  if (header) {
    var hasHeroSlider = !!document.querySelector('.slider');
    function updateHeader() {
      if (hasHeroSlider) {
        header.classList.toggle('scrolled', window.scrollY > 60);
      } else {
        header.classList.add('scrolled');
      }
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* ── 5. HAMBURGER / MOBILE NAV ───────────────────────────── */
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
    });
  }
  window.closeMobileNav = function () {
    if (!mobileNav || !hamburger) return;
    mobileNav.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
  };

  /* ── 6. ACTIVE NAV LINK — highlight current page ─────────── */
  var currentPath = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a, .mobile-nav a').forEach(function (a) {
    var href     = a.getAttribute('href') || '';
    var linkPage = href.split('/').pop().split('#')[0] || 'index.html';
    if (linkPage && linkPage === currentPath) {
      a.classList.add('active-link');
    }
    if ((href === '#top' || href === '' || href === 'index.html') &&
        (currentPath === '' || currentPath === 'index.html')) {
      a.classList.add('active-link');
    }
  });

  /* ── 7. SCROLL REVEAL ────────────────────────────────────── */
  function checkReveals() {
    var wh = window.innerHeight;
    document.querySelectorAll('.reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top < wh - 80) {
        el.classList.add('active');
      }
    });
  }
  window.addEventListener('scroll', checkReveals, { passive: true });
  window.addEventListener('load', checkReveals);
  checkReveals();

  /* ── 8. HERO SLIDER (index only) ─────────────────────────── */
  var slidesEl = document.getElementById('slides');
  if (slidesEl) {
    var dotsWrap  = document.getElementById('sliderDots');
    var slides    = slidesEl.querySelectorAll('.slide');
    var total     = slides.length;
    var current   = 0;
    var autoTimer;
    if (dotsWrap) {
      for (var d = 0; d < total; d++) {
        var dot = document.createElement('button');
        dot.setAttribute('aria-label', 'Go to slide ' + (d + 1));
        if (d === 0) dot.classList.add('active');
        (function (i) {
          dot.addEventListener('click', function () { goTo(i); resetAuto(); });
        })(d);
        dotsWrap.appendChild(dot);
      }
    }
    function goTo(index) {
      current = (index + total) % total;
      slidesEl.style.transform = 'translateX(-' + (current * 100) + '%)';
      if (dotsWrap) {
        dotsWrap.querySelectorAll('button').forEach(function (b, i) {
          b.classList.toggle('active', i === current);
        });
      }
    }
    function resetAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(function () { goTo(current + 1); }, 5000);
    }
    var prevBtn = document.getElementById('prevSlide');
    var nextBtn = document.getElementById('nextSlide');
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); resetAuto(); });
    var touchStartX = 0;
    slidesEl.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    slidesEl.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { goTo(diff > 0 ? current + 1 : current - 1); resetAuto(); }
    });
    resetAuto();
  }

  /* ── 9. ACTIVE SECTION HIGHLIGHT (index only) ─────────────── */
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('#desktopNav a');
  if (sections.length && navLinks.length) {
    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY + 120;
      sections.forEach(function (sec) {
        var top    = sec.offsetTop;
        var height = sec.offsetHeight;
        var id     = sec.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
          navLinks.forEach(function (a) {
            a.classList.remove('active-link');
            if (a.getAttribute('href') === '#' + id) {
              a.classList.add('active-link');
            }
          });
        }
      });
    }, { passive: true });
  }

})();
