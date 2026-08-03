function applyTheme(theme) {
  if (theme !== 'dark' && theme !== 'light') theme = 'dark';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('vernya-theme', theme);

  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.themeBtn === theme);
  });

  window.dispatchEvent(new CustomEvent('vernya:themechange', { detail: { theme } }));
}

function getStoredTheme() {
  return localStorage.getItem('vernya-theme') || 'dark';
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getStoredTheme());
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeBtn));
  });
});
