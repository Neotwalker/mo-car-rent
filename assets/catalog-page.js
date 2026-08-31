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
  const refinePickupSummary = root.querySelector('[data-refine-pickup-summary]');
  const refineReturnSummary = root.querySelector('[data-refine-return-summary]');
  const refineResultCount = root.querySelector('[data-refine-result-count]');
  const refineReturnSame = root.querySelector('[data-return-same]');
  const refineDelivery = root.querySelector('[data-location-delivery]');
  const refineAddressWrap = root.querySelector('[data-location-address]');
  const refineOptions = root.querySelector('[data-location-options]');
  let refineTarget = 'pickup';

  function updateRefineSummary() {
    const pickupText = root.querySelector('[data-place-value="pickup"]')?.textContent.trim() || 'По всему Пхукету';
    const returnText = refineReturnSame?.checked ? 'Там же' : (root.querySelector('[data-place-value="return"]')?.textContent.trim() || 'Там же');
    const pickupDateText = rangeStart ? ruShort.format(rangeStart) : 'даты не выбраны';
    const returnDateText = rangeEnd ? ruShort.format(rangeEnd) : 'даты не выбраны';
    if (refinePickupSummary) refinePickupSummary.textContent = `${pickupText}, ${pickupDateText}`;
    if (refineReturnSummary) refineReturnSummary.textContent = `${returnText}, ${returnDateText}`;
    const returnChoice = root.querySelector('[data-location-mode-trigger="return"] span:first-child');
    if (returnChoice) returnChoice.textContent = returnText;
    if (refineResultCount && typeof resultForState === 'function') refineResultCount.textContent = String(resultForState(appliedState));
  }

  const closeRefinePanel = () => {
    if (!refinePanel || refinePanel.hidden) return;
    refinePanel.hidden = true;
    refineToggle?.setAttribute('aria-expanded', 'false');
    refineToggle?.classList.remove('is-active');
    if (refineOptions) refineOptions.hidden = true;
  };

  if (refineToggle && refinePanel) {
    refineToggle.addEventListener('click', () => {
      const opening = refinePanel.hidden;
      refinePanel.hidden = !opening;
      refineToggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
      refineToggle.classList.toggle('is-active', opening);
      if (opening) updateRefineSummary();
    });

    root.querySelectorAll('[data-location-mode-trigger]').forEach((button) => button.addEventListener('click', () => {
      refineTarget = button.dataset.locationModeTrigger || 'pickup';
      if (refineOptions) refineOptions.hidden = false;
    }));

    refineReturnSame?.addEventListener('change', () => {
      const returnTrigger = root.querySelector('[data-location-mode-trigger="return"]');
      if (returnTrigger) returnTrigger.disabled = refineReturnSame.checked;
      if (refineReturnSame.checked) {
        const returnInput = root.querySelector('[data-place-input="return"]');
        const returnValue = root.querySelector('[data-place-value="return"]');
        if (returnInput) returnInput.value = 'same';
        if (returnValue) returnValue.textContent = 'Там же';
      }
      updateRefineSummary();
      syncSearchUrl();
    });

    refineDelivery?.addEventListener('change', () => {
      if (refineAddressWrap) refineAddressWrap.hidden = !refineDelivery.checked;
      if (refineDelivery.checked) {
        const input = root.querySelector(`[data-place-input="${refineTarget}"]`);
        const value = root.querySelector(`[data-place-value="${refineTarget}"]`);
        if (input) input.value = 'address';
        if (value) value.textContent = 'Доставка по адресу';
      }
      updateRefineSummary();
      syncSearchUrl();
    });

    root.querySelector('[data-location-options-reset]')?.addEventListener('click', () => {
      if (refineDelivery) refineDelivery.checked = false;
      if (refineAddressWrap) refineAddressWrap.hidden = true;
      if (refineOptions) refineOptions.hidden = true;
    });

    root.querySelector('[data-refine-reset]')?.addEventListener('click', () => {
      const pickupInput = root.querySelector('[data-place-input="pickup"]');
      const pickupValue = root.querySelector('[data-place-value="pickup"]');
      const returnInput = root.querySelector('[data-place-input="return"]');
      const returnValue = root.querySelector('[data-place-value="return"]');
      if (pickupInput) pickupInput.value = 'all';
      if (pickupValue) pickupValue.textContent = 'По всему Пхукету';
      if (returnInput) returnInput.value = 'same';
      if (returnValue) returnValue.textContent = 'Там же';
      if (refineReturnSame) refineReturnSame.checked = true;
      if (refineDelivery) refineDelivery.checked = false;
      if (refineAddressWrap) refineAddressWrap.hidden = true;
      const address = root.querySelector('#catalog-address');
      if (address) address.value = '';
      updateRefineSummary();
      syncSearchUrl();
    });

    root.querySelector('[data-refine-apply]')?.addEventListener('click', () => {
      syncSearchUrl();
      closeRefinePanel();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('.catalog-search__refine-wrap')) closeRefinePanel();
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
      updateRefineSummary();
    });
  }

  /* ---------- Custom selects inside filter modal ---------- */
  const enhancedSelects = [...filterForm.querySelectorAll('[data-filter-select]')];
  const filterSelectRegistry = new Map();

  const positionFilterMenu = (wrap) => {
    const record = filterSelectRegistry.get(wrap);
    if (!record || record.menu.hidden) return;
    const { trigger, menu } = record;
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    menu.style.width = `${Math.max(120, rect.width)}px`;
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8))}px`;
    menu.style.top = `${rect.bottom + gap}px`;
    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      const roomBelow = window.innerHeight - rect.bottom - gap - 8;
      const roomAbove = rect.top - gap - 8;
      if (menuRect.height > roomBelow && roomAbove > roomBelow) {
        menu.style.top = `${Math.max(8, rect.top - menuRect.height - gap)}px`;
      }
    });
  };

  const closeFilterSelects = (except = null) => {
    filterSelectRegistry.forEach((record, wrap) => {
      if (wrap === except) return;
      wrap.classList.remove('is-open');
      record.menu.hidden = true;
      record.trigger.setAttribute('aria-expanded', 'false');
    });
  };

  const enhanceFilterSelect = (select, index) => {
    select.classList.add('filter-select-native', 'is-enhanced');
    const wrap = document.createElement('div');
    wrap.className = 'filter-custom-select';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'filter-custom-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', select.getAttribute('aria-label') || 'Выберите значение');
    trigger.innerHTML = `<span></span><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5.5 7.5 4.5 4.5 4.5-4.5"></path></svg>`;
    const menu = document.createElement('div');
    const menuId = `filter-select-menu-${index}`;
    menu.id = menuId;
    menu.className = 'filter-custom-select__menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    trigger.setAttribute('aria-controls', menuId);

    [...select.options].forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-custom-select__option';
      button.dataset.value = option.value;
      button.setAttribute('role', 'option');
      button.textContent = option.textContent;
      button.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        wrap.classList.remove('is-open');
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus({ preventScroll: true });
      });
      menu.append(button);
    });

    select.after(wrap);
    wrap.append(trigger);
    document.body.append(menu);
    filterSelectRegistry.set(wrap, { trigger, menu, select });

    const sync = () => {
      const selected = select.options[select.selectedIndex] || select.options[0];
      trigger.querySelector('span').textContent = selected?.textContent || '';
      menu.querySelectorAll('.filter-custom-select__option').forEach((option) => {
        const active = option.dataset.value === select.value;
        option.classList.toggle('is-selected', active);
        option.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };
    select._syncCustomSelect = sync;
    sync();

    trigger.addEventListener('click', () => {
      const opening = menu.hidden;
      closeFilterSelects(opening ? wrap : null);
      wrap.classList.toggle('is-open', opening);
      menu.hidden = !opening;
      trigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) {
        positionFilterMenu(wrap);
        requestAnimationFrame(() => menu.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' }));
      }
    });

    trigger.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (menu.hidden) trigger.click();
      const options = [...menu.querySelectorAll('.filter-custom-select__option')];
      let current = options.findIndex((option) => option.classList.contains('is-selected'));
      if (event.key === 'Home') current = 0;
      else if (event.key === 'End') current = options.length - 1;
      else if (event.key === 'ArrowDown') current = Math.min(options.length - 1, current + 1);
      else current = Math.max(0, current - 1);
      options[current]?.focus();
    });

    menu.addEventListener('keydown', (event) => {
      const options = [...menu.querySelectorAll('.filter-custom-select__option')];
      const current = options.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        wrap.classList.remove('is-open'); menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); trigger.focus();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = event.key === 'ArrowDown' ? Math.min(options.length - 1, current + 1) : Math.max(0, current - 1);
        options[next]?.focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); document.activeElement?.click();
      }
    });
  };

  enhancedSelects.forEach(enhanceFilterSelect);
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.filter-custom-select') && !event.target.closest('.filter-custom-select__menu')) closeFilterSelects();
  });
  const repositionOpenFilterMenus = () => filterSelectRegistry.forEach((record, wrap) => { if (!record.menu.hidden) positionFilterMenu(wrap); });
  filterForm.addEventListener('scroll', repositionOpenFilterMenus, { passive: true });
  window.addEventListener('resize', repositionOpenFilterMenus, { passive: true });
  const syncEnhancedSelects = () => enhancedSelects.forEach((select) => select._syncCustomSelect?.());

  /* ---------- Filter state ---------- */
  const readFilterForm = () => {
    const selected = (name) => [...filterForm.querySelectorAll(`[name="${name}"]:checked`)].map((el) => el.value).filter(Boolean);
    const singleArray = (name) => {
      const value = filterForm.elements[name]?.value || '';
      return value ? [value] : [];
    };
    return {
      types: selected('type'),
      seats: singleArray('seats'),
      fuels: selected('fuel'),
      transmissions: selected('transmission'),
      drives: selected('drive'),
      brands: singleArray('brand'),
      priceMin: Number(filterForm.elements.price_min?.value || 0),
      priceMax: Number(filterForm.elements.price_max?.value || 0),
      engineMin: Number(filterForm.elements.engine_min?.value || 0),
      engineMax: Number(filterForm.elements.engine_max?.value || 0),
      consumptionMin: Number(filterForm.elements.consumption_min?.value || 0),
      consumptionMax: Number(filterForm.elements.consumption_max?.value || 0),
      year: filterForm.elements.year?.value || '',
    };
  };

  let appliedState = { types: [], seats: [], fuels: [], transmissions: [], drives: [], brands: [], priceMin: 0, priceMax: 0, engineMin: 0, engineMax: 0, consumptionMin: 0, consumptionMax: 0, year: '' };
  let sortValue = 'default';

  const cardMatches = (card, state) => {
    const price = Number(card.dataset.price || 0);
    const seats = card.dataset.seats || '';
    const fuel = card.dataset.fuel || '';
    const transmission = card.dataset.transmission || '';
    const drive = card.dataset.drive || '';
    const engine = Number(card.dataset.engine || 0);
    const consumption = Number(card.dataset.consumption || 0);
    if (state.types.length && !state.types.includes(card.dataset.type)) return false;
    if (state.seats.length && !state.seats.includes(seats)) return false;
    if (state.fuels.length && !state.fuels.includes(fuel)) return false;
    if (state.transmissions.length && !state.transmissions.includes(transmission)) return false;
    if (state.drives.length && !state.drives.includes(drive)) return false;
    if (state.brands.length && !state.brands.includes(card.dataset.brand)) return false;
    if (state.priceMin && price < state.priceMin) return false;
    if (state.priceMax && price > state.priceMax) return false;
    if (state.engineMin && engine < state.engineMin) return false;
    if (state.engineMax && engine > state.engineMax) return false;
    if (state.consumptionMin && consumption < state.consumptionMin) return false;
    if (state.consumptionMax && consumption > state.consumptionMax) return false;
    if (state.year && Number(card.dataset.year) < Number(state.year)) return false;
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
    let n = state.types.length + state.seats.length + state.fuels.length + state.transmissions.length + state.drives.length + state.brands.length;
    ['priceMin','priceMax','engineMin','engineMax','consumptionMin','consumptionMax'].forEach((key) => { if (state[key]) n += 1; });
    if (state.year) n += 1;
    return n;
  };

  const filterLabels = {
    compact: 'Компактные', sedan: 'Средний класс', crossover: 'Кроссоверы', luxury: 'Люкс', cabriolet: 'Кабриолеты', minivan: 'Минивэны',
    '5': '5 мест', '7': '7 мест', petrol: 'Бензин', diesel: 'Дизель', electric: 'Электро', automatic: 'Автомат', manual: 'Механика', cvt: 'Вариатор', front: 'Передний привод', awd: 'Полный привод', rear: 'Задний привод', toyota: 'Toyota', honda: 'Honda', mitsubishi: 'Mitsubishi', byd: 'BYD',
  };

  const syncModalToState = (state) => {
    filterForm.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach((input) => { input.checked = false; });
    const checkboxGroups = { type: state.types, fuel: state.fuels, transmission: state.transmissions, drive: state.drives };
    Object.entries(checkboxGroups).forEach(([name, values]) => {
      values.forEach((value) => {
        const input = filterForm.querySelector(`[name="${name}"][value="${CSS.escape(value)}"]`);
        if (input) input.checked = true;
      });
    });
    filterForm.elements.seats.value = state.seats[0] || '';
    filterForm.elements.brand.value = state.brands[0] || '';
    filterForm.elements.price_min.value = state.priceMin || '';
    filterForm.elements.price_max.value = state.priceMax || '';
    filterForm.elements.engine_min.value = state.engineMin || '';
    filterForm.elements.engine_max.value = state.engineMax || '';
    filterForm.elements.consumption_min.value = state.consumptionMin || '';
    filterForm.elements.consumption_max.value = state.consumptionMax || '';
    filterForm.elements.year.value = state.year || '';
    syncEnhancedSelects();
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
    appliedState.transmissions.forEach((v) => chips.push(['transmissions', v, filterLabels[v] || v]));
    appliedState.drives.forEach((v) => chips.push(['drives', v, filterLabels[v] || v]));
    appliedState.brands.forEach((v) => chips.push(['brands', v, filterLabels[v] || v]));
    if (appliedState.priceMin) chips.push(['priceMin', String(appliedState.priceMin), `от ${appliedState.priceMin} ฿`]);
    if (appliedState.priceMax) chips.push(['priceMax', String(appliedState.priceMax), `до ${appliedState.priceMax} ฿`]);
    if (appliedState.engineMin) chips.push(['engineMin', String(appliedState.engineMin), `двигатель от ${appliedState.engineMin} л`]);
    if (appliedState.engineMax) chips.push(['engineMax', String(appliedState.engineMax), `двигатель до ${appliedState.engineMax} л`]);
    if (appliedState.consumptionMin) chips.push(['consumptionMin', String(appliedState.consumptionMin), `расход от ${appliedState.consumptionMin}`]);
    if (appliedState.consumptionMax) chips.push(['consumptionMax', String(appliedState.consumptionMax), `расход до ${appliedState.consumptionMax}`]);
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
    if (chips.length) {
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'catalog-chip catalog-chip--reset';
      reset.dataset.resetActiveFilters = '';
      reset.textContent = 'Сбросить';
      chipsEl.append(reset);
    }
    chipsEl.hidden = chips.length === 0;
    const total = countActiveFilters(appliedState);
    filterCount.textContent = String(total);
    filterCount.hidden = total === 0;

  };

  const syncFilterUrl = () => {
    const url = new URL(window.location.href);
    ['type', 'seats', 'fuel', 'transmission', 'drive', 'brand', 'price_min', 'price_max', 'engine_min', 'engine_max', 'consumption_min', 'consumption_max', 'year', 'sort'].forEach((key) => url.searchParams.delete(key));
    appliedState.types.forEach((v) => url.searchParams.append('type', v));
    appliedState.seats.forEach((v) => url.searchParams.append('seats', v));
    appliedState.fuels.forEach((v) => url.searchParams.append('fuel', v));
    appliedState.transmissions.forEach((v) => url.searchParams.append('transmission', v));
    appliedState.drives.forEach((v) => url.searchParams.append('drive', v));
    appliedState.brands.forEach((v) => url.searchParams.append('brand', v));
    if (appliedState.priceMin) url.searchParams.set('price_min', appliedState.priceMin);
    if (appliedState.priceMax) url.searchParams.set('price_max', appliedState.priceMax);
    if (appliedState.engineMin) url.searchParams.set('engine_min', appliedState.engineMin);
    if (appliedState.engineMax) url.searchParams.set('engine_max', appliedState.engineMax);
    if (appliedState.consumptionMin) url.searchParams.set('consumption_min', appliedState.consumptionMin);
    if (appliedState.consumptionMax) url.searchParams.set('consumption_max', appliedState.consumptionMax);
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
    updateRefineSummary();
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
    closeFilterSelects();
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
    appliedState = { types: [], seats: [], fuels: [], transmissions: [], drives: [], brands: [], priceMin: 0, priceMax: 0, engineMin: 0, engineMax: 0, consumptionMin: 0, consumptionMax: 0, year: '' };
    syncModalToState(appliedState);
    updatePending();
    applyCatalog();
  }));

  chipsEl?.addEventListener('click', (event) => {
    if (event.target.closest('[data-reset-active-filters]')) {
      appliedState = { types: [], seats: [], fuels: [], transmissions: [], drives: [], brands: [], priceMin: 0, priceMax: 0, engineMin: 0, engineMax: 0, consumptionMin: 0, consumptionMax: 0, year: '' };
      syncModalToState(appliedState);
      updatePending();
      applyCatalog();
      return;
    }
    const button = event.target.closest('[data-remove-filter-key]');
    if (!button) return;
    const key = button.dataset.removeFilterKey;
    const value = button.dataset.removeFilterValue;
    if (['types', 'seats', 'fuels', 'transmissions', 'drives', 'brands'].includes(key)) appliedState[key] = appliedState[key].filter((v) => v !== value);
    else if (key === 'priceMin') appliedState.priceMin = 0;
    else if (key === 'priceMax') appliedState.priceMax = 0;
    else if (key === 'engineMin') appliedState.engineMin = 0;
    else if (key === 'engineMax') appliedState.engineMax = 0;
    else if (key === 'consumptionMin') appliedState.consumptionMin = 0;
    else if (key === 'consumptionMax') appliedState.consumptionMax = 0;
    else if (key === 'year') appliedState.year = '';
    applyCatalog();
  });


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
    seats: multi('seats').slice(0, 1),
    fuels: multi('fuel'),
    transmissions: multi('transmission'),
    drives: multi('drive'),
    brands: multi('brand').slice(0, 1),
    priceMin: Number(params.get('price_min') || 0),
    priceMax: Number(params.get('price_max') || 0),
    engineMin: Number(params.get('engine_min') || 0),
    engineMax: Number(params.get('engine_max') || 0),
    consumptionMin: Number(params.get('consumption_min') || 0),
    consumptionMax: Number(params.get('consumption_max') || 0),
    year: params.get('year') || '',
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
    if (refinePanel) { refinePanel.hidden = false; refineToggle?.setAttribute('aria-expanded', 'true'); }
  }

  updateDateText();
  applyCatalog({ syncUrl: false });

  /* ---------- Escape ---------- */
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeCatalogPopovers();
    closeRefinePanel();
    if (!filterModal.hidden) closeFilterModal();
    if (sortMenu && !sortMenu.hidden) {
      sortMenu.hidden = true;
      sortTrigger?.setAttribute('aria-expanded', 'false');
    }
  });
})();
