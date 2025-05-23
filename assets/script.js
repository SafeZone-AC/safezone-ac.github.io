const content = document.getElementById('markdown-content');
const links = document.querySelectorAll('.nav-link');
const themeToggle = document.getElementById('theme-toggle');

// Escape text inside code spans to keep HTML safe
function escapeForSpan(str) {
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

  code = code.replace(comments, m => `<span class="token comment">${escapeForSpan(m)}</span>`);
  code = code.replace(strings, m => `<span class="token string">${escapeForSpan(m)}</span>`);
  code = code.replace(keywords, m => `<span class="token keyword">${escapeForSpan(m)}</span>`);
  return code;
}

// Minimal JS syntax highlighting
function jsHighlight(code) {
  const keywords = /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const strings = /(["'`])(?:\\.|(?!\1).)*\1/g;
  const numbers = /\b\d+(\.\d+)?\b/g;

  code = code.replace(comments, m => `<span class="token comment">${escapeForSpan(m)}</span>`);
  code = code.replace(strings, m => `<span class="token string">${escapeForSpan(m)}</span>`);
  code = code.replace(numbers, m => `<span class="token number">${escapeForSpan(m)}</span>`);
  code = code.replace(keywords, m => `<span class="token keyword">${escapeForSpan(m)}</span>`);
  return code;
}

// Minimal JSON highlighting
function jsonHighlight(code) {
  const keys = /"(\w+)"(?=\s*:)/g;
  const strings = /"(?:\\.|[^"\\])*"/g;
  const numbers = /\b\d+(\.\d+)?\b/g;
  const boolNull = /\b(true|false|null)\b/g;

  code = code.replace(keys, m => `<span class="token key">${escapeForSpan(m)}</span>`);
  code = code.replace(strings, m => `<span class="token string">${escapeForSpan(m)}</span>`);
  code = code.replace(numbers, m => `<span class="token number">${escapeForSpan(m)}</span>`);
  code = code.replace(boolNull, m => `<span class="token boolean">${escapeForSpan(m)}</span>`);
  return code;
}

// Minimal SQL highlighting
function sqlHighlight(code) {
  const keywords = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|JOIN|ON|AS|ORDER BY|GROUP BY|LIMIT|OFFSET|DESC|ASC)\b/gi;
  const strings = /'(?:\\.|[^'\\])*'/g;
  const numbers = /\b\d+\b/g;
  const comments = /--.*$/gm;

  code = code.replace(comments, m => `<span class="token comment">${escapeForSpan(m)}</span>`);
  code = code.replace(strings, m => `<span class="token string">${escapeForSpan(m)}</span>`);
  code = code.replace(numbers, m => `<span class="token number">${escapeForSpan(m)}</span>`);
  code = code.replace(keywords, m => `<span class="token keyword">${escapeForSpan(m.toUpperCase())}</span>`);
  return code;
}

// Minimal HTML/XML highlighting
function htmlHighlight(code) {
  // Escape whole code first, then wrap tags only
  code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tags = /(&lt;\/?[\w\s="'-.:]+&gt;)/g;
  return code.replace(tags, m => `<span class="token tag">${m}</span>`);
}

function highlightCodeBlocks() {
  const preBlocks = content.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;

    const lang = code.className.replace('language-', '').toLowerCase();

    const rawCode = code.textContent;

    let highlighted;

    if (lang === 'lua') {
      highlighted = luaHighlight(rawCode);
    } else if (lang === 'js' || lang === 'javascript') {
      highlighted = jsHighlight(rawCode);
    } else if (lang === 'json') {
      highlighted = jsonHighlight(rawCode);
    } else if (lang === 'sql') {
      highlighted = sqlHighlight(rawCode);
    } else if (lang === 'html' || lang === 'xml') {
      highlighted = htmlHighlight(rawCode);
    } else {
      // fallback: just escape to avoid raw HTML injection
      highlighted = escapeForSpan(rawCode);
    }

    pre.innerHTML = `<code class="${code.className}">${highlighted}</code>`;
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
