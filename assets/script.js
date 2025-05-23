const content = document.getElementById('markdown-content');
const links = document.querySelectorAll('.nav-link');
const themeToggle = document.getElementById('theme-toggle');

async function loadMarkdown(file) {
  content.textContent = 'Loading...';
  try {
    const res = await fetch('md/' + file + '?t=' + Date.now());  // cache-buster
    if (!res.ok) throw new Error('Failed to load ' + file);
    const text = await res.text();
    content.innerHTML = marked.parse(text);

    // Add language labels to code blocks
    document.querySelectorAll('#markdown-content pre > code').forEach(code => {
      const className = code.className || '';
      const match = className.match(/language-(\w+)/);
      if (match) {
        const lang = match[1];
        const wrapper = code.parentElement;
        const label = document.createElement('div');
        label.className = 'lang-label';
        label.textContent = lang.toUpperCase();
        wrapper.insertBefore(label, code);
      }
    });

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

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
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

// Load page based on URL hash or default to anticheat.md
const initialHash = location.hash.substring(1);
const initialFile = initialHash ? initialHash + '.md' : 'anticheat.md';
const initialLink = Array.from(links).find(l => l.getAttribute('data-md') === initialFile);
if (initialLink) {
  initialLink.classList.add('active');
  loadMarkdown(initialFile);
} else {
  links[0].classList.add('active');
  loadMarkdown('anticheat.md');
}
