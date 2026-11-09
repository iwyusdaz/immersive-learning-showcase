/**
 * Progressive-enhancement filter for the projects grid. Without JS, all cards show.
 */
const buttons = document.querySelectorAll('.filter-btn');
const status = document.querySelector('.filter-status');
const cards = document.querySelectorAll('.cards > li');

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    cards.forEach((card) => {
      const match = f === 'All' || card.dataset.format === f;
      card.hidden = !match;
      if (match) shown++;
    });
    if (status) status.textContent = `${shown} project${shown === 1 ? '' : 's'} shown.`;
  });
});

// Open the "About the approach" panel when the page is reached via #about (header nav link).
const about = document.getElementById('about');
function openAboutFromHash() {
  if (about && location.hash === '#about') { about.open = true; about.querySelector('summary')?.focus(); }
}
openAboutFromHash();
window.addEventListener('hashchange', openAboutFromHash);
// Close the panel with Escape (focus returns to its button) or a click outside it.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && about?.open) { about.open = false; about.querySelector('summary')?.focus(); }
});
document.addEventListener('click', (e) => {
  if (about?.open && !about.contains(e.target)) about.open = false;
});
