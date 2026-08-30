(() => {
  'use strict';

  const forms = [...document.querySelectorAll('[data-car-booking-form]')];
  if (!forms.length) return;

  const toLocalIsoDate = (date) => {
    const timezoneOffset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
  };

  const groups = (value, sizes, separators = ' ') => {
    const chunks = [];
    let cursor = 0;
    sizes.forEach((size) => {
      if (cursor >= value.length) return;
      chunks.push(value.slice(cursor, cursor + size));
      cursor += size;
    });
    if (cursor < value.length) chunks.push(value.slice(cursor));
    return chunks.join(separators);
  };

  const PHONE_RULES = [
    { prefix: '971', max: 12, format: (rest) => `+971${rest ? ` ${groups(rest, [2, 3, 4])}` : ''}` },
    { prefix: '66', max: 11, format: (rest) => `+66${rest ? ` ${groups(rest, [2, 3, 4])}` : ''}` },
    { prefix: '44', max: 12, format: (rest) => `+44${rest ? ` ${groups(rest, [4, 6])}` : ''}` },
    { prefix: '49', max: 15, format: (rest) => `+49${rest ? ` ${groups(rest, [3, 4, 4])}` : ''}` },
    { prefix: '33', max: 11, format: (rest) => `+33${rest ? ` ${groups(rest, [1, 2, 2, 2, 2])}` : ''}` },
    { prefix: '39', max: 12, format: (rest) => `+39${rest ? ` ${groups(rest, [3, 3, 4])}` : ''}` },
    { prefix: '34', max: 11, format: (rest) => `+34${rest ? ` ${groups(rest, [3, 3, 3])}` : ''}` },
    { prefix: '31', max: 11, format: (rest) => `+31${rest ? ` ${groups(rest, [1, 2, 2, 2, 2])}` : ''}` },
    { prefix: '90', max: 12, format: (rest) => `+90${rest ? ` ${groups(rest, [3, 3, 2, 2])}` : ''}` },
    { prefix: '62', max: 15, format: (rest) => `+62${rest ? ` ${groups(rest, [3, 4, 4])}` : ''}` },
    { prefix: '65', max: 10, format: (rest) => `+65${rest ? ` ${groups(rest, [4, 4])}` : ''}` },
    { prefix: '86', max: 13, format: (rest) => `+86${rest ? ` ${groups(rest, [3, 4, 4])}` : ''}` },
    { prefix: '81', max: 12, format: (rest) => `+81${rest ? ` ${groups(rest, [2, 4, 4])}` : ''}` },
    { prefix: '82', max: 12, format: (rest) => `+82${rest ? ` ${groups(rest, [2, 4, 4])}` : ''}` },
    {
      prefix: '7',
      max: 11,
      format: (rest) => {
        if (!rest) return '+7';
        const area = rest.slice(0, 3);
        const tail = rest.slice(3);
        let output = `+7 (${area}`;
        if (area.length === 3) output += ')';
        if (tail) output += ` ${groups(tail, [3, 2, 2], '-')}`;
        return output;
      },
    },
    {
      prefix: '1',
      max: 11,
      format: (rest) => {
        if (!rest) return '+1';
        const area = rest.slice(0, 3);
        const tail = rest.slice(3);
        let output = `+1 (${area}`;
        if (area.length === 3) output += ')';
        if (tail) {
          const first = tail.slice(0, 3);
          const last = tail.slice(3, 7);
          output += ` ${first}${last ? `-${last}` : ''}`;
        }
        return output;
      },
    },
  ];

  const getPhoneRule = (digits) => PHONE_RULES.find((rule) => digits.startsWith(rule.prefix));

  const normalizePhoneDigits = (value) => value.replace(/\D/g, '').slice(0, 15);

  const formatPhone = (value) => {
    let digits = normalizePhoneDigits(value);
    if (!digits) return '';

    const rule = getPhoneRule(digits);
    if (!rule) return `+${groups(digits, [3, 3, 3, 3, 3])}`;

    digits = digits.slice(0, rule.max);
    return rule.format(digits.slice(rule.prefix.length));
  };

  forms.forEach((form) => {
    const pickupDate = form.querySelector('[data-car-pickup-date]');
    const returnDate = form.querySelector('[data-car-return-date]');
    const pickupMethod = form.querySelector('[data-car-pickup-method]');
    const addressField = form.querySelector('[data-delivery-address-field]');
    const addressInput = addressField?.querySelector('input');
    const phone = form.querySelector('[data-phone-mask]');
    const status = form.querySelector('[data-car-booking-status]');
    const shell = form.closest('.booking-card__form-shell');
    const success = shell?.querySelector('[data-booking-success]');
    const dateControls = [...form.querySelectorAll('[data-car-date-control]')];
    const submit = form.querySelector('.car-booking__submit');
    let successTimer = 0;
    let hideTimer = 0;

    const today = toLocalIsoDate(new Date());
    if (pickupDate) pickupDate.min = today;
    if (returnDate) returnDate.min = today;

    const syncDates = () => {
      if (!pickupDate || !returnDate) return;
      const minReturn = pickupDate.value || today;
      returnDate.min = minReturn;
      if (returnDate.value && returnDate.value < minReturn) returnDate.value = '';
    };

    const syncDelivery = () => {
      if (!pickupMethod || !addressField || !addressInput) return;
      const requiresAddress = pickupMethod.value === 'delivery';
      addressField.hidden = !requiresAddress;
      addressInput.required = requiresAddress;
      if (!requiresAddress) addressInput.value = '';
    };

    const validatePhone = () => {
      if (!phone) return;
      const digits = normalizePhoneDigits(phone.value);
      const valid = digits.length >= 8 && digits.length <= 15;
      phone.setCustomValidity(valid || !phone.value ? '' : 'Введите номер телефона целиком.');
    };

    const syncPhoneMask = () => {
      if (!phone) return;
      const formatted = formatPhone(phone.value);
      phone.value = formatted;
      validatePhone();
      try {
        phone.setSelectionRange(formatted.length, formatted.length);
      } catch {
        // Some mobile browsers may not support selection on tel inputs.
      }
    };

    const openDatePicker = (input) => {
      input?.focus({ preventScroll: true });
      if (!input || typeof input.showPicker !== 'function') return;
      try {
        input.showPicker();
      } catch {
        // Focused native date input remains the fallback.
      }
    };

    const hideSuccess = () => {
      if (!success) return;
      success.classList.remove('is-visible');
      hideTimer = window.setTimeout(() => {
        success.hidden = true;
        form.reset();
        syncDates();
        syncDelivery();
        syncPhoneMask();
        if (status) status.textContent = '';
        submit?.focus({ preventScroll: true });
      }, 180);
    };

    const showSuccess = () => {
      if (!success) return;
      window.clearTimeout(successTimer);
      window.clearTimeout(hideTimer);
      success.hidden = false;
      window.requestAnimationFrame(() => success.classList.add('is-visible'));
      success.focus({ preventScroll: true });
      successTimer = window.setTimeout(hideSuccess, 6000);
    };

    dateControls.forEach((control) => {
      const input = control.querySelector('input[type="date"]');
      const trigger = control.querySelector('[data-car-date-trigger]');
      trigger?.addEventListener('click', () => openDatePicker(input));
    });

    pickupDate?.addEventListener('change', syncDates);
    pickupMethod?.addEventListener('change', syncDelivery);
    phone?.addEventListener('input', syncPhoneMask);
    phone?.addEventListener('blur', validatePhone);

    syncDates();
    syncDelivery();
    syncPhoneMask();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (status) status.textContent = '';
      validatePhone();

      const requiredFields = [...form.querySelectorAll('[required]')];
      requiredFields.forEach((field) => field.removeAttribute('aria-invalid'));

      if (!form.checkValidity()) {
        const firstInvalid = requiredFields.find((field) => !field.checkValidity());
        firstInvalid?.setAttribute('aria-invalid', 'true');
        if (status) status.textContent = 'Проверьте обязательные поля формы.';
        form.reportValidity();
        firstInvalid?.focus({ preventScroll: true });
        return;
      }

      const detail = Object.fromEntries(new FormData(form).entries());
      document.dispatchEvent(new CustomEvent('mocar:booking_submit', { detail }));

      if (form.hasAttribute('data-demo')) showSuccess();
    });
  });
})();
