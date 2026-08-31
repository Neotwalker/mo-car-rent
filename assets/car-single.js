(() => {
  'use strict';

  const forms = [...document.querySelectorAll('[data-car-booking-form]')];
  if (!forms.length) return;

  const PHONE_RULES = {
    '66': { max: 9, pattern: [2, 3, 4] },
    '7': { max: 10, pattern: [3, 3, 2, 2], paren: true },
    '1': { max: 10, pattern: [3, 3, 4], paren: true },
    '44': { max: 10, pattern: [4, 6] },
    '49': { max: 11, pattern: [3, 4, 4] },
    '33': { max: 9, pattern: [1, 2, 2, 2, 2] },
    '971': { max: 9, pattern: [2, 3, 4] },
  };

  const digits = (value) => (value || '').replace(/\D/g, '');
  const group = (value, sizes) => {
    const result = [];
    let position = 0;
    sizes.forEach((size) => {
      if (position >= value.length) return;
      result.push(value.slice(position, position + size));
      position += size;
    });
    if (position < value.length) result.push(value.slice(position));
    return result;
  };

  const formatLocal = (value, code) => {
    const rule = PHONE_RULES[code] || { max: 12, pattern: [3, 3, 3, 3] };
    const valueDigits = digits(value).slice(0, rule.max);
    if (!valueDigits) return '';
    if (rule.paren) {
      const first = valueDigits.slice(0, 3);
      const rest = valueDigits.slice(3);
      let output = first ? `(${first}${first.length === 3 ? ')' : ''}` : '';
      if (rest) output += ` ${group(rest, rule.pattern.slice(1)).join('-')}`;
      return output;
    }
    return group(valueDigits, rule.pattern).join(' ');
  };

  const pad = (value) => String(value).padStart(2, '0');
  const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const parseIso = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = dayStart(new Date());
  const ruMonth = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
  const ruShort = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

  const initRentalSearch = (form) => {
    const root = form.querySelector('[data-rental-search]');
    if (!root) return null;

    const pickupInput = root.querySelector('[data-place-input="pickup"]');
    const returnInput = root.querySelector('[data-place-input="return"]');
    const pickupDateInput = root.querySelector('[data-pickup-date]');
    const returnDateInput = root.querySelector('[data-return-date]');
    const dateTrigger = root.querySelector('[data-date-range-trigger]');
    const datePopover = root.querySelector('[data-date-popover]');
    const monthsEl = root.querySelector('[data-calendar-months]');
    const dateValue = root.querySelector('[data-date-range-value]');
    const calendarSummary = root.querySelector('[data-calendar-summary]');
    const calendarDone = root.querySelector('[data-calendar-done]');
    const calendarPrev = root.querySelector('[data-calendar-prev]');
    const calendarNext = root.querySelector('[data-calendar-next]');
    const error = root.querySelector('[data-rental-search-error]');
    const addressField = form.querySelector('[data-delivery-address-field]');
    const address = addressField?.querySelector('input');

    let monthOffset = 0;
    let rangeStart = null;
    let rangeEnd = null;

    const syncOverlayState = () => {
      document.body.classList.toggle('catalog-place-open', Boolean(root.querySelector('.catalog-place:not([hidden])')));
    };

    const closePopovers = (except = null) => {
      root.querySelectorAll('.catalog-popover:not([hidden])').forEach((popover) => {
        if (popover === except) return;
        popover.hidden = true;
        popover.closest('.catalog-search__field')?.querySelector('[aria-expanded="true"]')?.setAttribute('aria-expanded', 'false');
      });
      syncOverlayState();
    };

    const setPlace = (kind, value, label = null) => {
      const input = root.querySelector(`[data-place-input="${kind}"]`);
      const text = root.querySelector(`[data-place-value="${kind}"]`);
      if (!input || !text) return;
      const option = root.querySelector(`[data-place-option="${kind}"][data-value="${CSS.escape(value)}"]`);
      input.value = value;
      text.textContent = label || option?.dataset.label || option?.textContent.trim() || (kind === 'return' ? 'Там же' : 'По всему Пхукету');
      root.querySelector(`[data-place-field="${kind}"]`)?.classList.remove('has-error');
      if (kind === 'pickup' && addressField && address) {
        const needsAddress = value === 'delivery';
        addressField.hidden = !needsAddress;
        address.required = needsAddress;
        if (!needsAddress) address.value = '';
      }
    };

    ['pickup', 'return'].forEach((kind) => {
      const trigger = root.querySelector(`[data-place-trigger="${kind}"]`);
      const popover = root.querySelector(`[data-place-popover="${kind}"]`);
      if (!trigger || !popover) return;

      trigger.addEventListener('click', () => {
        const opening = popover.hidden;
        closePopovers(opening ? popover : null);
        popover.hidden = !opening;
        trigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
        syncOverlayState();
      });

      popover.querySelectorAll(`[data-place-option="${kind}"]`).forEach((option) => {
        option.addEventListener('click', () => {
          setPlace(kind, option.dataset.value || '', option.dataset.label || option.textContent.trim());
          popover.hidden = true;
          trigger.setAttribute('aria-expanded', 'false');
          syncOverlayState();
          trigger.focus({ preventScroll: true });
        });
      });
    });

    root.querySelectorAll('[data-close-place]').forEach((button) => {
      button.addEventListener('click', () => {
        const popover = button.closest('.catalog-place');
        const trigger = popover?.closest('.catalog-search__field')?.querySelector('[data-place-trigger]');
        if (popover) popover.hidden = true;
        trigger?.setAttribute('aria-expanded', 'false');
        syncOverlayState();
        trigger?.focus({ preventScroll: true });
      });
    });

    const updateDateText = () => {
      const dateField = root.querySelector('[data-rental-date-field]');
      if (rangeStart && rangeEnd) {
        const days = Math.max(1, Math.round((rangeEnd - rangeStart) / 86400000));
        dateValue.textContent = `${ruShort.format(rangeStart)} - ${ruShort.format(rangeEnd)} · ${days} дн.`;
        calendarSummary.textContent = `${ruShort.format(rangeStart)} → ${ruShort.format(rangeEnd)}, ${days} дн.`;
        pickupDateInput.value = iso(rangeStart);
        returnDateInput.value = iso(rangeEnd);
        dateField?.classList.remove('has-error');
        if (error) error.hidden = true;
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

      for (let monthIndex = 0; monthIndex < 2; monthIndex += 1) {
        const month = new Date(base.getFullYear(), base.getMonth() + monthIndex, 1);
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

        for (let day = 1; day <= daysInMonth; day += 1) {
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'catalog-day';
          button.textContent = String(day);
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
          });
          days.append(button);
        }
        monthsEl.append(wrap);
      }
      if (calendarPrev) calendarPrev.disabled = monthOffset <= 0;
    };

    dateTrigger?.addEventListener('click', () => {
      const opening = datePopover.hidden;
      closePopovers(opening ? datePopover : null);
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
      dateTrigger.focus({ preventScroll: true });
    });

    document.addEventListener('pointerdown', (event) => {
      if (!root.contains(event.target)) closePopovers();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = root.querySelector('.catalog-popover:not([hidden])');
      if (!open) return;
      const trigger = open.closest('.catalog-search__field')?.querySelector('.catalog-search__trigger');
      closePopovers();
      trigger?.focus({ preventScroll: true });
    });

    const applyQueryContext = () => {
      const params = new URLSearchParams(window.location.search);
      const pickup = params.get('pickup');
      const returnPlace = params.get('return');
      const pickupDate = parseIso(params.get('pickup_date'));
      const returnDate = parseIso(params.get('return_date'));
      if (pickup && root.querySelector(`[data-place-option="pickup"][data-value="${CSS.escape(pickup)}"]`)) setPlace('pickup', pickup);
      if (returnPlace && root.querySelector(`[data-place-option="return"][data-value="${CSS.escape(returnPlace)}"]`)) setPlace('return', returnPlace);
      if (pickupDate && pickupDate >= today) rangeStart = pickupDate;
      if (returnDate && rangeStart && returnDate > rangeStart) rangeEnd = returnDate;
      updateDateText();
    };

    const validate = () => {
      root.querySelectorAll('.has-error').forEach((field) => field.classList.remove('has-error'));
      if (!pickupInput?.value) {
        const field = root.querySelector('[data-place-field="pickup"]');
        field?.classList.add('has-error');
        field?.querySelector('[data-place-trigger]')?.focus({ preventScroll: true });
        return false;
      }
      if (!returnInput?.value) {
        const field = root.querySelector('[data-place-field="return"]');
        field?.classList.add('has-error');
        field?.querySelector('[data-place-trigger]')?.focus({ preventScroll: true });
        return false;
      }
      if (!rangeStart || !rangeEnd) {
        root.querySelector('[data-rental-date-field]')?.classList.add('has-error');
        if (error) error.hidden = false;
        dateTrigger?.focus({ preventScroll: true });
        return false;
      }
      if (error) error.hidden = true;
      return true;
    };

    const reset = () => {
      rangeStart = null;
      rangeEnd = null;
      monthOffset = 0;
      setPlace('pickup', 'all', 'По всему Пхукету');
      setPlace('return', 'same', 'Там же');
      updateDateText();
      closePopovers();
      if (addressField && address) {
        addressField.hidden = true;
        address.required = false;
        address.value = '';
      }
      if (error) error.hidden = true;
      root.querySelectorAll('.has-error').forEach((field) => field.classList.remove('has-error'));
    };

    applyQueryContext();
    return { validate, reset };
  };

  forms.forEach((form) => {
    const rentalSearch = initRentalSearch(form);
    const country = form.querySelector('[data-phone-country]');
    const local = form.querySelector('[data-phone-local]');
    const full = form.querySelector('[data-phone-full]');
    const shell = form.closest('.booking-card__form-shell');
    const success = shell?.querySelector('[data-booking-success]');
    const steps = [...form.querySelectorAll('[data-quiz-step]')];
    const progress = [...form.querySelectorAll('[data-quiz-progress]')];
    let step = 0;
    let timer = 0;

    const syncPhone = () => {
      if (!local || !country) return;
      const code = country.value;
      const formatted = formatLocal(local.value, code);
      local.value = formatted;
      const valueDigits = digits(formatted);
      const rule = PHONE_RULES[code] || { max: 12 };
      const valid = valueDigits.length >= Math.min(7, rule.max) && valueDigits.length <= rule.max;
      local.setCustomValidity(valid || !formatted ? '' : 'Введите номер целиком.');
      if (full) full.value = formatted ? `+${code} ${formatted}` : '';
    };

    country?.addEventListener('change', () => {
      if (local) local.value = '';
      syncPhone();
      local?.focus();
    });
    local?.addEventListener('input', syncPhone);

    const showStep = (index) => {
      step = Math.max(0, Math.min(steps.length - 1, index));
      steps.forEach((element, current) => { element.hidden = current !== step; });
      progress.forEach((element, current) => element.classList.toggle('is-active', current <= step));
      form.dataset.quizStep = String(step + 1);
    };

    const validateStep = () => {
      if (steps[step]?.querySelector('[data-rental-search]') && rentalSearch && !rentalSearch.validate()) return false;
      const required = [...steps[step].querySelectorAll('[required]')].filter((element) => !element.closest('[hidden]'));
      for (const field of required) {
        if (!field.checkValidity()) {
          field.setAttribute('aria-invalid', 'true');
          field.reportValidity();
          field.focus({ preventScroll: true });
          return false;
        }
        field.removeAttribute('aria-invalid');
      }
      return true;
    };

    form.querySelectorAll('[data-quiz-next]').forEach((button) => {
      button.addEventListener('click', () => {
        syncPhone();
        if (validateStep()) showStep(step + 1);
      });
    });
    form.querySelectorAll('[data-quiz-prev]').forEach((button) => button.addEventListener('click', () => showStep(step - 1)));

    const hideSuccess = () => {
      if (!success) return;
      success.classList.remove('is-visible');
      setTimeout(() => {
        success.hidden = true;
        form.reset();
        rentalSearch?.reset();
        showStep(0);
        syncPhone();
      }, 180);
    };

    const showSuccess = () => {
      if (!success) return;
      clearTimeout(timer);
      success.hidden = false;
      requestAnimationFrame(() => success.classList.add('is-visible'));
      timer = setTimeout(hideSuccess, 6000);
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      syncPhone();
      if (!validateStep()) return;
      const detail = Object.fromEntries(new FormData(form).entries());
      detail.messengers = [...form.querySelectorAll('[name="messengers"]:checked')].map((input) => input.value);
      document.dispatchEvent(new CustomEvent('mocar:booking_submit', { detail }));
      if (form.hasAttribute('data-demo')) showSuccess();
    });

    syncPhone();
    showStep(0);
  });
})();
