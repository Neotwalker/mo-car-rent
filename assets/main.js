(() => {
  'use strict';

  document.documentElement.classList.add('has-js');

  const SELECTORS = {
    form: '[data-booking-form]',
    pickupDate: '[data-pickup-date]',
    returnDate: '[data-return-date]',
    dateControl: '[data-date-control]',
    dateTrigger: '[data-date-trigger]',
    status: '[data-booking-status]',
    customSelect: '[data-custom-select]',
    selectNative: '[data-select-native]',
    selectUi: '[data-select-ui]',
    selectTrigger: '[data-select-trigger]',
    selectText: '[data-select-text]',
    selectList: '[data-select-list]',
    selectOption: '[data-select-option]',
    googleRating: '[data-google-rating]',
    googleRatingValue: '[data-google-rating-value]',
    googleRatingCount: '[data-google-rating-count]',
    menuToggle: '[data-menu-toggle]',
    mainNav: '[data-main-nav]',
  };

  const EVENT_BOOKING_SUBMIT = 'mocar:booking:submit';


  const initMenu = () => {
    const toggle = document.querySelector(SELECTORS.menuToggle);
    const nav = document.querySelector(SELECTORS.mainNav);

    if (!toggle || !nav) return;

    const desktopQuery = window.matchMedia('(min-width: 1201px)');

    const setOpen = (isOpen) => {
      nav.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      document.body.classList.toggle('menu-open', isOpen);
    };

    const close = () => setOpen(false);

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) close();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        close();
        toggle.focus({ preventScroll: true });
      }
    });

    desktopQuery.addEventListener('change', (event) => {
      if (event.matches) close();
    });
  };

  const toLocalIsoDate = (date) => {
    const timezoneOffset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
  };

  const syncReturnDate = (pickupDate, returnDate, fallbackMin) => {
    const minReturnDate = pickupDate.value || fallbackMin;
    returnDate.min = minReturnDate;

    if (returnDate.value && returnDate.value < minReturnDate) {
      returnDate.value = '';
    }
  };

  const openDatePicker = (input) => {
    input.focus({ preventScroll: true });

    if (typeof input.showPicker !== 'function') return;

    try {
      input.showPicker();
    } catch {
      // Native focused date input remains the fallback.
    }
  };

  const initDateControl = (control) => {
    const input = control.querySelector('input[type="date"]');
    const trigger = control.querySelector(SELECTORS.dateTrigger);

    if (!input || !trigger) return;

    trigger.addEventListener('click', () => openDatePicker(input));
  };

  const initCustomSelect = (root) => {
    const nativeSelect = root.querySelector(SELECTORS.selectNative);
    const ui = root.querySelector(SELECTORS.selectUi);
    const trigger = root.querySelector(SELECTORS.selectTrigger);
    const text = root.querySelector(SELECTORS.selectText);
    const list = root.querySelector(SELECTORS.selectList);
    const options = [...root.querySelectorAll(SELECTORS.selectOption)];

    if (!nativeSelect || !ui || !trigger || !text || !list || !options.length) {
      return null;
    }

    const isRequired = nativeSelect.required;
    nativeSelect.required = false;
    nativeSelect.tabIndex = -1;

    root.classList.add('is-enhanced');
    ui.hidden = false;

    let activeIndex = -1;

    const getSelectedIndex = () =>
      options.findIndex((option) => option.dataset.value === nativeSelect.value);

    const setActiveIndex = (index, { focus = true } = {}) => {
      activeIndex = (index + options.length) % options.length;

      options.forEach((option, optionIndex) => {
        const isActive = optionIndex === activeIndex;
        option.classList.toggle('is-active', isActive);
        option.tabIndex = isActive ? 0 : -1;
      });

      if (focus) {
        options[activeIndex].focus({ preventScroll: true });
      }
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

      if (focusTrigger) {
        trigger.focus({ preventScroll: true });
      }
    };

    const open = () => {
      ui.classList.add('is-open');
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');

      const selectedIndex = getSelectedIndex();
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    };

    const selectOption = (option) => {
      nativeSelect.value = option.dataset.value || '';
      text.textContent = option.textContent.trim();

      options.forEach((item) => {
        item.setAttribute('aria-selected', item === option ? 'true' : 'false');
      });

      root.classList.remove('has-error');
      trigger.removeAttribute('aria-invalid');
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      close({ focusTrigger: true });
    };

    trigger.addEventListener('click', () => {
      if (list.hidden) open();
      else close();
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      open();
    });

    list.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close({ focusTrigger: true });
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex(activeIndex + 1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex(activeIndex - 1);
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(0);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectOption(options[activeIndex]);
        return;
      }

      if (event.key === 'Tab') close();
    });

    options.forEach((option) => {
      option.addEventListener('click', () => selectOption(option));
    });

    document.addEventListener('pointerdown', (event) => {
      if (!root.contains(event.target)) close();
    });

    return {
      isValid() {
        const isValid = !isRequired || Boolean(nativeSelect.value);

        root.classList.toggle('has-error', !isValid);

        if (isValid) {
          trigger.removeAttribute('aria-invalid');
          return true;
        }

        trigger.setAttribute('aria-invalid', 'true');
        trigger.focus({ preventScroll: true });
        return false;
      },
    };
  };

  const initBookingForm = (form) => {
    const pickupDate = form.querySelector(SELECTORS.pickupDate);
    const returnDate = form.querySelector(SELECTORS.returnDate);
    const status = form.querySelector(SELECTORS.status);

    if (!pickupDate || !returnDate) return;

    const customSelects = [...form.querySelectorAll(SELECTORS.customSelect)]
      .map(initCustomSelect)
      .filter(Boolean);

    form.querySelectorAll(SELECTORS.dateControl).forEach(initDateControl);

    const today = toLocalIsoDate(new Date());
    pickupDate.min = today;
    returnDate.min = today;

    pickupDate.addEventListener('change', () => {
      syncReturnDate(pickupDate, returnDate, today);
    });

    form.addEventListener('submit', (event) => {
      const customSelectsValid = customSelects.every((select) => select.isValid());

      if (!customSelectsValid) {
        event.preventDefault();
        if (status) status.textContent = 'Выберите место получения автомобиля.';
        return;
      }

      if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        return;
      }

      const detail = Object.fromEntries(new FormData(form).entries());
      document.dispatchEvent(new CustomEvent(EVENT_BOOKING_SUBMIT, { detail }));

      if (!form.hasAttribute('data-demo')) return;

      event.preventDefault();
      if (status) status.textContent = 'Параметры подбора автомобиля заполнены.';
    });
  };

  const formatRating = (rating) =>
    Number(rating).toLocaleString('ru-RU', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const initGoogleRating = async (root) => {
    const endpoint = root.dataset.ratingEndpoint;
    if (!endpoint) return;

    const value = root.querySelector(SELECTORS.googleRatingValue);
    const count = root.querySelector(SELECTORS.googleRatingCount);
    if (!value || !count) return;

    try {
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });

      if (!response.ok) return;

      const data = await response.json();
      if (typeof data.rating === 'number') value.textContent = formatRating(data.rating);
      if (Number.isInteger(data.userRatingCount)) count.textContent = String(data.userRatingCount);
    } catch {
      // Keep the server-rendered/static fallback when the endpoint is unavailable.
    }
  };

  const init = () => {
    initMenu();
    document.querySelectorAll(SELECTORS.form).forEach(initBookingForm);
    document.querySelectorAll(SELECTORS.googleRating).forEach(initGoogleRating);
  };

  init();
})();
