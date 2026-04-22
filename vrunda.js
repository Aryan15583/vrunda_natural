/* ============================================================
   VRUNDA NATURAL — vrunda.js
   Shared site-wide JS: transitions, dark mode, nav, header
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. DARK MODE — browser/OS decides, no button ───────────── */
  function setTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
  }

  // Set on page load
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark);

  // Update instantly whenever browser/OS theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function (e) {
        setTheme(e.matches);
      });
  }

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

  // Only show the overlay when navigating AWAY from the page.
  // Do NOT set opacity:1 on load — that was causing the permanent green screen.

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
  function hideLoader() {
    var loader = document.getElementById('loader');
    if (loader) {
      setTimeout(function () { loader.classList.add('hidden'); }, 700);
    }
  }
  // Hide on full load (all assets), but also guarantee hide after 3s max
  window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 3000);

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

  /* ── 5. HAMBURGER / MOBILE NAV — smooth drawer ──────────────── */

  // Auto-inject hamburger button if the HTML page doesn't already have one
  if (!document.getElementById('hamburger')) {
    var hbgBtn = document.createElement('button');
    hbgBtn.id        = 'hamburger';
    hbgBtn.className = 'hamburger';
    hbgBtn.setAttribute('aria-label', 'Toggle navigation');
    hbgBtn.setAttribute('aria-expanded', 'false');
    hbgBtn.innerHTML = '<span></span><span></span><span></span>';
    var hInner = document.querySelector('.header-inner');
    if (hInner) hInner.appendChild(hbgBtn);
  }

  // Inject the backdrop overlay (dimmed + blurred background when nav is open)
  var backdrop = document.getElementById('nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  var hamburger = document.getElementById('hamburger');
  var mobileNav  = document.getElementById('mobileNav');

  // Inject close button + brand name inside the drawer header
  if (mobileNav && !document.getElementById('mobileNavClose')) {
    var closeBtn = document.createElement('button');
    closeBtn.id = 'mobileNavClose';
    closeBtn.setAttribute('aria-label', 'Close navigation');
    closeBtn.innerHTML = '&#10005;';
    mobileNav.appendChild(closeBtn);
    closeBtn.addEventListener('click', closeMobileNav);

    var brand = document.createElement('span');
    brand.id          = 'mobileNavBrand';
    brand.textContent = 'Vrunda Natural';
    mobileNav.appendChild(brand);
  }

  function openMobileNav() {
    if (!mobileNav || !hamburger) return;
    mobileNav.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nav-open');
    backdrop.style.display = 'block';
    requestAnimationFrame(function () {
      backdrop.classList.add('visible');
    });
  }

  window.closeMobileNav = function () {
    if (!mobileNav || !hamburger) return;
    mobileNav.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
    backdrop.classList.remove('visible');
    setTimeout(function () {
      if (!backdrop.classList.contains('visible')) backdrop.style.display = 'none';
    }, 380);
  };

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      if (mobileNav && mobileNav.classList.contains('open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  // Close on backdrop tap
  backdrop.addEventListener('click', closeMobileNav);

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('open')) {
      closeMobileNav();
    }
  });

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
  // Mark body so CSS knows JS is active — only NOW do .reveal elements hide.
  // Immediately check which ones are already in view and show them at once.
  document.body.setAttribute('data-reveal-ready', '1');

  function checkReveals() {
    var wh = window.innerHeight;
    document.querySelectorAll('.reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top < wh - 40) {
        el.classList.add('active');
      }
    });
  }
  // Run immediately, again after images settle, and on every scroll
  checkReveals();
  window.addEventListener('load', checkReveals);
  window.addEventListener('scroll', checkReveals, { passive: true });

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