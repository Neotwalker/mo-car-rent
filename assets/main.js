(() => {
  'use strict';

  const bookingForm = document.querySelector('[data-booking-form]');
  if (!bookingForm) return;

  const pickupDate = bookingForm.querySelector('[data-pickup-date]');
  const returnDate = bookingForm.querySelector('[data-return-date]');
  const status = bookingForm.querySelector('[data-booking-status]');

  const toIsoDate = (date) => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
  };

  const today = toIsoDate(new Date());
  pickupDate.min = today;
  returnDate.min = today;

  pickupDate.addEventListener('change', () => {
    const minReturnDate = pickupDate.value || today;
    returnDate.min = minReturnDate;

    if (returnDate.value && returnDate.value < minReturnDate) {
      returnDate.value = '';
    }
  });

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    const bookingData = Object.fromEntries(new FormData(bookingForm).entries());

    document.dispatchEvent(new CustomEvent('mocar:booking-submit', {
      detail: bookingData
    }));

    if (status) {
      status.textContent = 'Параметры подбора автомобиля заполнены.';
    }
  });
})();
