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
  };

  const EVENT_BOOKING_SUBMIT = 'mocar:booking:submit';

  const toLocalIsoDate = (date) => {
    const timezoneOffset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
  };

  const syncReturnDate = (pickupDate, returnDate, fallbackMin) => {
    if (!pickupDate || !returnDate) return;

    const minReturnDate = pickupDate.value || fallbackMin;
    returnDate.min = minReturnDate;

    if (returnDate.value && returnDate.value < minReturnDate) {
      returnDate.value = '';
    }
  };

  const openDatePicker = (input) => {
    if (!input) return;

    input.focus({ preventScroll: true });

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // The focused native date input remains usable as the fallback.
      }
    }
  };

  const initDateControl = (control) => {
    const input = control.querySelector('input[type="date"]');
    const trigger = control.querySelector(SELECTORS.dateTrigger);

    if (!input || !trigger) return;

    trigger.addEventListener('click', () => {
      openDatePicker(input);
    });
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

    const wasRequired = nativeSelect.required;
    nativeSelect.required = false;
    nativeSelect.tabIndex = -1;

    root.classList.add('is-enhanced');
    ui.hidden = false;

    let activeIndex = -1;

    const getSelectedIndex = () =>
      options.findIndex((option) => option.dataset.value === nativeSelect.value);

    const setActiveIndex = (index, { focus = true } = {}) => {
      if (!options.length) return;

      activeIndex = (index + options.length) % options.length;

      options.forEach((option, optionIndex) => {
        option.classList.toggle('is-active', optionIndex === activeIndex);
        option.tabIndex = optionIndex === activeIndex ? 0 : -1;
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

    const open = ({ focusSelected = true } = {}) => {
      ui.classList.add('is-open');
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');

      const selectedIndex = getSelectedIndex();
      const firstIndex = selectedIndex >= 0 ? selectedIndex : 0;
      setActiveIndex(firstIndex, { focus: focusSelected });
    };

    const selectOption = (option, { focusTrigger = true } = {}) => {
      if (!option) return;

      nativeSelect.value = option.dataset.value || '';
      text.textContent = option.textContent.trim();

      options.forEach((item) => {
        item.setAttribute(
          'aria-selected',
          item === option ? 'true' : 'false',
        );
      });

      root.classList.remove('has-error');
      trigger.removeAttribute('aria-invalid');

      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      close({ focusTrigger });
    };

    trigger.addEventListener('click', () => {
      if (list.hidden) {
        open();
      } else {
        close();
      }
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

      if (event.key === 'Tab') {
        close();
      }
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        selectOption(option);
      });
    });

    const onDocumentPointerDown = (event) => {
      if (!root.contains(event.target)) {
        close();
      }
    };

    document.addEventListener('pointerdown', onDocumentPointerDown);

    return {
      isValid() {
        if (!wasRequired || nativeSelect.value) {
          root.classList.remove('has-error');
          trigger.removeAttribute('aria-invalid');
          return true;
        }

        root.classList.add('has-error');
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
    const customSelects = [...form.querySelectorAll(SELECTORS.customSelect)]
      .map(initCustomSelect)
      .filter(Boolean);

    form.querySelectorAll(SELECTORS.dateControl).forEach(initDateControl);

    if (!pickupDate || !returnDate) return;

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

        if (status) {
          status.textContent = 'Выберите место получения автомобиля.';
        }

        return;
      }

      if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        return;
      }

      const detail = Object.fromEntries(new FormData(form).entries());

      document.dispatchEvent(
        new CustomEvent(EVENT_BOOKING_SUBMIT, {
          detail,
        }),
      );

      if (form.hasAttribute('data-demo')) {
        event.preventDefault();

        if (status) {
          status.textContent = 'Параметры подбора автомобиля заполнены.';
        }
      }
    });
  };

  const init = () => {
    document.querySelectorAll(SELECTORS.form).forEach(initBookingForm);
  };

  init();
})();
