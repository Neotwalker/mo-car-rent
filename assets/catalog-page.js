(() => {
  'use strict';

  const root = document.querySelector('[data-catalog-root]');
  if (!root) return;

  const cards = [...root.querySelectorAll('[data-car-card]')];
  const grid = root.querySelector('[data-catalog-grid]');
  const empty = root.querySelector('[data-empty-state]');
  const countEl = root.querySelector('[data-result-count]');
  const labelEl = root.querySelector('[data-result-label]');
  const chipsEl = root.querySelector('[data-active-filters]');
  const filterModal = root.querySelector('[data-filter-modal]');
  const filterForm = root.querySelector('[data-filter-form]');
  const pendingCount = root.querySelector('[data-pending-count]');
  const filterCount = root.querySelector('[data-filter-count]');
  const openFilters = root.querySelector('[data-open-filters]');
  const closeFilters = [...root.querySelectorAll('[data-close-filters]')];
  const applyFilters = root.querySelector('[data-apply-filters]');
  const resetFilters = [...root.querySelectorAll('[data-reset-filters]')];

  const pluralizeCars = (n) => {
    const d10 = n % 10;
    const d100 = n % 100;
    if (d10 === 1 && d100 !== 11) return 'автомобиль';
    if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return 'автомобиля';
    return 'автомобилей';
  };

  /* ---------- Swiper: popular models ---------- */
  if (window.Swiper && document.querySelector('[data-popular-swiper]')) {
    new window.Swiper('[data-popular-swiper]', {
      slidesPerView: 'auto',
      spaceBetween: 10,
      grabCursor: true,
      speed: 420,
      watchOverflow: true,
      navigation: {
        prevEl: '[data-popular-prev]',
        nextEl: '[data-popular-next]',
      },
      scrollbar: {
        el: '.popular-models__scrollbar',
        draggable: true,
        hide: false,
      },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        enabled: true,
        prevSlideMessage: 'Предыдущие модели',
        nextSlideMessage: 'Следующие модели',
      },
    });
  }

  /* ---------- Dropdowns / popovers ---------- */
  const closeCatalogPopovers = (except = null) => {
    root.querySelectorAll('.catalog-popover:not([hidden])').forEach((popover) => {
      if (popover === except) return;
      popover.hidden = true;
      const field = popover.closest('.catalog-search__field');
      const trigger = field?.querySelector('[aria-expanded="true"]');
      trigger?.setAttribute('aria-expanded', 'false');
    });
  };

  ['pickup', 'return'].forEach((kind) => {
    const trigger = root.querySelector(`[data-place-trigger="${kind}"]`);
    const popover = root.querySelector(`[data-place-popover="${kind}"]`);
    const value = root.querySelector(`[data-place-value="${kind}"]`);
    const input = root.querySelector(`[data-place-input="${kind}"]`);
    if (!trigger || !popover || !value || !input) return;

    trigger.addEventListener('click', () => {
      const opening = popover.hidden;
      closeCatalogPopovers(opening ? popover : null);
      popover.hidden = !opening;
      trigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
    });

    popover.querySelectorAll(`[data-place-option="${kind}"]`).forEach((option) => {
      option.addEventListener('click', () => {
        input.value = option.dataset.value || '';
        value.textContent = option.dataset.label || option.textContent.trim();
        popover.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        syncSearchUrl();
        trigger.focus({ preventScroll: true });
      });
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.catalog-search__field')) closeCatalogPopovers();
  });

  const refineToggle = root.querySelector('[data-refine-toggle]');
  const refinePanel = root.querySelector('[data-refine-panel]');
  if (refineToggle && refinePanel) {
    refineToggle.addEventListener('click', () => {
      refinePanel.hidden = !refinePanel.hidden;
      refineToggle.classList.toggle('is-active', !refinePanel.hidden);
      if (!refinePanel.hidden) refinePanel.querySelector('input')?.focus();
    });
  }

  /* ---------- Date range picker ---------- */
  const dateTrigger = root.querySelector('[data-date-range-trigger]');
  const datePopover = root.querySelector('[data-date-popover]');
  const monthsEl = root.querySelector('[data-calendar-months]');
  const dateValue = root.querySelector('[data-date-range-value]');
  const pickupDateInput = root.querySelector('[data-pickup-date]');
  const returnDateInput = root.querySelector('[data-return-date]');
  const calendarSummary = root.querySelector('[data-calendar-summary]');
  const calendarDone = root.querySelector('[data-calendar-done]');
  const calendarPrev = root.querySelector('[data-calendar-prev]');
  const calendarNext = root.querySelector('[data-calendar-next]');

  let monthOffset = 0;
  let rangeStart = null;
  let rangeEnd = null;

  const pad = (value) => String(value).padStart(2, '0');
  const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = dayStart(new Date());
  const ruMonth = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
  const ruShort = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

  const updateDateText = () => {
    if (rangeStart && rangeEnd) {
      const days = Math.max(1, Math.round((rangeEnd - rangeStart) / 86400000));
      dateValue.textContent = `${ruShort.format(rangeStart)} - ${ruShort.format(rangeEnd)} · ${days} дн.`;
      calendarSummary.textContent = `${ruShort.format(rangeStart)} → ${ruShort.format(rangeEnd)}, ${days} дн.`;
      pickupDateInput.value = iso(rangeStart);
      returnDateInput.value = iso(rangeEnd);
    } else if (rangeStart) {
      dateValue.textContent = `${ruShort.format(rangeStart)} → выберите возврат`;
      calendarSummary.textContent = `${ruShort.format(rangeStart)} → дата возврата`;
      pickupDateInput.value = iso(rangeStart);
      returnDateInput.value = '';
    } else {
      dateValue.textContent = 'Выберите даты';
      calendarSummary.textContent = 'Дата получения → дата возврата';
      pickupDateInput.value = '';
      returnDateInput.value = '';
    }
  };

  const isSameDay = (a, b) => a && b && iso(a) === iso(b);
  const isBetween = (date, a, b) => a && b && date > a && date < b;

  const renderCalendar = () => {
    if (!monthsEl) return;
    monthsEl.innerHTML = '';
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

    for (let m = 0; m < 2; m += 1) {
      const month = new Date(base.getFullYear(), base.getMonth() + m, 1);
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const firstWeekday = (month.getDay() + 6) % 7;
      const wrap = document.createElement('section');
      wrap.className = 'catalog-month';
      wrap.innerHTML = `<div class="catalog-month__title">${ruMonth.format(month)}</div><div class="catalog-month__weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="catalog-month__days"></div>`;
      const days = wrap.querySelector('.catalog-month__days');

      for (let i = 0; i < firstWeekday; i += 1) {
        const blank = document.createElement('span');
        blank.className = 'catalog-day catalog-day--empty';
        days.append(blank);
      }

      for (let d = 1; d <= daysInMonth; d += 1) {
        const date = new Date(month.getFullYear(), month.getMonth(), d);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'catalog-day';
        button.textContent = String(d);
        button.dataset.date = iso(date);
        button.disabled = date < today;
        if (isSameDay(date, rangeStart)) button.classList.add('is-start');
        if (isSameDay(date, rangeEnd)) button.classList.add('is-end');
        if (isBetween(date, rangeStart, rangeEnd)) button.classList.add('is-range');
        button.addEventListener('click', () => {
          if (!rangeStart || rangeEnd || date < rangeStart) {
            rangeStart = date;
            rangeEnd = null;
          } else {
            rangeEnd = date;
          }
          updateDateText();
          renderCalendar();
          syncSearchUrl();
        });
        days.append(button);
      }
      monthsEl.append(wrap);
    }
    if (calendarPrev) calendarPrev.disabled = monthOffset <= 0;
  };

  if (dateTrigger && datePopover) {
    dateTrigger.addEventListener('click', () => {
      const opening = datePopover.hidden;
      closeCatalogPopovers(opening ? datePopover : null);
      datePopover.hidden = !opening;
      dateTrigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) renderCalendar();
    });
    calendarPrev?.addEventListener('click', () => { monthOffset = Math.max(0, monthOffset - 1); renderCalendar(); });
    calendarNext?.addEventListener('click', () => { monthOffset += 1; renderCalendar(); });
    calendarDone?.addEventListener('click', () => {
      if (!rangeStart) return;
      if (!rangeEnd) rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + 1);
      updateDateText();
      renderCalendar();
      datePopover.hidden = true;
      dateTrigger.setAttribute('aria-expanded', 'false');
      syncSearchUrl();
      dateTrigger.focus({ preventScroll: true });
    });
  }

  /* ---------- Filter state ---------- */
  const readFilterForm = () => {
    const selected = (name) => [...filterForm.querySelectorAll(`[name="${name}"]:checked`)].map((el) => el.value).filter(Boolean);
    const features = selected('feature');
    return {
      types: selected('type'),
      seats: selected('seats'),
      fuels: selected('fuel'),
      brands: selected('brand'),
      priceMin: Number(filterForm.elements.price_min?.value || 0),
      priceMax: Number(filterForm.elements.price_max?.value || 0),
      year: filterForm.querySelector('[name="year"]:checked')?.value || '',
      features,
    };
  };

  let appliedState = { types: [], seats: [], fuels: [], brands: [], priceMin: 0, priceMax: 0, year: '', features: [] };
  let sortValue = 'default';

  const cardMatches = (card, state) => {
    const price = Number(card.dataset.price || 0);
    const seats = card.dataset.seats || '';
    const fuel = card.dataset.fuel || '';
    if (state.types.length && !state.types.includes(card.dataset.type)) return false;
    if (state.seats.length && !state.seats.includes(seats)) return false;
    if (state.fuels.length && !state.fuels.includes(fuel)) return false;
    if (state.brands.length && !state.brands.includes(card.dataset.brand)) return false;
    if (state.priceMin && price < state.priceMin) return false;
    if (state.priceMax && price > state.priceMax) return false;
    if (state.year && Number(card.dataset.year) < Number(state.year)) return false;
    if (state.features.includes('budget') && price > 1500) return false;
    if (state.features.includes('seven') && seats !== '7') return false;
    if (state.features.includes('electric') && fuel !== 'electric') return false;
    return true;
  };

  const resultForState = (state) => cards.filter((card) => cardMatches(card, state)).length;

  const sortCards = () => {
    const sorted = [...cards];
    const order = (card) => Number(card.dataset.order || 0);
    if (sortValue === 'price-asc') sorted.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    else if (sortValue === 'price-desc') sorted.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    else if (sortValue === 'seats-desc') sorted.sort((a, b) => Number(b.dataset.seats) - Number(a.dataset.seats) || order(a) - order(b));
    else sorted.sort((a, b) => order(a) - order(b));
    sorted.forEach((card) => grid.append(card));
  };

  const countActiveFilters = (state) => {
    let n = state.types.length + state.seats.length + state.fuels.length + state.brands.length + state.features.length;
    if (state.priceMin) n += 1;
    if (state.priceMax) n += 1;
    if (state.year) n += 1;
    return n;
  };

  const filterLabels = {
    compact: 'Компактные', sedan: 'Седаны', crossover: 'Кроссоверы', suv: 'Внедорожники', minivan: 'Минивэны', electric: 'Электро',
    '5': '5 мест', '7': '7 мест', petrol: 'Бензин', diesel: 'Дизель', toyota: 'Toyota', honda: 'Honda', mitsubishi: 'Mitsubishi', byd: 'BYD',
    budget: 'До 1 500 ฿', seven: '7 мест',
  };

  const syncModalToState = (state) => {
    filterForm.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach((input) => { input.checked = false; });
    ['type', 'seats', 'fuel', 'brand', 'feature'].forEach((name) => {
      const values = name === 'type' ? state.types : name === 'seats' ? state.seats : name === 'fuel' ? state.fuels : name === 'brand' ? state.brands : state.features;
      values.forEach((value) => {
        const input = filterForm.querySelector(`[name="${name}"][value="${CSS.escape(value)}"]`);
        if (input) input.checked = true;
      });
    });
    filterForm.elements.price_min.value = state.priceMin || '';
    filterForm.elements.price_max.value = state.priceMax || '';
    const year = filterForm.querySelector(`[name="year"][value="${CSS.escape(state.year || '')}"]`);
    if (year) year.checked = true;
  };

  const updatePending = () => {
    const pending = readFilterForm();
    const amount = resultForState(pending);
    pendingCount.textContent = String(amount);
    applyFilters.disabled = amount === 0;
  };

  const renderChips = () => {
    chipsEl.innerHTML = '';
    const chips = [];
    appliedState.types.forEach((v) => chips.push(['types', v, filterLabels[v] || v]));
    appliedState.seats.forEach((v) => chips.push(['seats', v, filterLabels[v] || v]));
    appliedState.fuels.forEach((v) => chips.push(['fuels', v, filterLabels[v] || v]));
    appliedState.brands.forEach((v) => chips.push(['brands', v, filterLabels[v] || v]));
    appliedState.features.forEach((v) => chips.push(['features', v, filterLabels[v] || v]));
    if (appliedState.priceMin) chips.push(['priceMin', String(appliedState.priceMin), `от ${appliedState.priceMin} ฿`]);
    if (appliedState.priceMax) chips.push(['priceMax', String(appliedState.priceMax), `до ${appliedState.priceMax} ฿`]);
    if (appliedState.year) chips.push(['year', appliedState.year, `${appliedState.year}+`]);

    chips.forEach(([key, value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'catalog-chip';
      button.dataset.removeFilterKey = key;
      button.dataset.removeFilterValue = value;
      button.innerHTML = `<span>${label}</span><span aria-hidden="true">×</span>`;
      button.setAttribute('aria-label', `Убрать фильтр ${label}`);
      chipsEl.append(button);
    });
    chipsEl.hidden = chips.length === 0;
    const total = countActiveFilters(appliedState);
    filterCount.textContent = String(total);
    filterCount.hidden = total === 0;

    root.querySelectorAll('[data-facet]').forEach((button) => {
      const facet = button.dataset.facet;
      const active = facet === 'budget' ? appliedState.features.includes('budget')
        : facet === 'seven' ? appliedState.features.includes('seven')
          : facet === 'electric' ? appliedState.features.includes('electric')
            : facet === 'crossover' ? appliedState.types.includes('crossover')
              : facet === 'toyota' ? appliedState.brands.includes('toyota')
                : facet === 'year' ? appliedState.year === '2024' : false;
      button.classList.toggle('is-active', active);
    });
  };

  const syncFilterUrl = () => {
    const url = new URL(window.location.href);
    ['type', 'seats', 'fuel', 'brand', 'price_min', 'price_max', 'year', 'feature', 'sort'].forEach((key) => url.searchParams.delete(key));
    appliedState.types.forEach((v) => url.searchParams.append('type', v));
    appliedState.seats.forEach((v) => url.searchParams.append('seats', v));
    appliedState.fuels.forEach((v) => url.searchParams.append('fuel', v));
    appliedState.brands.forEach((v) => url.searchParams.append('brand', v));
    appliedState.features.forEach((v) => url.searchParams.append('feature', v));
    if (appliedState.priceMin) url.searchParams.set('price_min', appliedState.priceMin);
    if (appliedState.priceMax) url.searchParams.set('price_max', appliedState.priceMax);
    if (appliedState.year) url.searchParams.set('year', appliedState.year);
    if (sortValue !== 'default') url.searchParams.set('sort', sortValue);
    window.history.replaceState({}, '', url);
  };

  const applyCatalog = ({ syncUrl = true } = {}) => {
    sortCards();
    let visible = 0;
    cards.forEach((card) => {
      const show = cardMatches(card, appliedState);
      card.hidden = !show;
      if (show) visible += 1;
    });
    countEl.textContent = String(visible);
    labelEl.textContent = pluralizeCars(visible);
    grid.hidden = visible === 0;
    empty.hidden = visible !== 0;
    renderChips();
    if (syncUrl) syncFilterUrl();
    document.dispatchEvent(new CustomEvent('mocar:catalog:filter_change', { detail: { ...appliedState, results: visible } }));
  };

  const openFilterModal = () => {
    syncModalToState(appliedState);
    updatePending();
    filterModal.hidden = false;
    document.body.classList.add('catalog-overlay-open');
    filterModal.querySelector('.catalog-filter-modal__close')?.focus({ preventScroll: true });
  };
  const closeFilterModal = () => {
    filterModal.hidden = true;
    document.body.classList.remove('catalog-overlay-open');
    openFilters?.focus({ preventScroll: true });
  };

  openFilters?.addEventListener('click', openFilterModal);
  closeFilters.forEach((button) => button.addEventListener('click', closeFilterModal));
  filterForm?.addEventListener('input', updatePending);
  filterForm?.addEventListener('change', updatePending);
  applyFilters?.addEventListener('click', () => {
    appliedState = readFilterForm();
    applyCatalog();
    closeFilterModal();
  });

  resetFilters.forEach((button) => button.addEventListener('click', () => {
    appliedState = { types: [], seats: [], fuels: [], brands: [], priceMin: 0, priceMax: 0, year: '', features: [] };
    syncModalToState(appliedState);
    updatePending();
    applyCatalog();
  }));

  chipsEl?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-filter-key]');
    if (!button) return;
    const key = button.dataset.removeFilterKey;
    const value = button.dataset.removeFilterValue;
    if (['types', 'seats', 'fuels', 'brands', 'features'].includes(key)) appliedState[key] = appliedState[key].filter((v) => v !== value);
    else if (key === 'priceMin') appliedState.priceMin = 0;
    else if (key === 'priceMax') appliedState.priceMax = 0;
    else if (key === 'year') appliedState.year = '';
    applyCatalog();
  });

  root.querySelectorAll('[data-facet]').forEach((button) => button.addEventListener('click', () => {
    const facet = button.dataset.facet;
    const toggleValue = (array, value) => array.includes(value) ? array.filter((v) => v !== value) : [...array, value];
    if (facet === 'budget') appliedState.features = toggleValue(appliedState.features, 'budget');
    if (facet === 'seven') appliedState.features = toggleValue(appliedState.features, 'seven');
    if (facet === 'electric') appliedState.features = toggleValue(appliedState.features, 'electric');
    if (facet === 'crossover') appliedState.types = toggleValue(appliedState.types, 'crossover');
    if (facet === 'toyota') appliedState.brands = toggleValue(appliedState.brands, 'toyota');
    if (facet === 'year') appliedState.year = appliedState.year === '2024' ? '' : '2024';
    applyCatalog();
  }));

  /* ---------- Sort ---------- */
  const sortRoot = root.querySelector('[data-sort-root]');
  const sortTrigger = root.querySelector('[data-sort-trigger]');
  const sortMenu = root.querySelector('[data-sort-menu]');
  const sortLabel = root.querySelector('[data-sort-label]');
  if (sortTrigger && sortMenu) {
    sortTrigger.addEventListener('click', () => {
      const opening = sortMenu.hidden;
      sortMenu.hidden = !opening;
      sortTrigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
    });
    sortMenu.querySelectorAll('[data-sort-option]').forEach((button) => button.addEventListener('click', () => {
      sortValue = button.dataset.sortOption || 'default';
      sortLabel.textContent = button.textContent.trim();
      sortMenu.querySelectorAll('[data-sort-option]').forEach((option) => option.setAttribute('aria-selected', option === button ? 'true' : 'false'));
      sortMenu.hidden = true;
      sortTrigger.setAttribute('aria-expanded', 'false');
      applyCatalog();
    }));
    document.addEventListener('pointerdown', (event) => {
      if (!sortRoot.contains(event.target)) {
        sortMenu.hidden = true;
        sortTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Search query URL ---------- */
  function syncSearchUrl() {
    const url = new URL(window.location.href);
    const pickup = root.querySelector('[data-place-input="pickup"]')?.value || '';
    const ret = root.querySelector('[data-place-input="return"]')?.value || '';
    const address = root.querySelector('#catalog-address')?.value.trim() || '';
    ['pickup', 'return', 'pickup_date', 'return_date', 'address'].forEach((key) => url.searchParams.delete(key));
    if (pickup) url.searchParams.set('pickup', pickup);
    if (ret) url.searchParams.set('return', ret);
    if (pickupDateInput?.value) url.searchParams.set('pickup_date', pickupDateInput.value);
    if (returnDateInput?.value) url.searchParams.set('return_date', returnDateInput.value);
    if (address) url.searchParams.set('address', address);
    window.history.replaceState({}, '', url);
  }

  root.querySelector('[data-search-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    syncSearchUrl();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  root.querySelector('#catalog-address')?.addEventListener('change', syncSearchUrl);

  /* ---------- Load state from URL ---------- */
  const params = new URLSearchParams(window.location.search);
  const multi = (key) => params.getAll(key).filter(Boolean);
  appliedState = {
    types: multi('type'),
    seats: multi('seats'),
    fuels: multi('fuel'),
    brands: multi('brand'),
    priceMin: Number(params.get('price_min') || 0),
    priceMax: Number(params.get('price_max') || 0),
    year: params.get('year') || '',
    features: multi('feature'),
  };
  sortValue = params.get('sort') || 'default';
  const sortOption = sortMenu?.querySelector(`[data-sort-option="${CSS.escape(sortValue)}"]`);
  if (sortOption) {
    sortLabel.textContent = sortOption.textContent.trim();
    sortMenu.querySelectorAll('[data-sort-option]').forEach((option) => option.setAttribute('aria-selected', option === sortOption ? 'true' : 'false'));
  }

  const pickupParam = params.get('pickup');
  const returnParam = params.get('return');
  if (pickupParam) {
    const option = root.querySelector(`[data-place-option="pickup"][data-value="${CSS.escape(pickupParam)}"]`);
    if (option) { root.querySelector('[data-place-input="pickup"]').value = pickupParam; root.querySelector('[data-place-value="pickup"]').textContent = option.dataset.label; }
  }
  if (returnParam) {
    const option = root.querySelector(`[data-place-option="return"][data-value="${CSS.escape(returnParam)}"]`);
    if (option) { root.querySelector('[data-place-input="return"]').value = returnParam; root.querySelector('[data-place-value="return"]').textContent = option.dataset.label; }
  }
  const pickupParamDate = params.get('pickup_date');
  const returnParamDate = params.get('return_date');
  if (pickupParamDate) {
    const [y,m,d] = pickupParamDate.split('-').map(Number);
    rangeStart = new Date(y, m - 1, d);
  }
  if (returnParamDate) {
    const [y,m,d] = returnParamDate.split('-').map(Number);
    rangeEnd = new Date(y, m - 1, d);
  }
  const addressParam = params.get('address');
  if (addressParam && root.querySelector('#catalog-address')) {
    root.querySelector('#catalog-address').value = addressParam;
    refinePanel.hidden = false;
  }

  updateDateText();
  applyCatalog({ syncUrl: false });

  /* ---------- Escape ---------- */
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeCatalogPopovers();
    if (!filterModal.hidden) closeFilterModal();
    if (sortMenu && !sortMenu.hidden) {
      sortMenu.hidden = true;
      sortTrigger?.setAttribute('aria-expanded', 'false');
    }
  });
})();
