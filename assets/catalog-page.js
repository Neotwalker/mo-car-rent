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

  const selectInstances = new Map();

  const initCatalogSelect = (selectRoot) => {
    const nativeSelect = selectRoot.querySelector('select');
    if (!nativeSelect) return null;

    const ui = document.createElement('div');
    ui.className = 'catalog-select__ui';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'catalog-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const triggerText = document.createElement('span');
    triggerText.className = 'catalog-select__trigger-text';

    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', 'catalog-select__chevron');
    chevron.setAttribute('viewBox', '0 0 20 20');
    chevron.setAttribute('aria-hidden', 'true');
    const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    chevronPath.setAttribute('d', 'm5.5 7.5 4.5 4.5 4.5-4.5');
    chevron.append(chevronPath);
    trigger.append(triggerText, chevron);

    const list = document.createElement('ul');
    const listId = `${nativeSelect.id || nativeSelect.name || 'catalog-select'}-listbox`;
    list.id = listId;
    list.className = 'catalog-select__list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', nativeSelect.labels?.[0]?.textContent?.trim() || 'Выберите значение');
    list.tabIndex = -1;
    list.hidden = true;
    trigger.setAttribute('aria-controls', listId);

    const options = [...nativeSelect.options].map((nativeOption) => {
      const option = document.createElement('li');
      option.className = 'catalog-select__option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', nativeOption.selected ? 'true' : 'false');
      option.tabIndex = -1;
      option.dataset.value = nativeOption.value;
      option.textContent = nativeOption.textContent.trim();
      list.append(option);
      return option;
    });

    ui.append(trigger, list);
    selectRoot.append(ui);
    selectRoot.classList.add('is-enhanced');
    nativeSelect.tabIndex = -1;

    let activeIndex = -1;

    const selectedIndex = () => Math.max(0, options.findIndex((option) => option.dataset.value === nativeSelect.value));

    const sync = () => {
      const index = selectedIndex();
      const nativeOption = nativeSelect.options[index];
      triggerText.textContent = nativeOption?.textContent?.trim() || '';
      options.forEach((option, optionIndex) => {
        option.setAttribute('aria-selected', optionIndex === index ? 'true' : 'false');
      });
    };

    const setActive = (index, focus = true) => {
      activeIndex = (index + options.length) % options.length;
      options.forEach((option, optionIndex) => {
        const active = optionIndex === activeIndex;
        option.classList.toggle('is-active', active);
        option.tabIndex = active ? 0 : -1;
      });
      if (focus) options[activeIndex]?.focus({ preventScroll: true });
    };

    const close = ({ focusTrigger = false } = {}) => {
      ui.classList.remove('is-open');
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      options.forEach((option) => {
        option.classList.remove('is-active');
        option.tabIndex = -1;
      });
      activeIndex = -1;
      if (focusTrigger) trigger.focus({ preventScroll: true });
    };

    const open = () => {
      // Only one catalog listbox should be open at a time.
      selectInstances.forEach((instance) => {
        if (instance.nativeSelect !== nativeSelect) instance.close();
      });
      ui.classList.add('is-open');
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      setActive(selectedIndex());
    };

    const choose = (option) => {
      nativeSelect.value = option.dataset.value ?? '';
      sync();
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      close({ focusTrigger: true });
    };

    trigger.addEventListener('click', () => {
      if (list.hidden) open();
      else close();
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open();
      }
    });

    list.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close({ focusTrigger: true });
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActive(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActive(options.length - 1);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (activeIndex >= 0) choose(options[activeIndex]);
      } else if (event.key === 'Tab') {
        close();
      }
    });

    options.forEach((option) => option.addEventListener('click', () => choose(option)));

    const instance = {
      nativeSelect,
      trigger,
      close,
      sync,
      focus: () => trigger.focus({ preventScroll: true }),
    };
    selectInstances.set(nativeSelect, instance);
    sync();
    return instance;
  };

  root.querySelectorAll('[data-catalog-select]').forEach(initCatalogSelect);

  document.addEventListener('pointerdown', (event) => {
    selectInstances.forEach((instance, nativeSelect) => {
      const selectRoot = nativeSelect.closest('[data-catalog-select]');
      if (selectRoot && !selectRoot.contains(event.target)) instance.close();
    });
  });

  const fields = Object.fromEntries(filterControls.map((control) => [control.dataset.filter, control]));
  const filterLabels = {
    type: 'Тип',
    seats: 'Места',
    fuel: 'Топливо',
    price: 'Цена до',
    brand: 'Марка',
    year: 'Год от',
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
    brand: fields.brand?.value || '',
    year: fields.year?.value || '',
    sort: sort.value || 'default',
  });

  const matches = (card, state) => {
    if (state.brand && card.dataset.brand !== state.brand) return false;
    if (state.year && Number(card.dataset.year) < Number(state.year)) return false;
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
    const activeKeys = ['brand', 'type', 'seats', 'fuel', 'year', 'price'].filter((key) => state[key]);

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
    ['brand', 'type', 'seats', 'fuel', 'year', 'max_price', 'sort'].forEach((key) => url.searchParams.delete(key));

    if (state.brand) url.searchParams.set('brand', state.brand);
    if (state.year) url.searchParams.set('year', state.year);
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

  const syncSelectUis = () => selectInstances.forEach((instance) => instance.sync());

  const reset = () => {
    filterControls.forEach((control) => { control.value = ''; });
    sort.value = 'default';
    syncSelectUis();
    apply();
  };

  const loadFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const mapping = {
      brand: params.get('brand') || '',
      year: params.get('year') || '',
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
    selectInstances.get(control)?.sync();
    apply();
    const instance = selectInstances.get(control);
    if (instance) instance.focus();
    else control.focus({ preventScroll: true });
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
  syncSelectUis();
  apply({ updateUrl: false });


  root.querySelectorAll('[data-quick-filter]').forEach((button) => button.addEventListener('click', () => {
    const key=button.dataset.quickFilter;
    if(key==='seven' && fields.seats) fields.seats.value='7';
    if(key==='electric' && fields.fuel) fields.fuel.value='electric';
    if(key==='budget' && fields.price) fields.price.value='1500';
    syncSelectUis(); apply();
  }));

  const rail=document.querySelector('[data-popular-rail]');
  if(rail){
    const modelData=[
      ['toyota-yaris','Toyota Yaris','../assets/img/catalog/toyota-yaris.webp','от 1 090 ฿'],
      ['honda-city','Honda City','../assets/img/catalog/honda-city.webp','от 1 190 ฿'],
      ['toyota-corolla-cross','Toyota Corolla Cross','../assets/img/catalog/toyota-corolla-cross.webp','от 1 490 ฿'],
      ['mitsubishi-xpander','Mitsubishi Xpander','../assets/img/catalog/mitsubishi-xpander.webp','от 1 690 ฿'],
      ['byd-dolphin','BYD Dolphin','../assets/img/catalog/byd-dolphin.webp','от 1 790 ฿'],
      ['toyota-fortuner','Toyota Fortuner','../assets/img/catalog/toyota-fortuner.webp','от 2 290 ฿'],
    ];
    let loaded=0;
    const sentinel=rail.querySelector('[data-popular-sentinel]');
    const loadMore=()=>{const batch=modelData.slice(loaded,loaded+3);batch.forEach(([slug,title,img,price])=>{const a=document.createElement('a');a.className='popular-model-card';a.href=`${slug}/`;a.innerHTML=`<img src="${img}" width="180" height="101" loading="lazy" alt=""><span><strong>${title}</strong><small>${price}</small></span>`;rail.insertBefore(a,sentinel);});loaded+=batch.length;if(loaded>=modelData.length)sentinel.remove();};
    loadMore();
    if(sentinel){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){loadMore();if(loaded>=modelData.length)io.disconnect();}},{root:rail,rootMargin:'0px 280px 0px 0px'});io.observe(sentinel);}
  }
})();
