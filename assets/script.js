const content = document.getElementById('markdown-content');
const links = document.querySelectorAll('.nav-link');
const themeToggle = document.getElementById('theme-toggle');

// Escape HTML special characters in code text
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
}

// Simple Lua syntax highlighter (extend as needed)
function luaHighlight(code) {
  // keywords
  const keywords = /\b(and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g;
  // comments -- single line
  const comments = /--.*$/gm;
  // strings (single or double quotes)
  const strings = /(["'])(?:(?=(\\?))\2.)*?\1/g;

  code = code.replace(comments, '<span class="token comment">$&</span>');
  code = code.replace(strings, '<span class="token string">$&</span>');
  code = code.replace(keywords, '<span class="token keyword">$&</span>');
  return code;
}

// JavaScript syntax highlighter
function jsHighlight(code) {
  const keywords = /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|async|await)\b/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;

  code = code.replace(comments, '<span class="token comment">$&</span>');
  code = code.replace(strings, '<span class="token string">$&</span>');
  code = code.replace(keywords, '<span class="token keyword">$&</span>');
  return code;
}

// JSON syntax highlighter
function jsonHighlight(code) {
  code = code.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*?"(\s*:)?)/g, match => {
    let cls = 'string';
    if (/:$/.test(match)) cls = 'key';
    return `<span class="token ${cls}">${match}</span>`;
  });
  code = code.replace(/\b(true|false|null)\b/g, '<span class="token boolean">$1</span>');
  code = code.replace(/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g, '<span class="token number">$&</span>');
  return code;
}

// SQL syntax highlighter
function sqlHighlight(code) {
  const keywords = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|ON|AS|AND|OR|NOT|NULL|IN|IS|LIKE|GROUP BY|ORDER BY|LIMIT|OFFSET|CREATE|TABLE|PRIMARY KEY|FOREIGN KEY|VALUES|ALTER|DROP|INDEX|VIEW|TRIGGER|UNION|ALL)\b/gi;
  code = code.replace(keywords, '<span class="token keyword">$&</span>');
  const strings = /(['"])(?:(?=(\\?))\2.)*?\1/g;
  code = code.replace(strings, '<span class="token string">$&</span>');
  return code;
}

// HTML syntax highlighter
function htmlHighlight(code) {
  // tags
  code = code.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token comment">$1</span>');
  code = code.replace(/(&lt;\/?[\w-]+)([^&]*?)(&gt;)/g, (m, p1, p2, p3) => {
    let tag = `<span class="token tag">${p1}</span>`;
    let attrs = p2.replace(/([\w-:]+)(="[^"]*")?/g, (m2, name, value) => {
      let attrName = `<span class="token attr-name">${name}</span>`;
      let attrValue = value ? `<span class="token attr-value">${value}</span>` : '';
      return attrName + attrValue;
    });
    return tag + attrs + `<span class="token tag">${p3}</span>`;
  });
  return code;
}

function highlightCodeBlocks() {
  const codeBlocks = content.querySelectorAll('pre code');
  codeBlocks.forEach(code => {
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

    code.innerHTML = html;
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