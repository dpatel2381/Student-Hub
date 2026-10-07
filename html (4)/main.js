/* ============================================================
   StudentHub — main.js
   Hamburger menu, theme switcher, notification banner, modals,
   slider, FAQ accordion, calendar filter/add, resource tabs,
   profile editing, and demo forms (contact / login).
   Every init function checks for its markup first, so this file
   is safe to include on every page.
   ============================================================ */
(function () {
  'use strict';

  var MOBILE_BP = 780;

  function storeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* storage unavailable */ } }

  document.addEventListener('DOMContentLoaded', function () {
    initHamburgerMenu();
    initThemeToggle();
    initNotifBanner();
    initCalendar();   // before initModals so it reads the form before the modal resets it
    initProfile();    // same reason
    initModals();
    initSlider();
    initFaqAccordion();
    initResourceTabs();
    initForms();
  });

  /* ---------------- Hamburger menu ---------------- */
  function initHamburgerMenu() {
    var buttons = document.querySelectorAll('.hamburger');
    if (!buttons.length) return;

    function setOpen(btn, links, open) {
      links.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    buttons.forEach(function (btn) {
      var links = btn.parentElement.querySelector('.nav-links');
      if (!links) return;

      btn.addEventListener('click', function () {
        setOpen(btn, links, !links.classList.contains('nav-open'));
      });

      // close after using a link inside the menu
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { setOpen(btn, links, false); });
      });

      // close on outside click / Escape / growing past the mobile breakpoint
      document.addEventListener('click', function (e) {
        if (links.classList.contains('nav-open') && !btn.parentElement.contains(e.target)) setOpen(btn, links, false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && links.classList.contains('nav-open')) { setOpen(btn, links, false); btn.focus(); }
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > MOBILE_BP) setOpen(btn, links, false);
      });
    });
  }

  /* ---------------- Theme toggle ---------------- */
  function initThemeToggle() {
    var toggles = document.querySelectorAll('.theme-toggle');
    if (!toggles.length) return;

    function current() {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }
    function reflect(theme) {
      toggles.forEach(function (btn) {
        btn.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      });
    }

    reflect(current());
    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
        storeSet('studenthub-theme', next);
        reflect(next);
      });
    });
  }

  /* ---------------- Notification banner ---------------- */
  function initNotifBanner() {
    document.querySelectorAll('.notif-banner').forEach(function (banner) {
      var key = 'studenthub-banner-dismissed-' + (banner.getAttribute('data-banner-id') || 'default');
      if (storeGet(key) === '1') { banner.remove(); return; }

      var closeBtn = banner.querySelector('.notif-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          storeSet(key, '1');
          banner.remove();
        });
      }
    });
  }

  /* ---------------- Modals ---------------- */
  var lastFocused = null;

  function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        var modal = document.getElementById(trigger.getAttribute('data-modal-open'));
        if (modal) { e.preventDefault(); openModal(modal, trigger); }
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(overlay); });

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
      var open = document.querySelector('.modal-overlay:not([hidden])');
      if (!open) return;
      if (e.key === 'Escape') { closeModal(open); return; }
      if (e.key === 'Tab') trapFocus(open, e);
    });
  }

  function trapFocus(modal, e) {
    var items = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea');
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openModal(modal, trigger) {
    lastFocused = trigger || document.activeElement;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    var focusable = modal.querySelector('input, textarea, select');
    if (focusable) focusable.focus();
  }

  function closeModal(modal) {
    modal.setAttribute('hidden', '');
    if (!document.querySelector('.modal-overlay:not([hidden])')) document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* ---------------- Slider ---------------- */
  function initSlider() {
    document.querySelectorAll('.slider').forEach(function (slider) {
      var track = slider.querySelector('.slider-track');
      var slides = slider.querySelectorAll('.slider-slide');
      var dotsWrap = slider.querySelector('.slider-dots');
      if (!track || !slides.length) return;

      var index = 0, timer = null;
      var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

      slider.setAttribute('aria-roledescription', 'carousel');
      track.setAttribute('aria-live', 'off');

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
        slides.forEach(function (s, i) { s.setAttribute('aria-hidden', i === index ? 'false' : 'true'); });
        if (dotsWrap) {
          dotsWrap.querySelectorAll('.slider-dot').forEach(function (dot, i) {
            dot.classList.toggle('active', i === index);
          });
        }
      }
      function goTo(i) { index = (i + slides.length) % slides.length; update(); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      function start() {
        if (!slider.hasAttribute('data-autoplay') || reduceMotion || timer) return;
        timer = setInterval(function () { goTo(index + 1); }, 5000);
      }

      // swipe support for touch screens
      var startX = null;
      slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
      slider.addEventListener('touchend', function (e) {
        if (startX !== null) {
          var dx = e.changedTouches[0].clientX - startX;
          if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
        }
        startX = null;
        start();
      });
      // keyboard arrows when the slider has focus
      slider.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') goTo(index - 1);
        if (e.key === 'ArrowRight') goTo(index + 1);
      });

      slider.addEventListener('mouseenter', stop);
      slider.addEventListener('mouseleave', start);
      slider.addEventListener('focusin', stop);
      slider.addEventListener('focusout', start);
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

      update();
      start();
    });
  }

  /* ---------------- FAQ accordion ---------------- */
  function initFaqAccordion() {
    var questions = document.querySelectorAll('.faq-question');
    if (!questions.length) return;

    function sync() {
      document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(function (btn) {
        var wrap = document.getElementById(btn.getAttribute('aria-controls'));
        if (wrap) wrap.style.maxHeight = wrap.scrollHeight + 'px';
      });
    }
    sync();
    window.addEventListener('resize', sync);   // text re-wraps on resize
    window.addEventListener('load', sync);     // web fonts change heights

    questions.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        var wrap = document.getElementById(btn.getAttribute('aria-controls'));
        var list = btn.closest('.faq-list');

        if (list) {
          list.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(function (other) {
            if (other !== btn) {
              other.setAttribute('aria-expanded', 'false');
              var ow = document.getElementById(other.getAttribute('aria-controls'));
              if (ow) ow.style.maxHeight = null;
            }
          });
        }
        btn.setAttribute('aria-expanded', String(!isOpen));
        if (wrap) wrap.style.maxHeight = !isOpen ? wrap.scrollHeight + 'px' : null;
      });
    });
  }

  /* ---------------- Resource tabs ---------------- */
  function initResourceTabs() {
    var tabs = document.querySelectorAll('.tabs [role="tab"]');
    if (!tabs.length) return;

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  }

  /* ---------------- Calendar: filter + add event ---------------- */
  function initCalendar() {
    var table = document.getElementById('eventTable');
    if (!table) return;
    var body = table.tBodies[0];
    var search = document.getElementById('eventSearch');
    var category = document.getElementById('eventCategory');

    var empty = document.createElement('tr');
    empty.className = 'no-results';
    empty.hidden = true;
    empty.innerHTML = '<td colspan="3">No events match your search.</td>';
    body.appendChild(empty);

    function applyFilter() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var cat = category ? category.value : 'All categories';
      var shown = 0;
      body.querySelectorAll('tr:not(.no-results)').forEach(function (row) {
        var okText = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
        var okCat = cat === 'All categories' || row.getAttribute('data-category') === cat;
        row.hidden = !(okText && okCat);
        if (!row.hidden) shown++;
      });
      empty.hidden = shown > 0;
    }
    if (search) search.addEventListener('input', applyFilter);
    if (category) category.addEventListener('change', applyFilter);

    var form = document.querySelector('#addEventModal form');
    if (form) {
      form.addEventListener('submit', function () {
        var title = form.elements['event-title'].value.trim();
        var date = form.elements['event-date'].value.trim();
        var place = form.elements['event-location'].value.trim();
        var cat = form.elements['event-category'] ? form.elements['event-category'].value : '';
        if (!title || !date || !place) return;

        var row = document.createElement('tr');
        row.setAttribute('data-category', cat);
        [date, title, place].forEach(function (text) {
          var td = document.createElement('td');
          td.textContent = text;           // textContent: never inject user input as HTML
          row.appendChild(td);
        });
        body.insertBefore(row, empty);
        applyFilter();
      });
    }
  }

  /* ---------------- Profile ---------------- */
  function initProfile() {
    var fields = document.querySelectorAll('.profile-field[data-field]');
    if (!fields.length) return;

    var student = { name: 'Dhanvi Patel', email: 'dhanvi@example.com', studentId: '25DCE077', major: 'Computer Engineering', year: '2' };
    try {
      var saved = JSON.parse(storeGet('studenthub-profile') || 'null');
      if (saved && typeof saved === 'object') Object.keys(student).forEach(function (k) { if (saved[k]) student[k] = saved[k]; });
    } catch (e) { /* ignore corrupt data */ }

    var form = document.querySelector('#editProfileModal form');
    var yearSelect = form && form.elements['profile-year'];

    function yearLabel(value) {
      if (!yearSelect) return value;
      var opt = yearSelect.querySelector('option[value="' + value + '"]');
      return opt ? opt.textContent : value;
    }
    function render() {
      fields.forEach(function (f) {
        var key = f.getAttribute('data-field');
        var out = f.querySelector('.value');
        if (out) out.textContent = key === 'year' ? yearLabel(student.year) : student[key];
      });
    }
    render();

    if (!form) return;
    function prefill() {
      form.elements['profile-name'].value = student.name;
      form.elements['profile-email'].value = student.email;
      form.elements['profile-major'].value = student.major;
      form.elements['profile-year'].value = student.year;
    }
    document.querySelectorAll('[data-modal-open="editProfileModal"]').forEach(function (t) {
      t.addEventListener('click', prefill);
    });
    form.addEventListener('submit', function () {
      student.name = form.elements['profile-name'].value.trim() || student.name;
      student.email = form.elements['profile-email'].value.trim() || student.email;
      student.major = form.elements['profile-major'].value.trim() || student.major;
      student.year = form.elements['profile-year'].value || student.year;
      storeSet('studenthub-profile', JSON.stringify(student));
      render();
    });
  }

  /* ---------------- Demo forms (contact + login) ---------------- */
  function initForms() {
    var contact = document.querySelector('form[data-contact]');
    if (contact) {
      var status = contact.querySelector('.form-status');
      contact.addEventListener('submit', function (e) {
        e.preventDefault();
        if (status) status.textContent = 'Thanks! Your message has been sent. We\u2019ll get back to you soon.';
        contact.reset();
      });
    }

    var login = document.querySelector('form[data-login]');
    if (login) {
      login.addEventListener('submit', function (e) {
        e.preventDefault();   // avoids putting the password into the URL
        window.location.href = 'dashboard.html';
      });
    }
  }
})();
