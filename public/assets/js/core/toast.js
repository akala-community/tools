let activeTimer = null;

export function showToast(message, options = {}) {
  const { duration = 2200 } = options;
  let toast = document.querySelector('[data-toast]');

  if (!toast) {
    toast = document.createElement('div');
    toast.dataset.toast = '';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
