'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// --- Parse docs files ---
const docsFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.docs.md'));

function parseDocs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let name = '';
  let description = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!name && line.startsWith('# ')) {
      name = line.slice(2).trim();
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next && !next.startsWith('#')) {
          description = next;
          break;
        }
      }
      break;
    }
  }
  return { name, description };
}

function gitDate(command) {
  try {
    const result = execSync(command, { cwd: ROOT, encoding: 'utf8' }).trim();
    return result || null;
  } catch (e) {
    return null;
  }
}

const tools = docsFiles.map(docsFile => {
  const baseName = docsFile.replace('.docs.md', '');
  const { name, description } = parseDocs(path.join(ROOT, docsFile));
  const htmlFile = `${baseName}.html`;

  const dateAdded = gitDate(
    `git log --follow --diff-filter=A --format=%aI -- ${htmlFile} | tail -1`
  );
  const dateUpdated = gitDate(
    `git log --follow --format=%aI -1 -- ${htmlFile}`
  );

  return {
    id: baseName,
    name,
    description,
    url: `https://tools.adnomina.dev/${htmlFile}`,
    dateAdded: dateAdded || '1970-01-01T00:00:00Z',
    dateUpdated: dateUpdated || '1970-01-01T00:00:00Z',
  };
});

function byDateAdded(a, b) { return new Date(b.dateAdded) - new Date(a.dateAdded); }
function byDateUpdated(a, b) { return new Date(b.dateUpdated) - new Date(a.dateUpdated); }

const recentlyAdded = [...tools].sort(byDateAdded).slice(0, 3);
const recentlyUpdated = [...tools].sort(byDateUpdated).slice(0, 3);

function formatDate(iso) {
  if (!iso || iso.startsWith('1970')) return 'Unknown';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

const accents = ['violet', 'cyan', 'emerald', 'rose', 'amber', 'sky'];
function getAccent(i) { return accents[i % accents.length]; }

function cardHtml(tool, accent) {
  return `      <a href="${tool.url}" class="block rounded-xl border border-slate-700 bg-slate-800 hover:border-${accent}-500 hover:shadow-lg hover:shadow-${accent}-900/30 transition-all duration-200 p-5 group" data-name="${tool.id}" data-label="${tool.name.toLowerCase()}">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-white group-hover:text-${accent}-400 transition-colors truncate">${tool.name}</h3>
            <p class="mt-1 text-sm text-slate-400 line-clamp-2">${tool.description}</p>
          </div>
          <span class="shrink-0 mt-0.5 inline-flex items-center rounded-full bg-${accent}-900/40 px-2 py-0.5 text-xs font-medium text-${accent}-300 border border-${accent}-800">${tool.id}</span>
        </div>
        <div class="mt-3 flex gap-4 text-xs text-slate-500">
          <span>Added: ${formatDate(tool.dateAdded)}</span>
          <span>Updated: ${formatDate(tool.dateUpdated)}</span>
        </div>
      </a>`;
}

const allCardsHtml = tools.map((t, i) => cardHtml(t, getAccent(i))).join('\n');
const addedCardsHtml = recentlyAdded.map((t, i) => cardHtml(t, getAccent(i))).join('\n');
const updatedCardsHtml = recentlyUpdated.map((t, i) => cardHtml(t, getAccent(i + 1))).join('\n');

const toolsJson = JSON.stringify(tools.map(t => ({
  id: t.id,
  name: t.name,
  description: t.description,
  url: t.url,
})));

const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>adnomina/tools</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = { darkMode: 'class' }
  <\/script>
  <style>
    body { background-color: #0f172a; }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  </style>
</head>
<body class="min-h-screen bg-slate-900 text-slate-100 antialiased">

  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
    <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
      <div>
        <span class="text-lg font-bold tracking-tight text-white">adnomina/<span class="text-violet-400">tools</span></span>
        <p class="text-xs text-slate-500 mt-0.5">Single-file browser tools — no installs, no uploads.</p>
      </div>
      <a href="https://github.com/adnomina/tools" target="_blank" rel="noopener" class="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
        GitHub
      </a>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-10 space-y-12">

    <section>
      <label for="search" class="sr-only">Search tools</label>
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
        <input id="search" type="search" placeholder="Search tools..." class="w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent" autocomplete="off" />
      </div>
      <p id="search-count" class="mt-2 text-xs text-slate-500 hidden"></p>
    </section>

    <section id="section-added">
      <h2 class="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">Recently Added</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
${addedCardsHtml}
      </div>
    </section>

    <section id="section-updated">
      <h2 class="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">Recently Updated</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
${updatedCardsHtml}
      </div>
    </section>

    <section id="section-all">
      <h2 class="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">All Tools <span id="all-count" class="text-slate-600 normal-case tracking-normal font-normal">(${tools.length})</span></h2>
      <div id="all-grid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
${allCardsHtml}
      </div>
      <p id="no-results" class="hidden text-sm text-slate-500 mt-4">No tools match your search.</p>
    </section>

  </main>

  <footer class="border-t border-slate-800 mt-16 py-6">
    <p class="text-center text-xs text-slate-600">Built by <a href="https://github.com/adnomina" class="hover:text-slate-400 transition-colors">adnomina</a> &mdash; all tools run entirely in your browser.</p>
  </footer>

  <script>
    const TOOLS = ${toolsJson};
    const searchEl = document.getElementById('search');
    const allGrid = document.getElementById('all-grid');
    const noResults = document.getElementById('no-results');
    const allCount = document.getElementById('all-count');
    const searchCount = document.getElementById('search-count');
    const sectionAdded = document.getElementById('section-added');
    const sectionUpdated = document.getElementById('section-updated');

    searchEl.addEventListener('input', () => {
      const q = searchEl.value.trim().toLowerCase();
      const cards = allGrid.querySelectorAll('a[data-name]');
      let visible = 0;
      cards.forEach(card => {
        const label = card.getAttribute('data-label') || '';
        const name = card.getAttribute('data-name') || '';
        const desc = card.querySelector('p') ? card.querySelector('p').textContent.toLowerCase() : '';
        const match = !q || label.includes(q) || name.includes(q) || desc.includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      noResults.classList.toggle('hidden', visible > 0);
      allCount.textContent = q ? \`(\${visible} of \${TOOLS.length})\` : \`(\${TOOLS.length})\`;
      if (q) {
        searchCount.textContent = \`\${visible} result\${visible !== 1 ? 's' : ''} for "\${searchEl.value.trim()}"\`;
        searchCount.classList.remove('hidden');
        sectionAdded.style.display = 'none';
        sectionUpdated.style.display = 'none';
      } else {
        searchCount.classList.add('hidden');
        sectionAdded.style.display = '';
        sectionUpdated.style.display = '';
      }
    });
  <\/script>

</body>
</html>
`;

const outPath = path.join(ROOT, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Wrote ' + outPath);
console.log('Tools indexed: ' + tools.map(t => t.id).join(', '));
