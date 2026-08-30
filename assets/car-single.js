(() => {
  'use strict';

  const forms = [...document.querySelectorAll('[data-car-booking-form]')];
  if (!forms.length) return;

  const toLocalIsoDate = (date) => {
    const timezoneOffset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
  };

  forms.forEach((form) => {
    const pickupDate = form.querySelector('[data-car-pickup-date]');
    const returnDate = form.querySelector('[data-car-return-date]');
    const pickupMethod = form.querySelector('[data-car-pickup-method]');
    const addressField = form.querySelector('[data-delivery-address-field]');
    const addressInput = addressField?.querySelector('input');
    const contactMethod = form.querySelector('[data-contact-method]');
    const contactValue = form.querySelector('[data-contact-value]');
    const status = form.querySelector('[data-car-booking-status]');
    const success = form.closest('.booking-card')?.querySelector('[data-booking-success]');

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

    const syncContact = () => {
      if (!contactMethod || !contactValue) return;
      const method = contactMethod.value;
      if (method === 'telegram') {
        contactValue.placeholder = '@username или номер';
        contactValue.inputMode = 'text';
        contactValue.autocomplete = 'off';
      } else {
        contactValue.placeholder = '+66...';
        contactValue.inputMode = 'tel';
        contactValue.autocomplete = 'tel';
      }
    };

    pickupDate?.addEventListener('change', syncDates);
    pickupMethod?.addEventListener('change', syncDelivery);
    contactMethod?.addEventListener('change', syncContact);

    syncDates();
    syncDelivery();
    syncContact();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (status) status.textContent = '';

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

      if (form.hasAttribute('data-demo')) {
        form.hidden = true;
        if (success) success.hidden = false;
        success?.focus?.({ preventScroll: true });
      }
    });
  });
})();
