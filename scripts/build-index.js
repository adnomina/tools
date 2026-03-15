'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function gitDate(htmlFile, mode) {
  try {
    const cmd = mode === 'added'
      ? 'git log --follow --diff-filter=A --format=%aI -- "' + htmlFile + '" | tail -1'
      : 'git log --follow --format=%aI -1 -- "' + htmlFile + '"';
    const result = execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
    return result || null;
  } catch (e) {
    return null;
  }
}

function parseDocs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let name = '';
  let description = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      name = lines[i].slice(2).trim();
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim()) {
          description = lines[j].trim();
          break;
        }
      }
      break;
    }
  }
  return { name, description };
}

const docsFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.docs.md')).sort();

const tools = docsFiles.map(docsFile => {
  const slug = docsFile.replace('.docs.md', '');
  const htmlFile = slug + '.html';
  const { name, description } = parseDocs(path.join(ROOT, docsFile));
  const dateAdded = gitDate(htmlFile, 'added');
  const dateUpdated = gitDate(htmlFile, 'updated');
  return { slug, name, description, dateAdded, dateUpdated };
});

function byDateDesc(field) {
  return (a, b) => {
    if (!a[field] && !b[field]) return 0;
    if (!a[field]) return 1;
    if (!b[field]) return -1;
    return new Date(b[field]) - new Date(a[field]);
  };
}

const recentlyAdded = [...tools].sort(byDateDesc('dateAdded')).slice(0, 3);
const recentlyUpdated = [...tools].sort(byDateDesc('dateUpdated')).slice(0, 3);

const emojiMap = {
  'dice-roller': '\u{1F3B2}',
  'hn-comment-tracker': '\u{1F50D}',
  'markdown-preview': '\u{1F4DD}',
};

function toolEmoji(slug) {
  return emojiMap[slug] || '\u{1F6E0}\uFE0F';
}

