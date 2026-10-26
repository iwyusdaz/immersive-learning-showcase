/**
 * build-site.mjs — generate dist/index.html (landing), /credits/, /accessibility/,
 * 404.html, sitemap.xml, robots.txt from templates + content/landing.md + each
 * live project's showcase.json. (08-vercel-deployment.md section 6.3)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const site = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const apps = JSON.parse(readFileSync(join(ROOT, 'apps.json'), 'utf8'));
const landingMd = readFileSync(join(ROOT, 'content', 'landing.md'), 'utf8');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function loadManifests() {
  const out = [];
  for (const app of apps.apps) {
    if (app.status !== 'live') { out.push({ app, manifest: null }); continue; }
    const p = join(DIST, 'play', app.slug, 'showcase.json');
    out.push({ app, manifest: existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null });
  }
  return out;
}

function formatBadge(format) { return `<span class="badge">${esc(format)}</span>`; }

function featureLabels(features) {
  const map = { 'text-mode': 'Text mode', keyboard: 'Keyboard', 'reduced-motion': 'Reduced motion', captions: 'Captions', 'mobile-supported': 'Mobile supported' };
  return features.map((f) => `<li>${esc(map[f] || f)}</li>`).join('');
}

function card(entry) {
  const { app, manifest } = entry;
  if (!manifest) {
    return `<li class="card card-soon">
      <div class="poster poster-fallback" role="img" aria-label="Poster coming soon"></div>
      <h3>${esc(site.comingSoonSummaries[app.slug]?.split('—')[0]?.trim() || app.slug)}</h3>
      <p class="summary">${esc(site.comingSoonSummaries[app.slug] || '')}</p>
      <p class="badge badge-soon">Coming soon</p>
    </li>`;
  }
  const m = manifest;
  return `<li class="card" data-format="${esc(m.format)}" data-niche="${esc(m.niche)}">
    <img class="poster" src="/posters/${esc(app.slug)}-${esc(m.version)}.webp" alt="${esc(m.poster.alt)}" width="1200" height="630" loading="lazy">
    <h3>${esc(m.title)}</h3>
    ${formatBadge(m.format)}
    <p class="meta">${esc(m.niche)} · ${esc(m.audience)}</p>
    <p class="summary">${esc(m.summary)}</p>
    <p class="playtime">About ${esc(String(m.playTimeMinutes))} minutes</p>
    <ul class="features">${featureLabels(m.features)}</ul>
    ${m.contentNotes?.length ? `<p class="content-note">Content note: ${m.contentNotes.map(esc).join('; ')}</p>` : ''}
    <p class="actions">
      <a class="button" href="/play/${esc(m.slug)}/">Play ${esc(m.title)}</a>
      <a class="link" href="${esc(m.repoUrl)}">Case study on GitHub</a>
    </p>
  </li>`;
}

function page({ title, description, body, path }) {
  const canonical = `${site.canonicalUrl}${path === '/' ? '' : path}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles/site.css">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${site.canonicalUrl}/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: site.siteTitle,
  description: site.tagline,
  url: canonical,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: loadManifests().filter((e) => e.manifest).map((e, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: { '@type': 'CreativeWork', name: e.manifest.title, url: `${site.canonicalUrl}/play/${e.manifest.slug}/`, description: e.manifest.summary },
    })),
  },
}, null, 2)}
</script>
</head>
<body>
${body}
<script src="/scripts/filters.js"></script>
</body>
</html>`;
}

const header = (active) => `
<a class="skip-link" href="#main">Skip to projects</a>
<header class="site-header">
  <p class="site-title">${esc(site.siteTitle)}</p>
  <nav aria-label="Main">
    <a href="/#projects" ${active === 'projects' ? 'aria-current="page"' : ''}>Projects</a>
    <a href="/#about" ${active === 'about' ? 'aria-current="page"' : ''}>About</a>
    <a href="${site.owner.github}">GitHub</a>
  </nav>
</header>`;

const footer = `
<footer class="site-footer">
  <p>${esc(site.owner.email)} · <a href="${esc(site.owner.linkedin)}">${esc(site.owner.linkedin)}</a> · <a href="${esc(site.owner.github)}">GitHub</a></p>
  <p><a href="/credits/">Credits</a> · <a href="/accessibility/">Accessibility</a> · Landing page code: MIT · Text: CC BY 4.0 · Built with three.js</p>
  <p>${esc(site.privacyNote)}</p>
</footer>`;

function main() {
  // index.html
  const entries = loadManifests();
  const cards = entries.map(card).join('\n');
  const filters = ['All', 'Game', 'Mini course', 'Hybrid'].map((f) => `<button type="button" class="filter-btn" data-filter="${f}" aria-pressed="${f === 'All'}">${f}</button>`).join('');
  const indexBody = `${header('projects')}
<main id="main">
  <section class="hero">
    <h1>Realistic 3D where it helps learning.</h1>
    <p class="tagline">${esc(site.tagline)}</p>
    <p>Made by <a href="${esc(site.owner.github)}">@iwyusdaz</a> — see <a href="#about">about the approach</a>.</p>
  </section>
  <section id="projects" aria-labelledby="projects-h">
    <h2 id="projects-h" class="visually-hidden">Projects</h2>
    <div class="filters" role="group" aria-label="Filter projects">${filters}</div>
    <p class="filter-status visually-hidden" aria-live="polite"></p>
    <ul class="cards">
${cards}
    </ul>
  </section>
  <section id="about" aria-labelledby="about-h">
    <h2 id="about-h">About the approach</h2>
    <div class="prose">${marked.parse(landingMd)}</div>
    <p><strong>Evaluation status:</strong> ${esc(site.evaluationNote)}</p>
    <p>${esc(site.deviceNote)}</p>
  </section>
</main>
${footer}`;
  writeFileSync(join(DIST, 'index.html'), page({ title: `${site.siteTitle} — immersive learning games and mini courses`, description: site.tagline, body: indexBody, path: '/' }));

  // /credits/ — merge attribution.json from every live project
  const creditSections = entries.filter((e) => e.manifest).map((e) => {
    const attr = JSON.parse(readFileSync(join(DIST, 'play', e.app.slug, 'attribution.json'), 'utf8'));
    const rows = attr.map((a) => `<tr><td>${esc(a.asset)}</td><td>${esc(a.author)}</td><td><a href="${esc(a.source)}">${esc(a.source)}</a></td><td>${esc(a.license)}</td><td>${esc(a.changes || '')}</td></tr>`).join('\n');
    return `<section aria-labelledby="credits-${esc(e.app.slug)}"><h2 id="credits-${esc(e.app.slug)}">${esc(e.manifest.title)}</h2>
    <table><thead><tr><th scope="col">Asset</th><th scope="col">Author</th><th scope="col">Source</th><th scope="col">License</th><th scope="col">Changes</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join('\n');
  const creditsBody = `${header()}
<main id="main"><h1>Credits and attribution</h1>
<p>Every third-party asset used by every project, with its license. Each project's repo carries its own ATTRIBUTION.md.</p>
${creditSections || '<p>No released projects yet.</p>'}
</main>${footer}`;
  mkdirSync(join(DIST, 'credits'), { recursive: true });
  writeFileSync(join(DIST, 'credits', 'index.html'), page({ title: `Credits — ${site.siteTitle}`, description: 'Asset attribution for every project.', body: creditsBody, path: '/credits/' }));

  // /accessibility/
  const a11ySections = entries.filter((e) => e.manifest).map((e) => `<section><h2>${esc(e.manifest.title)}</h2>
  <p>Features: ${(e.manifest.features || []).map(esc).join(', ')}. Full details in the project's README and design/accessibility-plan.md.</p></section>`).join('\n');
  const a11yBody = `${header()}
<main id="main"><h1>Accessibility</h1>
<p>Every project provides: an HTML overlay UI, a text mode covering the same learning objectives and assessment decisions, full keyboard play with a points-of-interest list, pointer alternatives, live-region announcements, reduced-motion support, captions, pause-anywhere, and colorblind-safe cues. The landing page meets WCAG 2.1 AA.</p>
<p><strong>Known limitation:</strong> automated and agent checks only — no testing with real assistive-technology users yet.</p>
${a11ySections || '<p>No released projects yet.</p>'}
</main>${footer}`;
  mkdirSync(join(DIST, 'accessibility'), { recursive: true });
  writeFileSync(join(DIST, 'accessibility', 'index.html'), page({ title: `Accessibility — ${site.siteTitle}`, description: 'Accessibility statement for the site and every project.', body: a11yBody, path: '/accessibility/' }));

  // 404.html
  const notFound = `${header()}
<main id="main"><h1>Page not found</h1><p>That path doesn't exist. Try the <a href="/">projects page</a>.</p></main>${footer}`;
  writeFileSync(join(DIST, '404.html'), page({ title: `Not found — ${site.siteTitle}`, description: 'Page not found.', body: notFound, path: '/404.html' }));

  // sitemap + robots
  const urls = ['/', '/credits/', '/accessibility/', ...entries.filter((e) => e.manifest).map((e) => `/play/${e.app.slug}/`)];
  writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.canonicalUrl}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  writeFileSync(join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + site.canonicalUrl + '/sitemap.xml\n');

  // posters: copy from each project into dist/posters (versioned names)
  mkdirSync(join(DIST, 'posters'), { recursive: true });
  for (const e of entries.filter((e) => e.manifest)) {
    for (const ext of ['webp', 'jpg']) {
      const src = join(DIST, 'play', e.app.slug, `poster-${e.manifest.version}.${ext}`);
      if (existsSync(src)) copyFileSync(src, join(DIST, 'posters', `${e.app.slug}-${e.manifest.version}.${ext}`));
    }
  }

  // site assets
  const assetsDir = join(ROOT, 'src', 'assets');
  if (existsSync(assetsDir)) {
    mkdirSync(join(DIST, 'assets'), { recursive: true });
    for (const f of readdirSync(assetsDir)) copyFileSync(join(assetsDir, f), join(DIST, 'assets', f));
  }
  const scriptsDir = join(ROOT, 'src', 'scripts');
  if (existsSync(scriptsDir)) {
    mkdirSync(join(DIST, 'scripts'), { recursive: true });
    for (const f of readdirSync(scriptsDir)) copyFileSync(join(scriptsDir, f), join(DIST, 'scripts', f));
  }

  // permissions note: vercel.json Permissions-Policy must match manifests
  const needMic = entries.some((e) => e.manifest?.permissions?.includes('microphone'));
  if (!needMic) console.warn('note: no live manifest requests the microphone yet (arrival-english will)');
  console.log('build-site: done');
}

main();
