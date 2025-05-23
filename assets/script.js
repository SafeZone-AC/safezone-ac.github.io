const content = document.getElementById('markdown-content');
const links = document.querySelectorAll('.nav-link');
const themeToggle = document.getElementById('theme-toggle');

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
}

// Minimal Lua syntax highlighting
function luaHighlight(code) {
  const keywords = /\b(and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g;
  const comments = /--.*$/gm;
  const strings = /(["'])(?:\\.|(?!\1).)*\1/g;

  return code
    .replace(comments, m => `<span class="token comment">${m}</span>`)
    .replace(strings, m => `<span class="token string">${m}</span>`)
    .replace(keywords, m => `<span class="token keyword">${m}</span>`);
}

// Minimal JS syntax highlighting
function jsHighlight(code) {
  const keywords = /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const strings = /(["'`])(?:\\.|(?!\1).)*\1/g;
  const numbers = /\b\d+(\.\d+)?\b/g;

  return code
    .replace(comments, m => `<span class="token comment">${m}</span>`)
    .replace(strings, m => `<span class="token string">${m}</span>`)
    .replace(numbers, m => `<span class="token number">${m}</span>`)
    .replace(keywords, m => `<span class="token keyword">${m}</span>`);
}

// Minimal JSON highlighting
function jsonHighlight(code) {
  const keys = /"(\w+)"(?=\s*:)/g;
  const strings = /"(?:\\.|[^"\\])*"/g;
  const numbers = /\b\d+(\.\d+)?\b/g;
  const boolNull = /\b(true|false|null)\b/g;

  return code
    .replace(keys, m => `<span class="token key">${m}</span>`)
    .replace(strings, m => `<span class="token string">${m}</span>`)
    .replace(numbers, m => `<span class="token number">${m}</span>`)
    .replace(boolNull, m => `<span class="token boolean">${m}</span>`);
}

// Minimal SQL highlighting
function sqlHighlight(code) {
  const keywords = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|JOIN|ON|AS|ORDER BY|GROUP BY|LIMIT|OFFSET|DESC|ASC)\b/gi;
  const strings = /'(?:\\.|[^'\\])*'/g;
  const numbers = /\b\d+\b/g;
  const comments = /--.*$/gm;

  return code
    .replace(comments, m => `<span class="token comment">${m}</span>`)
    .replace(strings, m => `<span class="token string">${m}</span>`)
    .replace(numbers, m => `<span class="token number">${m}</span>`)
    .replace(keywords, m => `<span class="token keyword">${m.toUpperCase()}</span>`);
}

// Minimal HTML/XML highlighting
function htmlHighlight(code) {
  const tags = /(&lt;\/?[\w\s="'-.:]+&gt;)/g;
  return code.replace(tags, m => `<span class="token tag">${m}</span>`);
}

function highlightCodeBlocks() {
  const preBlocks = content.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;

    // Detect language from class like "language-lua"
    const lang = code.className.replace('language-', '').toLowerCase();

    let html = escapeHTML(code.textContent);

    if (lang === 'lua') {
      html = luaHighlight(html);
    } else if (lang === 'js' || lang === 'javascript') {
      html = jsHighlight(html);
    } else if (lang === 'json') {
      html = jsonHighlight(html);
    } else if (lang === 'sql') {
      html = sqlHighlight(html);
    } else if (lang === 'html' || lang === 'xml') {
      html = htmlHighlight(html);
    }

    pre.innerHTML = `<code class="${code.className}">${html}</code>`;
  });
}

async function loadMarkdown(file) {
  content.textContent = 'Loading...';
  try {
    const res = await fetch('md/' + file + '?t=' + Date.now()); // cache-buster
    if (!res.ok) throw new Error('Failed to load ' + file);
    const text = await res.text();

    content.innerHTML = marked.parse(text);
    highlightCodeBlocks();
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
    history.pushState(null, '', '#' + mdFile.replace('.md', ''));
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