function formatDate(iso) {
  if (!iso) return 'Unknown';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cardHTML(tool, extraClass) {
  const emoji = toolEmoji(tool.slug);
  const url = 'https://tools.adnomina.dev/' + tool.slug + '.html';
  return [
    '      <a href="' + url + '" target="_blank" rel="noopener noreferrer"',
    '         class="tool-card block rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 ' + extraClass + '"',
    '         data-name="' + esc(tool.name.toLowerCase()) + '" data-desc="' + esc(tool.description.toLowerCase()) + '" data-slug="' + tool.slug + '">',
    '        <div class="text-4xl mb-3">' + emoji + '</div>',
    '        <h3 class="text-xl font-bold mb-1 text-gray-800">' + esc(tool.name) + '</h3>',
    '        <p class="text-gray-600 text-sm leading-relaxed">' + esc(tool.description) + '</p>',
    '        <div class="mt-4 text-xs text-gray-400 flex gap-4">',
    '          <span>Added: ' + formatDate(tool.dateAdded) + '</span>',
    '          <span>Updated: ' + formatDate(tool.dateUpdated) + '</span>',
    '        </div>',
    '      </a>',
  ].join('\n');
}

const allCardsHTML = tools.map(t => cardHTML(t, 'bg-white')).join('\n');
const recentlyAddedHTML = recentlyAdded.map(t => cardHTML(t, 'bg-gradient-to-br from-yellow-50 to-orange-50')).join('\n');
const recentlyUpdatedHTML = recentlyUpdated.map(t => cardHTML(t, 'bg-gradient-to-br from-blue-50 to-cyan-50')).join('\n');

const toolsJSON = JSON.stringify(tools);

const searchScript = [
  '    const tools = ' + toolsJSON + ';',
  "    const searchInput = document.getElementById('search');",
  "    const allToolsGrid = document.getElementById('all-tools');",
  "    const noResults = document.getElementById('no-results');",
  "    const toolCount = document.getElementById('tool-count');",
  "    const sectionAdded = document.getElementById('section-added');",
  "    const sectionUpdated = document.getElementById('section-updated');",
  "    searchInput.addEventListener('input', () => {",
  "      const q = searchInput.value.toLowerCase().trim();",
  "      const cards = allToolsGrid.querySelectorAll('.tool-card');",
  '      let visible = 0;',
  '      cards.forEach(card => {',
  '        const match = !q ||',
  '          card.dataset.name.includes(q) ||',
  '          card.dataset.desc.includes(q) ||',
  '          card.dataset.slug.includes(q);',
  "        card.classList.toggle('hidden-card', !match);",
  '        if (match) visible++;',
  '      });',
  "      noResults.classList.toggle('hidden', visible > 0);",
  '      toolCount.textContent = q ? (visible + " of " + tools.length + " tools") : (tools.length + " tools");',
  '      const searching = q.length > 0;',
  "      sectionAdded.classList.toggle('hidden', searching);",
  "      sectionUpdated.classList.toggle('hidden', searching);",
  '    });',
].join('\n');

const html = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '  <meta charset="UTF-8" />',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  '  <title>adnomina/tools \u2014 All Tools</title>',
  '  <script src="https://cdn.tailwindcss.com"><\/script>',
  '  <style>',
  "    body { font-family: 'Segoe UI', system-ui, sans-serif; }",
  '    .hero-gradient {',
  '      background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #fda085 100%);',
  '    }',
  '    .tool-card { border: 1.5px solid #e5e7eb; }',
  '    .tool-card:hover { border-color: #a78bfa; }',
  '    #search:focus { outline: none; box-shadow: 0 0 0 3px rgba(167,139,250,0.4); }',
  '    .hidden-card { display: none !important; }',
  '    .section-badge {',
  '      display: inline-block;',
  '      padding: 2px 12px;',
  '      border-radius: 9999px;',
  '      font-size: 0.75rem;',
  '      font-weight: 700;',
  '      letter-spacing: 0.05em;',
  '      text-transform: uppercase;',
  '    }',
  '  </style>',
  '</head>',
  '<body class="bg-gray-50 min-h-screen">',
  '',
  '  <header class="hero-gradient text-white py-20 px-4 text-center relative overflow-hidden">',
  '    <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px); background-size: 60px 60px;"></div>',
  '    <div class="relative z-10">',
  '      <div class="text-6xl mb-4">\u{1F9F0}</div>',
  '      <h1 class="text-5xl font-extrabold mb-3 drop-shadow-lg">adnomina/tools</h1>',
  '      <p class="text-xl opacity-90 max-w-xl mx-auto">A collection of small, self-contained browser tools. No installs, no accounts \u2014 just open and use.</p>',
  '      <div class="mt-8 max-w-lg mx-auto">',
  '        <input',
  '          id="search"',
  '          type="text"',
  '          placeholder="Search tools..."',
  '          class="w-full px-5 py-3 rounded-2xl text-gray-800 text-base shadow-xl border-0 bg-white/95 placeholder-gray-400"',
  '        />',
  '      </div>',
  '    </div>',
  '  </header>',
  '',
  '  <main class="max-w-5xl mx-auto px-4 py-12 space-y-14">',
  '',
  '    <section id="section-added">',
  '      <div class="flex items-center gap-3 mb-6">',
  '        <span class="text-3xl">\u2728</span>',
  '        <h2 class="text-2xl font-extrabold text-gray-800">Recently Added</h2>',
  '        <span class="section-badge bg-yellow-100 text-yellow-700">New</span>',
  '      </div>',
  '      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="recently-added">',
  recentlyAddedHTML,
  '      </div>',
  '    </section>',
  '',
  '    <section id="section-updated">',
  '      <div class="flex items-center gap-3 mb-6">',
  '        <span class="text-3xl">\u{1F504}</span>',
  '        <h2 class="text-2xl font-extrabold text-gray-800">Recently Updated</h2>',
  '        <span class="section-badge bg-blue-100 text-blue-700">Updated</span>',
  '      </div>',
  '      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="recently-updated">',
  recentlyUpdatedHTML,
  '      </div>',
  '    </section>',
  '',
  '    <section id="section-all">',
  '      <div class="flex items-center gap-3 mb-6">',
  '        <span class="text-3xl">\u{1F6E0}\uFE0F</span>',
  '        <h2 class="text-2xl font-extrabold text-gray-800">All Tools</h2>',
  '        <span class="section-badge bg-purple-100 text-purple-700" id="tool-count">' + tools.length + ' tools</span>',
  '      </div>',
  '      <div id="no-results" class="hidden text-center py-16 text-gray-400 text-lg">No tools match your search.</div>',
  '      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="all-tools">',
  allCardsHTML,
  '      </div>',
  '    </section>',
  '',
  '  </main>',
  '',
  '  <footer class="text-center py-10 text-gray-400 text-sm">',
  '    <p>Built with love by <a href="https://github.com/adnomina" class="text-purple-500 hover:underline">adnomina</a>. All tools run entirely in your browser.</p>',
  '  </footer>',
  '',
  '  <script>',
  searchScript,
  '  <\/script>',
  '</body>',
  '</html>',
].join('\n');

const outPath = path.join(ROOT, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Written: ' + outPath);
console.log('Tools indexed: ' + tools.map(t => t.slug).join(', '));
