(() => {
  const key = 'staravia-workspace-theme';
  const themes = ['forest', 'ocean', 'violet', 'teal', 'rose'];
  const apply = value => {
    const theme = themes.includes(value) ? value : 'forest';
    document.documentElement.dataset.theme = theme;
    const picker = document.getElementById('workspace-theme');
    if (picker) picker.value = theme;
  };
  try { apply(localStorage.getItem(key)); } catch { apply('forest'); }
  document.addEventListener('DOMContentLoaded', () => {
    const picker = document.getElementById('workspace-theme');
    if (!picker) return;
    picker.value = document.documentElement.dataset.theme;
    picker.addEventListener('change', () => {
      apply(picker.value);
      try { localStorage.setItem(key, picker.value); } catch { /* Keep the session selection. */ }
    });
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
})();
