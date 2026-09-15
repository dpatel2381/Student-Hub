/* ============================================================
   StudentHub — main.js
   Dynamic UI: hamburger menu, theme switcher, notification
   banner, modal popups, content slider, FAQ accordion.
   Every function checks for its markup first, so this file is
   safe to include on every page even if a component isn't used.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initHamburgerMenu();
  initThemeToggle();
  initNotifBanner();
  initModals();
  initSlider();
  initFaqAccordion();
});

/* ------------------------------------------------------------
   Hamburger menu — toggles the nav links on small screens
   ------------------------------------------------------------ */
function initHamburgerMenu() {
  document.querySelectorAll('.hamburger').forEach(function (btn) {
    var links = btn.parentElement.querySelector('.nav-links');
    if (!links) return;

    btn.addEventListener('click', function () {
      var isOpen = links.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // Close the open mobile menu once a link inside it is used.
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () {
      var links = link.closest('.nav-links');
      if (links && links.classList.contains('nav-open')) {
        links.classList.remove('nav-open');
        var btn = links.parentElement.querySelector('.hamburger');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

/* ------------------------------------------------------------
   Light / dark theme switcher — persists via localStorage.
   A small inline script in <head> already applies the saved
   theme before first paint; this wires up the toggle button(s).
   ------------------------------------------------------------ */
function initThemeToggle() {
  var toggles = document.querySelectorAll('.theme-toggle');
  if (!toggles.length) return;

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function reflectIcon(theme) {
    toggles.forEach(function (btn) {
      btn.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  reflectIcon(currentTheme());

  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('studenthub-theme', next); } catch (e) { /* storage unavailable */ }
      reflectIcon(next);
    });
  });
}

/* ------------------------------------------------------------
   Dismissible notification banner — remembers dismissal
   per-banner (via data-banner-id) so it stays hidden on
   future visits.
   ------------------------------------------------------------ */
function initNotifBanner() {
  document.querySelectorAll('.notif-banner').forEach(function (banner) {
    var id = banner.getAttribute('data-banner-id') || 'default';
    var key = 'studenthub-banner-dismissed-' + id;

    try {
      if (localStorage.getItem(key) === '1') {
        banner.remove();
        return;
      }
    } catch (e) { /* storage unavailable, banner stays visible */ }

    var closeBtn = banner.querySelector('.notif-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ }
        banner.remove();
      });
    }
  });
}

/* ------------------------------------------------------------
   Modal popups — any element with [data-modal-open="id"] opens
   #id; overlay click, [data-modal-close], or Escape closes it.
   ------------------------------------------------------------ */
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      var modal = document.getElementById(trigger.getAttribute('data-modal-open'));
      if (modal) {
        e.preventDefault();
        openModal(modal);
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
    overlay.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(overlay); });
    });
    var form = overlay.querySelector('form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        closeModal(overlay);
        form.reset();
      });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not([hidden])').forEach(closeModal);
    }
  });
}

function openModal(modal) {
  modal.removeAttribute('hidden');
  var focusable = modal.querySelector('input, textarea, select, button');
  if (focusable) focusable.focus();
}

function closeModal(modal) {
  modal.setAttribute('hidden', '');
}

/* ------------------------------------------------------------
   Content slider — arrows, dots, optional autoplay via
   [data-autoplay] on the .slider element.
   ------------------------------------------------------------ */
function initSlider() {
  document.querySelectorAll('.slider').forEach(function (slider) {
    var track = slider.querySelector('.slider-track');
    var slides = slider.querySelectorAll('.slider-slide');
    var dotsWrap = slider.querySelector('.slider-dots');
    var prevBtn = slider.querySelector('.slider-prev');
    var nextBtn = slider.querySelector('.slider-next');
    if (!track || !slides.length) return;

    var index = 0;

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
      });
    }

    function update() {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      if (dotsWrap) {
        dotsWrap.querySelectorAll('.slider-dot').forEach(function (dot, i) {
          dot.classList.toggle('active', i === index);
        });
      }
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      update();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });

    if (slider.hasAttribute('data-autoplay')) {
      var timer = setInterval(function () { goTo(index + 1); }, 5000);
      slider.addEventListener('mouseenter', function () { clearInterval(timer); });
      slider.addEventListener('mouseleave', function () {
        timer = setInterval(function () { goTo(index + 1); }, 5000);
      });
    }
  });
}

/* ------------------------------------------------------------
   FAQ accordion — accessible button + panel pattern, animated
   with max-height, one open item per list at a time.
   ------------------------------------------------------------ */
function initFaqAccordion() {
  // Expand any item marked open by default (aria-expanded="true" in the markup).
  document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(function (btn) {
    var wrap = document.getElementById(btn.getAttribute('aria-controls'));
    if (wrap) wrap.style.maxHeight = wrap.scrollHeight + 'px';
  });

  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      var wrap = document.getElementById(btn.getAttribute('aria-controls'));
      var list = btn.closest('.faq-list');

      if (list) {
        list.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(function (other) {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            var otherWrap = document.getElementById(other.getAttribute('aria-controls'));
            if (otherWrap) otherWrap.style.maxHeight = null;
          }
        });
      }

      btn.setAttribute('aria-expanded', String(!isOpen));
      if (wrap) wrap.style.maxHeight = !isOpen ? wrap.scrollHeight + 'px' : null;
    });
  });
}
