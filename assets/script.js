const content = document.getElementById('markdown-content');
const links = document.querySelectorAll('.nav-link');
const themeToggle = document.getElementById('theme-toggle');

async function loadMarkdown(file) {
  content.textContent = 'Loading...';
  try {
    const res = await fetch('md/' + file + '?t=' + Date.now());  // cache busting
    if (!res.ok) throw new Error('Failed to load ' + file);
    const text = await res.text();

    // Parse markdown to HTML
    content.innerHTML = marked.parse(text);

    // Highlight all code blocks after markdown is loaded
    content.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
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

// Initial load
const initialHash = location.hash.substring(1);
const initialFile = initialHash ? initialHash + '.md' : 'anticheat.md';
const initialLink = Array.from(links).find(l => l.getAttribute('data-md') === initialFile);
if (initialLink) {
  initialLink.classList.add('active');
}
loadMarkdown(initialFile);
