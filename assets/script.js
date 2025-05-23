// Markdown docs navigation & loading + dark/light toggle + Prism highlight

const mdContainer = document.getElementById('markdown-content');
const navLinks = document.querySelectorAll('.nav-link');
const themeToggle = document.getElementById('theme-toggle');
const prismDarkTheme = document.getElementById('prism-dark-theme');

function fetchAndRenderMarkdown(path) {
  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load ${path}: ${res.statusText}`);
      return res.text();
    })
    .then(mdText => {
      // Convert markdown to HTML with syntax highlight
      const html = marked.parse(mdText, {
        highlight: function(code, lang) {
          if (Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
          }
          return code; // fallback, no highlight
        }
      });
      mdContainer.innerHTML = html;
      Prism.highlightAll();
    })
    .catch(err => {
      mdContainer.innerHTML = `<p style="color:red;">Error loading markdown file: ${err.message}</p>`;
    });
}

// Navigation click handler
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    // Update active link
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    // Load markdown
    const mdFile = link.getAttribute('data-md');
    fetchAndRenderMarkdown(mdFile);
  });
});

// Theme toggle function
function setTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  if (isDark) {
    prismDarkTheme.removeAttribute('disabled');
  } else {
    prismDarkTheme.setAttribute('disabled', 'true');
  }
  localStorage.setItem('darkMode', isDark);
}

// Load saved theme or default to light
const savedDarkMode = localStorage.getItem('darkMode') === 'true';
setTheme(savedDarkMode);

// Toggle button event
themeToggle.addEventListener('click', () => {
  setTheme(!document.body.classList.contains('dark'));
});

// Load initial markdown (first nav link)
fetchAndRenderMarkdown(navLinks[0].getAttribute('data-md'));
