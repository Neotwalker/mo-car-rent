(() => {
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const dialog = document.querySelector('[data-dialog]');
  const toast = document.querySelector('[data-toast]');
  const requestForm = document.querySelector('[data-request-form]');

  const setHeaderState = () => {
    header?.classList.toggle('scrolled', window.scrollY > 12);
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const closeMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
  };

  menuToggle?.addEventListener('click', () => {
    const nextOpen = mobileMenu.hidden;
    mobileMenu.hidden = !nextOpen;
    menuToggle.setAttribute('aria-expanded', String(nextOpen));
    menuToggle.setAttribute('aria-label', nextOpen ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', nextOpen);
  });

  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  document.querySelectorAll('[data-open-request]').forEach(button => {
    button.addEventListener('click', () => {
      if (typeof dialog?.showModal === 'function') dialog.showModal();
    });
  });

  document.querySelector('[data-close-request]')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3600);
  };

  document.querySelector('[data-quick-search]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('#cars')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Демо: даты сохранены только в интерфейсе. Подключение фильтрации — следующий этап.');
  });

  requestForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    dialog?.close();
    showToast('Демо: заявка заполнена, но backend пока не подключен.');
  });

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const minDate = today.toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach(input => input.min = minDate);
})();
