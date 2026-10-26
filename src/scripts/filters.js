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
