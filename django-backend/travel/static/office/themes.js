(() => {
  const key = 'staravia-workspace-theme';
  const themes = ['emerald', 'ivory-gold', 'graphite', 'ocean', 'lavender'];
  const apply = value => {
    value = ({forest:'emerald',violet:'lavender',teal:'ocean',rose:'ivory-gold'})[value] || value;
    const theme = themes.includes(value) ? value : 'emerald';
    document.documentElement.dataset.theme = theme;
    const picker = document.getElementById('workspace-theme');
    if (picker) picker.value = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
  };
  try { apply(localStorage.getItem(key)); } catch { apply('emerald'); }
  document.addEventListener('DOMContentLoaded', () => {
    const picker = document.getElementById('workspace-theme');
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === document.documentElement.dataset.theme));
      button.addEventListener('click', () => {
        apply(button.dataset.themeChoice);
        try { localStorage.setItem(key, button.dataset.themeChoice); } catch {}
      });
    });
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
