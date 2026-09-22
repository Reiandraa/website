const root = document.querySelector('.archive-main');
const filters = [...root.querySelectorAll('[data-filter]')];
const views = [...root.querySelectorAll('[data-view]')];
let category = 'All';
let view = 'grid';
function render() {
  let count = 0;
  root.querySelectorAll('.work-card').forEach(card => {
    card.hidden = category !== 'All' && card.dataset.category !== category;
    if (!card.hidden) count++;
  });
  root.querySelectorAll('.index-row').forEach(row => {
    row.hidden = category !== 'All' && row.dataset.category !== category;
  });
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  views.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  root.querySelector('#work-grid').hidden = view !== 'grid' || !count;
  root.querySelector('#work-index').hidden = view !== 'index' || !count;
  root.querySelector('.archive-empty').hidden = !!count;
  root.querySelector('.archive-count').textContent = `${count} ${count === 1 ? 'work' : 'works'}${category === 'All' ? '' : ' · ' + category}`;
}
filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; render(); }));
views.forEach(button => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
root.querySelector('[data-show-all]').addEventListener('click', () => { category = 'All'; render(); filters[0].focus(); });
root.querySelector('.archive-controls').hidden = false;
render();
