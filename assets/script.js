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

// Utility to highlight tokens without overlapping
function highlightWithTokens(code, patterns) {
  // code is already escaped
  let tokens = [];

  patterns.forEach(({type, regex}) => {
    let match;
    while ((match = regex.exec(code)) !== null) {
      tokens.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
        text: match[0]
      });
      if (regex.lastIndex === match.index) regex.lastIndex++; // avoid zero-length infinite loop
    }
  });

  // Sort tokens by start index
  tokens.sort((a,b) => a.start - b.start);

  // Remove overlapping tokens - keep earliest token only
  let filtered = [];
  let lastEnd = 0;
  for (const token of tokens) {
    if (token.start >= lastEnd) {
      filtered.push(token);
      lastEnd = token.end;
    }
  }

  let result = '';
  let pos = 0;
  for (const token of filtered) {
    if (pos < token.start) result += code.slice(pos, token.start);
    result += `<span class="token ${token.type}">${token.text}</span>`;
    pos = token.end;
  }
  if (pos < code.length) result += code.slice(pos);

  return result;
}

// Lua highlighting
function luaHighlight(code) {
  const escaped = escapeForSpan(code);

  const patterns = [
    { type: 'comment', regex: /--.*$/gm },
    { type: 'string', regex: /(["'])(?:\\.|(?!\1).)*\1/g },
    { type: 'keyword', regex: /\b(and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g }
  ];

  return highlightWithTokens(escaped, patterns);
}

// JavaScript highlighting
function jsHighlight(code) {
  const escaped = escapeForSpan(code);

  const patterns = [
    { type: 'comment', regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm },
    { type: 'string', regex: /(["'`])(?:\\.|(?!\1).)*\1/g },
    { type: 'number', regex: /\b\d+(\.\d+)?\b/g },
    { type: 'keyword', regex: /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g }
  ];

  return highlightWithTokens(escaped, patterns);
}

// JSON highlighting
function jsonHighlight(code) {
  const escaped = escapeForSpan(code);

  const patterns = [
    { type: 'key', regex: /"(\w+)"(?=\s*:)/g },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"/g },
    { type: 'number', regex: /\b\d+(\.\d+)?\b/g },
    { type: 'boolean', regex: /\b(true|false|null)\b/g }
  ];

  return highlightWithTokens(escaped, patterns);
}

// SQL highlighting
function sqlHighlight(code) {
  const escaped = escapeForSpan(code);

  const patterns = [
    { type: 'comment', regex: /--.*$/gm },
    { type: 'string', regex: /'(?:\\.|[^'\\])*'/g },
    { type: 'number', regex: /\b\d+\b/g },
    { type: 'keyword', regex: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|JOIN|ON|AS|ORDER BY|GROUP BY|LIMIT|OFFSET|DESC|ASC)\b/gi }
  ];

  // We want keywords uppercase in output
  let tokens = [];

  patterns.forEach(({type, regex}) => {
    let match;
    while ((match = regex.exec(escaped)) !== null) {
      let text = match[0];
      if (type === 'keyword') text = text.toUpperCase();
      tokens.push({ start: match.index, end: match.index + match[0].length, type, text });
      if (regex.lastIndex === match.index) regex.lastIndex++;
    }
  });

  tokens.sort((a,b) => a.start - b.start);

  let filtered = [];
  let lastEnd = 0;
  for (const token of tokens) {
    if (token.start >= lastEnd) {
      filtered.push(token);
      lastEnd = token.end;
    }
  }

  let result = '';
  let pos = 0;
  for (const token of filtered) {
    if (pos < token.start) result += escaped.slice(pos, token.start);
    result += `<span class="token ${token.type}">${token.text}</span>`;
    pos = token.end;
  }
  if (pos < escaped.length) result += escaped.slice(pos);

  return result;
}

// HTML/XML highlighting
function htmlHighlight(code) {
  // Escape full code
  const escaped = escapeForSpan(code);
  // Highlight tags only
  const tags = /(&lt;\/?[\w\s="'-.:]+&gt;)/g;

  return escaped.replace(tags, m => `<span class="token tag">${m}</span>`);
}

function highlightCodeBlocks() {
  const preBlocks = content.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;

    const lang = code.className.replace('language-', '').toLowerCase();

    const rawCode = code.textContent;

    let highlighted;

    switch (lang) {
      case 'lua': highlighted = luaHighlight(rawCode); break;
      case 'js':
      case 'javascript': highlighted = jsHighlight(rawCode); break;
      case 'json': highlighted = jsonHighlight(rawCode); break;
      case 'sql': highlighted = sqlHighlight(rawCode); break;
      case 'html':
      case 'xml': highlighted = htmlHighlight(rawCode); break;
      default: highlighted = escapeForSpan(rawCode);
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
