const langBtn = document.getElementById('langBtn');
const themeBtn = document.getElementById('themeBtn');
const year = document.getElementById('year');

const storedTheme = localStorage.getItem('theme');
const storedLang = localStorage.getItem('lang');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function setLang(lang) {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  localStorage.setItem('lang', lang);
  langBtn.textContent = lang === 'zh' ? 'EN' : '中';
}

langBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.lang === 'zh' ? 'en' : 'zh';
  setLang(next);
});

themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
});

year.textContent = new Date().getFullYear();
setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));
setLang(storedLang || 'en');
