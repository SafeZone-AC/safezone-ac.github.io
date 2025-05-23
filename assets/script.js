const content = document.getElementById('markdown-content');
const links = document.querySelectorAll('.nav-link');
const themeToggle = document.getElementById('theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
const userTheme = localStorage.getItem('theme');

// Apply theme based on preference
if (userTheme === 'dark') {
  document.body.classList.add('dark');
} else if (userTheme === 'light') {
  document.body.classList.add('light');
} else if (prefersDarkScheme.matches) {
  document.body.classList.add('dark');
}

themeToggle.addEventListener('click', () => {
  if (document.body.classList.contains('dark')) {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    localStorage.setItem('theme', 'light');
  } else {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
});

async function loadMarkdown(file) {
  content.textContent = 'Loading...';
  try {
    const res = await fetch('md/' + file + '?t=' + Date.now()); // cache buster
    if (!res.ok) throw new Error('Failed to load ' + file);
    const text = await res.text();
    content.innerHTML = marked.parse(text);
  } catch (e) {
    content.textContent = e.message;
  }
}

links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const mdFile = link.getAttribute('data-md');
    loadMarkdown(mdFile);
    history.pushState(null, '', '#' + mdFile.replace('.md',''));
  });
});

window.addEventListener('popstate', () => {
  const hash = location.hash.substring(1);
  const mdFile = hash ? hash + '.md' : 'anticheat.md';
  const link = Array.from(links).find(l => l.getAttribute('data-md') === mdFile);
  if (link) {
    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    loadMarkdown(mdFile);
  }
});

const initialHash = location.hash.substring(1);
const initialFile = initialHash ? initialHash + '.md' : 'anticheat.md';
const initialLink = Array.from(links).find(l => l.getAttribute('data-md') === initialFile);
if (initialLink) {
  initialLink.classList.add('active');
}
loadMarkdown(initialFile);
