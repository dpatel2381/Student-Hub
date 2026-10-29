'use strict';

(() => {
  const DATASETS = {
    events: {
      file: 'data/events.json',
      singular: 'event',
      filterField: 'category',
      defaultSort: 'date-asc',
      sortOptions: [
        ['date-asc', 'Date: earliest first'], ['date-desc', 'Date: latest first'],
        ['title-asc', 'Title: A to Z'], ['title-desc', 'Title: Z to A']
      ]
    },
    students: {
      file: 'data/students.json',
      singular: 'student',
      filterField: 'course',
      defaultSort: 'name-asc',
      sortOptions: [
        ['name-asc', 'Name: A to Z'], ['name-desc', 'Name: Z to A'],
        ['course-asc', 'Course: A to Z'], ['course-desc', 'Course: Z to A'],
        ['year-asc', 'Year: low to high'], ['year-desc', 'Year: high to low']
      ]
    },
    faqs: {
      file: 'data/faqs.json',
      singular: 'FAQ',
      filterField: 'category',
      defaultSort: 'question-asc',
      sortOptions: [
        ['question-asc', 'Question: A to Z'], ['question-desc', 'Question: Z to A'],
        ['category-asc', 'Category: A to Z'], ['category-desc', 'Category: Z to A']
      ]
    }
  };

  const PAGE_SIZE = 6;
  const elements = {
    tabs: [...document.querySelectorAll('[data-dataset]')],
    search: document.querySelector('#dataSearch'),
    filter: document.querySelector('#dataFilter'),
    sort: document.querySelector('#dataSort'),
    count: document.querySelector('#resultCount'),
    pageSummary: document.querySelector('#pageSummary'),
    status: document.querySelector('#dataStatus'),
    results: document.querySelector('#dataResults'),
    pagination: document.querySelector('#pagination'),
    retry: document.querySelector('#retryButton'),
    themeToggle: document.querySelector('.theme-toggle'),
    hamburger: document.querySelector('.hamburger'),
    navLinks: document.querySelector('.nav-links')
  };

  let activeDataset = 'events';
  let allRecords = [];
  let currentPage = 1;
  let requestNumber = 0;

  function setStatus(message, type = '') {
    elements.status.textContent = message;
    elements.status.className = `data-status${type ? ` is-${type}` : ''}`;
    elements.status.hidden = !message;
  }

  function setBusy(isBusy) {
    elements.results.setAttribute('aria-busy', String(isBusy));
    elements.retry.hidden = isBusy;
  }

  async function loadDataset(datasetName) {
    const requestId = ++requestNumber;
    activeDataset = datasetName;
    currentPage = 1;
    allRecords = [];
    elements.results.replaceChildren();
    elements.pagination.replaceChildren();
    elements.count.textContent = 'Loading records…';
    elements.pageSummary.textContent = '';
    setStatus('Loading JSON data…');
    setBusy(true);
    elements.tabs.forEach(tab => {
      const selected = tab.dataset.dataset === datasetName;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-pressed', String(selected));
    });

    try {
      const response = await fetch(DATASETS[datasetName].file, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`The server returned HTTP ${response.status}.`);
      const records = await response.json();
      if (!Array.isArray(records)) throw new Error('The JSON file must contain an array of records.');
      if (requestId !== requestNumber) return;
      allRecords = records;
      populateFilter();
      populateSort();
      elements.search.value = '';
      setStatus(`Loaded ${allRecords.length} ${DATASETS[datasetName].singular}${allRecords.length === 1 ? '' : 's'} from ${DATASETS[datasetName].file}.`);
      render();
    } catch (error) {
      if (requestId !== requestNumber) return;
      setStatus(`Could not load ${DATASETS[datasetName].file}. ${error.message} Run the project through Live Server or another local web server, then try again.`, 'error');
      elements.count.textContent = 'No records loaded';
      elements.pageSummary.textContent = '';
      elements.results.replaceChildren();
      elements.pagination.replaceChildren();
      elements.retry.hidden = false;
    } finally {
      if (requestId === requestNumber) setBusy(false);
    }
  }

  function populateFilter() {
    const field = DATASETS[activeDataset].filterField;
    const values = [...new Set(allRecords.map(record => String(record[field] ?? '')).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    elements.filter.replaceChildren(new Option('All records', 'all'));
    values.forEach(value => elements.filter.add(new Option(value, value)));
    elements.filter.setAttribute('aria-label', `Filter ${activeDataset} by ${field}`);
  }

  function populateSort() {
    const config = DATASETS[activeDataset];
    elements.sort.replaceChildren();
    config.sortOptions.forEach(([value, label]) => elements.sort.add(new Option(label, value)));
    elements.sort.value = config.defaultSort;
  }

  function getFilteredRecords() {
    const query = elements.search.value.trim().toLocaleLowerCase();
    const filterValue = elements.filter.value;
    const filterField = DATASETS[activeDataset].filterField;
    const sortValue = elements.sort.value;

    const records = allRecords.filter(record => {
      const matchesSearch = !query || Object.values(record).some(value =>
        String(value ?? '').toLocaleLowerCase().includes(query));
      const matchesFilter = filterValue === 'all' || String(record[filterField] ?? '') === filterValue;
      return matchesSearch && matchesFilter;
    });

    const [sortField, direction] = sortValue.split('-');
    const multiplier = direction === 'desc' ? -1 : 1;
    records.sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * multiplier;
      return String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' }) * multiplier;
    });
    return records;
  }

  function createTextElement(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function createCard(record) {
    const card = document.createElement('article');
    card.className = 'data-card';

    if (activeDataset === 'events') {
      card.append(createTextElement('h3', record.title));
      card.append(createTextElement('p', formatDate(record.date), 'record-meta'));
      card.append(createTextElement('p', `Location: ${record.location}`));
      card.append(createTextElement('p', record.description));
      card.append(createTextElement('span', record.category, 'record-tag'));
    } else if (activeDataset === 'students') {
      card.append(createTextElement('h3', record.name));
      card.append(createTextElement('p', record.id, 'record-meta'));
      card.append(createTextElement('p', record.email));
      card.append(createTextElement('p', `Course: ${record.course}`));
      card.append(createTextElement('p', `Year: ${record.year}`));
      card.append(createTextElement('span', record.status, 'record-tag'));
    } else {
      card.append(createTextElement('h3', record.question));
      card.append(createTextElement('p', record.answer));
      card.append(createTextElement('span', record.category, 'record-tag'));
    }
    return card;
  }

  function formatDate(value) {
    if (!value) return 'Date not specified';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    }).format(date);
  }

  function renderPagination(totalPages) {
    elements.pagination.replaceChildren();
    if (totalPages <= 1) return;

    const previous = createTextElement('button', 'Previous', 'page-button');
    previous.type = 'button';
    previous.disabled = currentPage === 1;
    previous.addEventListener('click', () => { currentPage--; render(); });
    elements.pagination.append(previous);

    for (let page = 1; page <= totalPages; page++) {
      const button = createTextElement('button', String(page), 'page-button');
      button.type = 'button';
      if (page === currentPage) button.setAttribute('aria-current', 'page');
      button.setAttribute('aria-label', `Page ${page}`);
      button.addEventListener('click', () => { currentPage = page; render(); });
      elements.pagination.append(button);
    }

    const next = createTextElement('button', 'Next', 'page-button');
    next.type = 'button';
    next.disabled = currentPage === totalPages;
    next.addEventListener('click', () => { currentPage++; render(); });
    elements.pagination.append(next);
  }

  function render() {
    const filtered = getFilteredRecords();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRecords = filtered.slice(start, start + PAGE_SIZE);

    elements.results.replaceChildren();
    pageRecords.forEach(record => elements.results.append(createCard(record)));
    elements.count.textContent = `${filtered.length} ${DATASETS[activeDataset].singular}${filtered.length === 1 ? '' : 's'} found`;
    elements.pageSummary.textContent = filtered.length
      ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`
      : 'No matching records';

    if (!filtered.length) {
      elements.results.append(createTextElement('p', 'No records match your search and filter. Try changing or clearing them.', 'empty-state'));
    }
    renderPagination(totalPages);
  }

  elements.tabs.forEach(tab => tab.addEventListener('click', () => loadDataset(tab.dataset.dataset)));
  elements.search.addEventListener('input', () => { currentPage = 1; render(); });
  elements.filter.addEventListener('change', () => { currentPage = 1; render(); });
  elements.sort.addEventListener('change', () => { currentPage = 1; render(); });
  elements.retry.addEventListener('click', () => loadDataset(activeDataset));

  if (elements.themeToggle) {
    elements.themeToggle.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      try { localStorage.setItem('studenthub-theme', dark ? 'dark' : 'light'); } catch (error) { /* ignore */ }
      elements.themeToggle.textContent = dark ? '☀️' : '🌙';
    });
  }
  if (elements.hamburger && elements.navLinks) {
    elements.hamburger.addEventListener('click', () => {
      const expanded = elements.hamburger.getAttribute('aria-expanded') === 'true';
      elements.hamburger.setAttribute('aria-expanded', String(!expanded));
      elements.navLinks.classList.toggle('nav-open', !expanded);
    });
  }

  loadDataset(activeDataset);
})();
