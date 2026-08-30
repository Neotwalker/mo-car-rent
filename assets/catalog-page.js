(() => {
  'use strict';

  const root = document.querySelector('[data-catalog-root]');
  if (!root) return;

  const form = root.querySelector('[data-filter-form]');
  const grid = root.querySelector('[data-catalog-grid]');
  const cards = [...root.querySelectorAll('[data-car-card]')];
  const count = root.querySelector('[data-result-count]');
  const label = root.querySelector('[data-result-label]');
  const chips = root.querySelector('[data-active-filters]');
  const empty = root.querySelector('[data-empty-state]');
  const toggle = root.querySelector('[data-filter-toggle]');
  const filterCount = root.querySelector('[data-filter-count]');
  const sort = root.querySelector('[data-sort]');
  const resetButtons = [...root.querySelectorAll('[data-reset-filters]')];
  const filterControls = [...root.querySelectorAll('[data-filter]')];

  if (!form || !grid || !count || !label || !chips || !empty || !sort) return;

  const fields = Object.fromEntries(filterControls.map((control) => [control.dataset.filter, control]));
  const filterLabels = {
    type: 'Тип',
    seats: 'Места',
    fuel: 'Топливо',
    price: 'Цена до',
  };

  const pluralizeCars = (value) => {
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return 'автомобиль';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'автомобиля';
    return 'автомобилей';
  };

  const getState = () => ({
    type: fields.type?.value || '',
    seats: fields.seats?.value || '',
    fuel: fields.fuel?.value || '',
    price: fields.price?.value || '',
    sort: sort.value || 'default',
  });

  const matches = (card, state) => {
    if (state.type && card.dataset.type !== state.type) return false;
    if (state.seats && card.dataset.seats !== state.seats) return false;
    if (state.fuel && card.dataset.fuel !== state.fuel) return false;
    if (state.price && Number(card.dataset.price) > Number(state.price)) return false;
    return true;
  };

  const sortCards = (state) => {
    const sorted = [...cards];
    const byNumber = (key) => (a, b) => Number(a.dataset[key]) - Number(b.dataset[key]);

    if (state.sort === 'price-asc') sorted.sort(byNumber('price'));
    else if (state.sort === 'price-desc') sorted.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    else if (state.sort === 'seats-desc') sorted.sort((a, b) => Number(b.dataset.seats) - Number(a.dataset.seats) || Number(a.dataset.order) - Number(b.dataset.order));
    else sorted.sort(byNumber('order'));

    sorted.forEach((card) => grid.append(card));
  };

  const optionText = (control) => control?.selectedOptions?.[0]?.textContent?.trim() || '';

  const renderChips = (state) => {
    chips.replaceChildren();
    const activeKeys = ['type', 'seats', 'fuel', 'price'].filter((key) => state[key]);

    activeKeys.forEach((key) => {
      const control = fields[key];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'catalog-chip';
      button.dataset.removeFilter = key;
      button.innerHTML = `<span>${filterLabels[key]}: ${optionText(control)}</span><span aria-hidden="true">×</span>`;
      button.setAttribute('aria-label', `Убрать фильтр: ${filterLabels[key]} ${optionText(control)}`);
      chips.append(button);
    });

    chips.hidden = activeKeys.length === 0;
    if (filterCount) {
      filterCount.textContent = String(activeKeys.length);
      filterCount.hidden = activeKeys.length === 0;
    }

    const hasAnyState = activeKeys.length > 0 || state.sort !== 'default';
    resetButtons.forEach((button) => {
      if (button.closest('.catalog-empty')) return;
      button.disabled = !hasAnyState;
    });
  };

  const syncUrl = (state) => {
    const url = new URL(window.location.href);
    ['type', 'seats', 'fuel', 'max_price', 'sort'].forEach((key) => url.searchParams.delete(key));

    if (state.type) url.searchParams.set('type', state.type);
    if (state.seats) url.searchParams.set('seats', state.seats);
    if (state.fuel) url.searchParams.set('fuel', state.fuel);
    if (state.price) url.searchParams.set('max_price', state.price);
    if (state.sort !== 'default') url.searchParams.set('sort', state.sort);

    window.history.replaceState({}, '', url);
  };

  const apply = ({ updateUrl = true } = {}) => {
    const state = getState();
    sortCards(state);

    let visible = 0;
    cards.forEach((card) => {
      const show = matches(card, state);
      card.hidden = !show;
      if (show) visible += 1;
    });

    count.textContent = String(visible);
    label.textContent = pluralizeCars(visible);
    grid.hidden = visible === 0;
    empty.hidden = visible !== 0;
    renderChips(state);
    if (updateUrl) syncUrl(state);

    document.dispatchEvent(new CustomEvent('mocar:catalog:filter_change', { detail: { ...state, results: visible } }));
  };

  const reset = () => {
    filterControls.forEach((control) => { control.value = ''; });
    sort.value = 'default';
    apply();
  };

  const loadFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const mapping = {
      type: params.get('type') || '',
      seats: params.get('seats') || '',
      fuel: params.get('fuel') || '',
      price: params.get('max_price') || '',
    };

    Object.entries(mapping).forEach(([key, value]) => {
      const control = fields[key];
      if (control && [...control.options].some((option) => option.value === value)) control.value = value;
    });

    const sortValue = params.get('sort') || 'default';
    if ([...sort.options].some((option) => option.value === sortValue)) sort.value = sortValue;
  };

  form.addEventListener('change', apply);

  chips.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-filter]');
    if (!button) return;
    const control = fields[button.dataset.removeFilter];
    if (!control) return;
    control.value = '';
    apply();
    control.focus({ preventScroll: true });
  });

  resetButtons.forEach((button) => button.addEventListener('click', reset));

  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = !form.classList.contains('is-open');
      form.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
      if (!event.matches) return;
      form.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  loadFromUrl();
  apply({ updateUrl: false });
})();
