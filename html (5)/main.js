/* ============================================================
   StudentHub — main.js
   Hamburger menu, theme switcher, notification banner, modals,
   slider, FAQ accordion, calendar filter/add, resource tabs,
   profile editing, demo session, and demo forms.
   Every init function checks for its markup first, so this file
   is safe to include on every page.
   ============================================================ */
(function () {
  'use strict';

  var MOBILE_BP = 780;

  function storeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* storage unavailable */ } }

  document.addEventListener('DOMContentLoaded', function () {
    initSession();
    initToast();
    initHamburgerMenu();
    initNavMenus();
    initThemeToggle();
    initNotifBanner();
    initCalendar();   // before initModals so it reads the form before the modal resets it
    initProfile();    // same reason
    initModals();
    initSlider();
    initFaqAccordion();
    initFaqFilter();
    initResourceTabs();
    initForms();
    initRegister();
    initDashboard();
    initSoon();
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
        if (e.key === 'Escape' && links.classList.contains('nav-open') && !document.querySelector('.modal-overlay:not([hidden])')) { setOpen(btn, links, false); btn.focus(); }
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

      var hovering = false;   // don't restart autoplay while the pointer or keyboard focus is still inside
      slider.addEventListener('mouseenter', function () { hovering = true; stop(); });
      slider.addEventListener('mouseleave', function () { hovering = false; if (!slider.contains(document.activeElement)) start(); });
      slider.addEventListener('focusin', stop);
      slider.addEventListener('focusout', function () { if (!hovering) start(); });
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

  /* ---------------- Shared demo data ---------------- */
  var SESSION_KEY = 'studenthub-session';
  var PROFILE_KEY = 'studenthub-profile';
  var EVENTS_KEY = 'studenthub-events';

  // Sample events, used until the user adds or removes one. Dates are ISO (YYYY-MM-DD).
  var DEFAULT_EVENTS = [
    { id: 'seed-1', title: 'Workshop: Digital Logic Design', date: '2026-07-25', location: 'Lab 3', category: 'Workshop' },
    { id: 'seed-2', title: 'Hackathon', date: '2026-08-10', location: 'Main Auditorium', category: 'Hackathon' },
    { id: 'seed-3', title: 'Guest Lecture: AI in Education', date: '2026-08-20', location: 'Seminar Hall', category: 'Guest Lecture' }
  ];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(iso, opts) { return parseIso(iso).toLocaleDateString('en-US', opts || { month: 'long', day: 'numeric', year: 'numeric' }); }
  function sortEvents(list) { return list.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); }

  function loadEvents() {
    try {
      var saved = JSON.parse(storeGet(EVENTS_KEY) || 'null');
      if (Array.isArray(saved)) {
        return saved.filter(function (e) { return e && e.id && e.title && /^\d{4}-\d{2}-\d{2}$/.test(e.date); });
      }
    } catch (e) { /* ignore corrupt data */ }
    return DEFAULT_EVENTS.slice();
  }
  function saveEvents(list) { storeSet(EVENTS_KEY, JSON.stringify(list)); }

  function loadProfile() {
    var p = { name: '', email: '', studentId: '', major: '', year: '' };
    try {
      var saved = JSON.parse(storeGet(PROFILE_KEY) || 'null');
      if (saved && typeof saved === 'object') Object.keys(p).forEach(function (k) { if (typeof saved[k] === 'string') p[k] = saved[k]; });
    } catch (e) { /* ignore corrupt data */ }
    if (!p.email) p.email = storeGet(SESSION_KEY) || '';
    return p;
  }

  function initials(text) {
    var parts = String(text || '').trim().split(/[\s@.]+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0].charAt(0) + (parts.length > 1 ? parts[1].charAt(0) : '')).toUpperCase();
  }

  /* ---------------- Demo session ---------------- */
  // Front-end flag only: there is no real authentication. Remove data-requires-auth from <body> to disable the redirect.
  // Nav shown to logged-in users on every page (so Contact/FAQ never look "logged out").
  function appNavLinks() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    function a(href, text) { return '<a href="' + href + '"' + (page === href ? ' aria-current="page"' : '') + '>' + text + '</a>'; }
    return a('faq.html', 'FAQ') +
      '<details class="nav-menu"><summary>Dashboard</summary><div class="nav-menu-list">' +
      a('dashboard.html', 'Overview') + a('announcements.html', 'Announcements') + a('calendar.html', 'Calendar') + a('resources.html', 'Resources') +
      '</div></details>' + a('contact.html', 'Contact') + a('profile.html', 'Profile') +
      '<button class="theme-toggle" type="button" aria-label="Toggle dark/light theme">\uD83C\uDF19</button>' +
      '<a href="login.html" class="cta" data-logout>Log out</a>';
  }

  function initSession() {
    var email = storeGet(SESSION_KEY);
    if (document.body.hasAttribute('data-requires-auth') && !email) { window.location.replace('login.html'); return; }
    // Home and About are for visitors; logged-in users go straight to the dashboard.
    if (document.body.hasAttribute('data-guest-only') && email) { window.location.replace('dashboard.html'); return; }
    if (email) {
      var links = document.querySelector('nav .nav-links');
      if (links && links.querySelector('[data-auth-cta]')) links.innerHTML = appNavLinks();
    }
    document.querySelectorAll('[data-logout]').forEach(function (a) {
      a.addEventListener('click', function () { try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ } });
    });
  }

  /* ---------------- Toast + "coming soon" links ---------------- */
  var toastEl = null, toastTimer = null;
  function initToast() {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }
  function initSoon() {
    document.querySelectorAll('[data-soon]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        toast('\u201C' + a.textContent.replace(/^\+\s*/, '').trim() + '\u201D isn\u2019t available yet.');
      });
    });
  }

  /* ---------------- Dropdown nav (<details>) ---------------- */
  function initNavMenus() {
    var menus = document.querySelectorAll('.nav-menu');
    if (!menus.length) return;
    document.addEventListener('click', function (e) {
      menus.forEach(function (m) { if (m.open && !m.contains(e.target)) m.open = false; });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      menus.forEach(function (m) { if (m.open) { m.open = false; m.querySelector('summary').focus(); } });
    });
  }

  /* ---------------- Dashboard: name + upcoming events ---------------- */
  function initDashboard() {
    var first = loadProfile().name.split(/\s+/)[0];
    if (first) document.querySelectorAll('[data-user-name]').forEach(function (el) { el.textContent = first; });

    var list = document.querySelector('[data-upcoming-events]');
    if (!list) return;
    var today = todayIso();
    var upcoming = sortEvents(loadEvents()).filter(function (ev) { return ev.date >= today; }).slice(0, 3);
    list.innerHTML = '';
    if (!upcoming.length) {
      var none = document.createElement('li');
      none.innerHTML = 'No upcoming events. <a href="calendar.html">Add one in the calendar</a>.';
      list.appendChild(none);
      return;
    }
    upcoming.forEach(function (ev) {
      var li = document.createElement('li');
      li.textContent = ev.title + ' \u2013 ' + fmtDate(ev.date, { month: 'short', day: 'numeric' });
      list.appendChild(li);
    });
  }

  /* ---------------- Calendar: stored events, filter, add/remove, .ics export ---------------- */
  function icsText(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }

  function downloadIcs(list) {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StudentHub//Events//EN', 'CALSCALE:GREGORIAN'];
    list.forEach(function (ev) {
      var next = parseIso(ev.date); next.setDate(next.getDate() + 1);
      lines.push('BEGIN:VEVENT', 'UID:' + ev.id + '@studenthub', 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + ev.date.replace(/-/g, ''),
        'DTEND;VALUE=DATE:' + next.getFullYear() + pad(next.getMonth() + 1) + pad(next.getDate()),
        'SUMMARY:' + icsText(ev.title), 'LOCATION:' + icsText(ev.location), 'CATEGORIES:' + icsText(ev.category), 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'studenthub-events.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function initCalendar() {
    var table = document.getElementById('eventTable');
    if (!table) return;
    var body = table.tBodies[0];
    var search = document.getElementById('eventSearch');
    var category = document.getElementById('eventCategory');
    var events = loadEvents();

    var empty = document.createElement('tr');
    empty.className = 'no-results';
    empty.hidden = true;
    empty.innerHTML = '<td colspan="4"></td>';

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
      empty.cells[0].textContent = events.length ? 'No events match your search.' : 'No events yet \u2014 use \u201CAdd new event\u201D.';
      empty.hidden = shown > 0;
    }

    function render() {
      var today = todayIso();
      body.innerHTML = '';
      sortEvents(events).forEach(function (ev) {
        var row = document.createElement('tr');
        row.setAttribute('data-category', ev.category || '');
        var past = ev.date < today;
        if (past) row.className = 'is-past';
        [fmtDate(ev.date), ev.title, ev.location || ''].forEach(function (text) {
          var td = document.createElement('td');
          td.textContent = text;           // textContent: never inject user input as HTML
          row.appendChild(td);
        });
        if (past) {
          var badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = 'Past';
          row.cells[1].appendChild(badge);
        }
        var act = document.createElement('td');
        var rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'row-remove';
        rm.textContent = 'Remove';
        rm.setAttribute('aria-label', 'Remove ' + ev.title);
        rm.addEventListener('click', function () {
          events = events.filter(function (e) { return e.id !== ev.id; });
          saveEvents(events);
          render();
          toast('Event removed.');
        });
        act.appendChild(rm);
        row.appendChild(act);
        body.appendChild(row);
      });
      body.appendChild(empty);
      applyFilter();
    }
    render();

    if (search) search.addEventListener('input', applyFilter);
    if (category) category.addEventListener('change', applyFilter);

    var sync = document.querySelector('[data-sync-ics]');
    if (sync) sync.addEventListener('click', function (e) {
      e.preventDefault();
      if (!events.length) { toast('Add an event first.'); return; }
      downloadIcs(sortEvents(events));
    });

    var form = document.querySelector('#addEventModal form');
    if (form) {
      form.addEventListener('submit', function () {
        var title = form.elements['event-title'].value.trim();
        var date = form.elements['event-date'].value;
        var place = form.elements['event-location'].value.trim();
        var cat = form.elements['event-category'] ? form.elements['event-category'].value : '';
        if (!title || !date || !place) return;
        events.push({ id: 'u' + Date.now(), title: title, date: date, location: place, category: cat });
        saveEvents(events);
        render();
        toast('Event added.');
      });
    }
  }

  /* ---------------- Profile ---------------- */
  function initProfile() {
    var fields = document.querySelectorAll('.profile-field[data-field]');
    if (!fields.length) return;

    var student = loadProfile();
    var form = document.querySelector('#editProfileModal form');
    var yearSelect = form && form.elements['profile-year'];
    var avatar = document.querySelector('.profile-avatar');

    function yearLabel(value) {
      var opt = yearSelect && value ? yearSelect.querySelector('option[value="' + value + '"]') : null;
      return opt ? opt.textContent : value;
    }
    function render() {
      fields.forEach(function (f) {
        var key = f.getAttribute('data-field');
        var out = f.querySelector('.value');
        if (out) out.textContent = (key === 'year' ? yearLabel(student.year) : student[key]) || 'Not set';
      });
      if (avatar) avatar.textContent = initials(student.name || student.email);
    }
    render();

    // change-password modal (demo: the new password is validated but not stored anywhere)
    var pwForm = document.querySelector('#changePasswordModal form');
    if (pwForm) {
      var next = pwForm.elements['new-password'], again = pwForm.elements['confirm-password'];
      var matchCheck = function () { again.setCustomValidity(again.value && again.value !== next.value ? 'Passwords do not match.' : ''); };
      next.addEventListener('input', matchCheck);
      again.addEventListener('input', matchCheck);
      pwForm.addEventListener('submit', function () { toast('Password updated.'); });
    }

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
      student.name = form.elements['profile-name'].value.trim();
      student.email = form.elements['profile-email'].value.trim();
      student.major = form.elements['profile-major'].value.trim();
      student.year = form.elements['profile-year'].value;
      storeSet(PROFILE_KEY, JSON.stringify(student));
      render();
      toast('Profile saved.');
    });
  }

  /* ---------------- FAQ category filter ---------------- */
  function initFaqFilter() {
    var links = document.querySelectorAll('[data-faq-filter]');
    if (!links.length) return;
    var items = document.querySelectorAll('.faq-item[data-category]');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var cat = link.getAttribute('data-faq-filter');
        links.forEach(function (l) {
          l.classList.toggle('is-active', l === link);
          l.setAttribute('aria-pressed', l === link ? 'true' : 'false');
        });
        items.forEach(function (it) {
          it.classList.toggle('is-hidden', cat !== 'all' && it.getAttribute('data-category') !== cat);
        });
      });
    });
  }

  /* ---------------- Demo forms (contact, login, password reset) ---------------- */
  function initForms() {
    var contact = document.querySelector('form[data-contact]');
    if (contact) {
      var status = contact.querySelector('.form-status');
      contact.addEventListener('submit', function (e) {
        e.preventDefault();
        if (status) status.textContent = 'Thanks! Your message has been sent. We\u2019ll get back to you soon.';
        contact.reset();
      });
      contact.addEventListener('input', function () { if (status) status.textContent = ''; });
    }

    var login = document.querySelector('form[data-login]');
    if (login) {
      login.addEventListener('submit', function (e) {
        e.preventDefault();   // avoids putting the password into the URL
        storeSet(SESSION_KEY, login.elements['username'].value.trim());   // demo session, not real auth
        window.location.href = 'dashboard.html';
      });
    }

    var reset = document.querySelector('form[data-reset]');
    if (reset) {
      var resetStatus = reset.querySelector('.form-status');
      reset.addEventListener('submit', function (e) {
        e.preventDefault();
        if (resetStatus) resetStatus.textContent = 'If an account exists for that email, a reset link is on its way.';
        reset.reset();
      });
    }
  }

  /* ---------------- Register form (validation + save profile) ---------------- */
  function initRegister() {
            var form = document.getElementById("registerForm");
            if (!form) return;
            var successBox = document.getElementById("formSuccess");

            var rules = {
                fullname: { test: /^[A-Za-z][A-Za-z\s.'-]{2,49}$/, msg: "Enter a valid full name (letters only, at least 3 characters)." },
                email:    { test: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: "Enter a valid email address." },
                mobile:   { test: /^[6-9]\d{9}$/, msg: "Enter a valid 10-digit mobile number starting with 6-9." },
                studentid:{ test: /^[A-Za-z0-9]{5,15}$/, msg: "Student ID must be 5-15 letters or digits." },
                course:   { test: /^.{2,}$/, msg: "Enter your course." },
                password: { test: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/,
                            msg: "Password needs 8+ characters with an uppercase letter, a lowercase letter, a number and a special character." }
            };

            function setError(id, message) {
                var box = document.getElementById("err-" + id);
                var field = document.getElementById(id);
                if (box) { box.textContent = message || ""; box.hidden = !message; }
                if (field && field.setAttribute) {
                    if (message) { field.setAttribute("aria-invalid", "true"); field.setAttribute("aria-describedby", "err-" + id); }
                    else { field.removeAttribute("aria-invalid"); field.removeAttribute("aria-describedby"); }
                }
            }

            function check(id) {
                var el = document.getElementById(id), value = el.value, message = "";
                if (id === "year") {
                    if (!value) message = "Select your year.";
                } else if (id === "confirm-password") {
                    if (value !== document.getElementById("password").value || !value) message = "Passwords do not match.";
                } else {
                    var rule = rules[id];
                    if (!rule.test.test(id === "password" ? value : value.trim())) message = rule.msg;
                }
                setError(id, message);
                return !message;
            }

            function checkGender() {
                var ok = !!form.querySelector('input[name="gender"]:checked');
                setError("gender", ok ? "" : "Select your gender.");
                return ok;
            }

            var order = ["fullname", "email", "mobile", "studentid", "course", "year", "gender", "password", "confirm-password"];

            // clear / re-check a field as the user fixes it
            order.forEach(function (id) {
                if (id === "gender") {
                    form.querySelectorAll('input[name="gender"]').forEach(function (r) { r.addEventListener("change", checkGender); });
                    return;
                }
                var el = document.getElementById(id);
                el.addEventListener("blur", function () { if (el.value !== "") check(id); });
                el.addEventListener("input", function () {
                    if (!document.getElementById("err-" + id).hidden) check(id);
                    if (id === "password" && document.getElementById("confirm-password").value) check("confirm-password");
                });
            });

            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var firstBad = null;
                order.forEach(function (id) {
                    var ok = id === "gender" ? checkGender() : check(id);
                    if (!ok && !firstBad) firstBad = id;
                });
                if (firstBad) {
                    var target = document.getElementById(firstBad) || form.querySelector('input[name="gender"]');
                    if (target) target.focus();
                    return;
                }

                // save what was entered so the profile page and dashboard can use it (never the password)
                storeSet(PROFILE_KEY, JSON.stringify({
                    name: document.getElementById("fullname").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    studentId: document.getElementById("studentid").value.trim(),
                    major: document.getElementById("course").value.trim(),
                    year: document.getElementById("year").value
                }));
                successBox.textContent = "Registration successful! Taking you to login\u2026";
                successBox.hidden = false;
                form.querySelector('input[type="submit"]').disabled = true;
                setTimeout(function () { window.location.href = form.getAttribute("action"); }, 2000);
            });
  }
})();
