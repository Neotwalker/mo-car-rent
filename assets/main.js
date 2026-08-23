(() => {
  'use strict';

  const SELECTORS = {
    form: '[data-booking-form]',
    pickupDate: '[data-pickup-date]',
    returnDate: '[data-return-date]',
    status: '[data-booking-status]',
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

  const initBookingForm = (form) => {
    const pickupDate = form.querySelector(SELECTORS.pickupDate);
    const returnDate = form.querySelector(SELECTORS.returnDate);
    const status = form.querySelector(SELECTORS.status);

    if (!pickupDate || !returnDate) return;

    const today = toLocalIsoDate(new Date());

    pickupDate.min = today;
    returnDate.min = today;

    pickupDate.addEventListener('change', () => {
      syncReturnDate(pickupDate, returnDate, today);
    });

    form.addEventListener('submit', (event) => {
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
