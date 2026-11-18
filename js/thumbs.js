// The viewer for thumbnail rows: a thumbnail opens a copy of its artifact at full size in a modal dialog. Arrow keys or
// the arrow buttons step through the row, Escape or Close shuts it, and focus goes back to the thumbnail it came from.
(() => {
  if (!document.querySelector('.thumbs')) return;
  document.body.insertAdjacentHTML('beforeend', `<dialog class="lb" aria-labelledby="lb-cap">
<div class="lb-bar"><p class="label" id="lb-n"></p>
  <div class="lb-btns"><button type="button" data-go="-1" aria-label="Previous">←</button><button type="button" data-go="1" aria-label="Next">→</button><button type="button" data-go="close">Close</button></div></div>
<div class="lb-stage"></div>
<p class="lb-cap" id="lb-cap"></p>
</dialog>`);
  const dlg = document.querySelector('.lb'), stage = dlg.querySelector('.lb-stage');
  let row = [], i = 0;
  const show = () => {
    const fig = row[i].closest('figure');
    const view = row[i].querySelector('.tn-v').cloneNode(true);
    view.querySelectorAll('[id]').forEach(el => {        // keep ids unique; relabel what pointed at them
      const old = el.id, id = old + '-lb'; el.id = id;
      view.querySelectorAll(`[aria-labelledby="${old}"]`).forEach(x => x.setAttribute('aria-labelledby', id));
    });
    view.querySelectorAll('img[loading]').forEach(img => img.removeAttribute('loading'));
    view.querySelectorAll('video').forEach(v => { v.controls = true; v.src = v.getAttribute('src').replace(/#t=.*/, ''); });
    stage.replaceChildren(...view.childNodes);
    stage.scrollTo(0, 0);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) stage.querySelector('video')?.play().catch(() => {});
    dlg.querySelector('.lb-cap').textContent = fig.querySelector('figcaption').textContent;
    const tag = fig.querySelector('.tn-tag');
    dlg.querySelector('#lb-n').textContent = `${i + 1} of ${row.length}` + (tag ? ` · ${tag.textContent}` : '');
  };
  const go = d => { i = (i + d + row.length) % row.length; show(); };
  document.querySelectorAll('.thumbs').forEach(list => {
    const btns = [...list.querySelectorAll('.tn')];
    btns.forEach((b, k) => {
      b.setAttribute('aria-label', 'View larger: ' + b.closest('figure').querySelector('figcaption').textContent);
      b.addEventListener('click', () => { row = btns; i = k; show(); dlg.showModal(); dlg.querySelector('[data-go="close"]').focus(); });
    });
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg) return dlg.close();           // a click on the backdrop
    const b = e.target.closest('[data-go]'); if (!b) return;
    if (b.dataset.go === 'close') dlg.close(); else go(Number(b.dataset.go));
  });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
  });
  dlg.addEventListener('close', () => { stage.replaceChildren(); row[i]?.focus(); });   // back to the thumbnail last shown
})();
