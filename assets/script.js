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

// Load page based on URL hash or default
const initialHash = location.hash.substring(1);
const initialFile = initialHash ? initialHash + '.md' : 'anticheat.md';
const initialLink = Array.from(links).find(l => l.getAttribute('data-md') === initialFile);
if (initialLink) initialLink.classList.add('active');
loadMarkdown(initialFile);


// Minimal syntax highlighter for FiveM languages
function highlightCodeBlocks() {
  const codeBlocks = content.querySelectorAll('pre code');
  codeBlocks.forEach(code => {
    const lang = code.className.replace('language-', '').toLowerCase();
    let html = code.textContent;

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

// Basic Lua syntax highlight
function luaHighlight(code) {
  // Keywords
  code = code.replace(/\b(and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g,
    '<span class="token keyword">$1</span>');
  // Strings (single or double quotes)
  code = code.replace(/(".*?"|'.*?')/g, '<span class="token string">$1</span>');
  // Comments --
  code = code.replace(/--.*$/gm, '<span class="token comment">$&</span>');
  // Numbers
  code = code.replace(/\b\d+(\.\d+)?\b/g, '<span class="token number">$&</span>');
  return code;
}

// Basic JS syntax highlight
function jsHighlight(code) {
  // Keywords
  code = code.replace(/\b(const|let|var|if|else|for|while|function|return|break|new|try|catch|throw|class|extends|switch|case|default|import|from|export|async|await|typeof|instanceof|in)\b/g,
    '<span class="token keyword">$1</span>');
  // Strings
  code = code.replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="token string">$1</span>');
  // Comments //
  code = code.replace(/\/\/.*$/gm, '<span class="token comment">$&</span>');
  // Comments /* */
  code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="token comment">$&</span>');
  // Numbers
  code = code.replace(/\b\d+(\.\d+)?\b/g, '<span class="token number">$&</span>');
  return code;
}

// Basic JSON syntax highlight
function jsonHighlight(code) {
  // Strings (property names and values)
  code = code.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:))/g,
    '<span class="token keyword">$1</span>'); // keys
  code = code.replace(/(:\s*)("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")/g,
    '$1<span class="token string">$2</span>'); // string values
  // Numbers
  code = code.replace(/\b\d+(\.\d+)?\b/g, '<span class="token number">$&</span>');
  // Booleans and null
  code = code.replace(/\b(true|false|null)\b/g, '<span class="token boolean">$1</span>');
  return code;
}

// Basic SQL syntax highlight
function sqlHighlight(code) {
  // Keywords (common SQL commands)
  code = code.replace(/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|AND|OR|NOT|NULL|JOIN|ON|IN|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|CREATE|TABLE|PRIMARY|KEY|FOREIGN|VALUES|SET|ALTER|DROP|TRUNCATE|DISTINCT)\b/gi,
    '<span class="token keyword">$1</span>');
  // Strings
  code = code.replace(/('.*?')/g, '<span class="token string">$1</span>');
  // Comments --
  code = code.replace(/--.*$/gm, '<span class="token comment">$&</span>');
  // Numbers
  code = code.replace(/\b\d+(\.\d+)?\b/g, '<span class="token number">$&</span>');
  return code;
}

// Basic HTML syntax highlight
function htmlHighlight(code) {
  // Tags
  code = code.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token comment">$1</span>'); // comments
  code = code.replace(/(&lt;\/?[a-zA-Z][^&gt;\s]*)([^&gt;]*)(&gt;)/g, function(_, tagOpen, attrs, tagClose) {
    attrs = attrs.replace(/([a-zA-Z-:]+)(="[^"]*")?/g,
      '<span class="token attr-name">$1</span>$2');
    return '<span class="token tag">' + tagOpen + '</span>' + attrs + '<span class="token tag">' + tagClose + '</span>';
  });
  return code;
}
