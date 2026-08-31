(() => {
  'use strict';
  const FAVORITES_KEY = 'mocar:favorites';
  const COMPARE_KEY = 'mocar:compare';
  const readSet = (key) => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } };
  const writeSet = (key, set) => localStorage.setItem(key, JSON.stringify([...set]));
  let favorites = readSet(FAVORITES_KEY);
  let compare = readSet(COMPARE_KEY);
  const emitFavorites = () => document.dispatchEvent(new CustomEvent('mocar:favorites:change', { detail: { ids: [...favorites], count: favorites.size } }));
  const emitCompare = () => document.dispatchEvent(new CustomEvent('mocar:compare:change', { detail: { ids: [...compare], count: compare.size } }));

  const syncButtons = () => {
    document.querySelectorAll('[data-favorite-car]').forEach(btn => {
      const active = favorites.has(btn.dataset.favoriteCar);
      btn.classList.toggle('is-active', active); btn.setAttribute('aria-pressed', active ? 'true':'false');
      const label = active ? 'Убрать из избранного' : 'Добавить в избранное';
      btn.setAttribute('aria-label', label); btn.dataset.tooltip = label;
      if (btn.classList.contains('vehicle-action')) { const text = btn.querySelector('span'); if (text) text.textContent = active ? 'В избранном' : 'В избранное'; }
    });
    document.querySelectorAll('[data-compare-car]').forEach(btn => {
      const active = compare.has(btn.dataset.compareCar);
      btn.classList.toggle('is-active', active); btn.setAttribute('aria-pressed', active ? 'true':'false');
      const label = active ? 'Убрать из сравнения' : 'Добавить к сравнению';
      btn.setAttribute('aria-label', label); btn.dataset.tooltip = label;
      if (btn.classList.contains('vehicle-action')) { const text = btn.querySelector('span'); if (text) text.textContent = active ? 'В сравнении' : 'Сравнить'; }
    });
  };

  document.addEventListener('click', (event) => {
    const fav = event.target.closest('[data-favorite-car]');
    if (fav) {
      event.preventDefault(); event.stopPropagation();
      const id = fav.dataset.favoriteCar;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      writeSet(FAVORITES_KEY, favorites); syncButtons(); emitFavorites(); return;
    }
    const cmp = event.target.closest('[data-compare-car]');
    if (cmp) {
      event.preventDefault(); event.stopPropagation();
      const id = cmp.dataset.compareCar;
      if (compare.has(id)) compare.delete(id); else if (compare.size < 4) compare.add(id);
      writeSet(COMPARE_KEY, compare); syncButtons(); emitCompare(); return;
    }
  });

  // image galleries
  document.querySelectorAll('[data-vehicle-gallery]').forEach(gallery => {
    const slides=[...gallery.querySelectorAll('[data-gallery-slide]')];
    const thumbs=[...gallery.querySelectorAll('[data-gallery-thumb]')];
    let index=0;
    const show=(next)=>{
      index=(next+slides.length)%slides.length;
      slides.forEach((s,i)=>{s.hidden=i!==index; s.classList.toggle('is-active',i===index);});
      thumbs.forEach((t,i)=>{t.classList.toggle('is-active',i===index); t.setAttribute('aria-current',i===index?'true':'false');});
      const counter=gallery.querySelector('[data-gallery-counter]'); if(counter) counter.textContent=`${index+1}/${slides.length}`;
    };
    gallery.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>show(index-1));
    gallery.querySelector('[data-gallery-next]')?.addEventListener('click',()=>show(index+1));
    thumbs.forEach((t,i)=>t.addEventListener('click',()=>show(i)));
    show(0);
  });

  // Marketplace-like photo preview inside vehicle cards.
  // Desktop: horizontal pointer position selects a photo. Touch: swipe.
  document.querySelectorAll('[data-card-gallery]').forEach(gallery => {
    const allSlides=[...gallery.querySelectorAll('[data-card-slide]')];
    const totalPhotos=Math.max(allSlides.length, Number(gallery.dataset.totalPhotos || 0));
    const slides=allSlides.slice(0,5);
    const dots=[...gallery.querySelectorAll('[data-card-dot]')];
    allSlides.slice(5).forEach((slide)=>{ slide.hidden=true; });
    dots.forEach((dot,i)=>{ dot.hidden=i>=slides.length; });
    if(slides.length < 2) return;
    let more=gallery.querySelector('.car-card-gallery__more');
    if(totalPhotos>5 && slides.length===5){
      more=document.createElement('div');
      more.className='car-card-gallery__more';
      more.hidden=true;
      more.setAttribute('aria-hidden','true');
      more.innerHTML=`<svg viewBox="0 0 48 48"><path d="M16 14l3-5h10l3 5h6a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4h6Z"></path><circle cx="24" cy="27" r="8"></circle></svg><span>Ещё ${totalPhotos-5} фото</span>`;
      gallery.append(more);
    }
    let index=0;
    let touchStartX=0, touchStartY=0;
    let suppressClick=false;

    const show=(next)=>{
      index=Math.max(0,Math.min(slides.length-1,next));
      slides.forEach((el,i)=>{ el.hidden=i!==index; });
      dots.forEach((dot,i)=>dot.classList.toggle('is-active',i===index));
      if(more) more.hidden=index!==4;
    };

    const fromPointer=(event)=>{
      if(event.pointerType==='touch' || event.target.closest('.car-card__tools')) return;
      const rect=gallery.getBoundingClientRect();
      if(!rect.width) return;
      const ratio=Math.max(0,Math.min(.999,(event.clientX-rect.left)/rect.width));
      show(Math.floor(ratio*slides.length));
    };

    gallery.addEventListener('pointerenter',fromPointer);
    gallery.addEventListener('pointermove',fromPointer);
    gallery.addEventListener('pointerleave',(event)=>{
      if(event.pointerType!=='touch') show(0);
    });

    gallery.addEventListener('touchstart',(event)=>{
      const touch=event.touches[0];
      touchStartX=touch.clientX; touchStartY=touch.clientY;
    },{passive:true});
    gallery.addEventListener('touchend',(event)=>{
      const touch=event.changedTouches[0];
      const dx=touch.clientX-touchStartX, dy=touch.clientY-touchStartY;
      if(Math.abs(dx)>42 && Math.abs(dx)>Math.abs(dy)*1.2){
        show(index+(dx<0?1:-1));
        suppressClick=true;
        window.setTimeout(()=>{suppressClick=false;},360);
      }
    },{passive:true});
    show(0);
  });

  // Comparison is rendered as a catalog-grid view on /cars/.

  const swipe = (node, onPrev, onNext) => {
    let startX = 0, startY = 0;
    node.addEventListener('touchstart', (e) => { const t=e.touches[0]; startX=t.clientX; startY=t.clientY; }, {passive:true});
    node.addEventListener('touchend', (e) => { const t=e.changedTouches[0]; const dx=t.clientX-startX, dy=t.clientY-startY; if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.25){ dx<0 ? onNext() : onPrev(); } }, {passive:true});
  };
  document.querySelectorAll('[data-vehicle-gallery]').forEach(gallery => {
    const prev=gallery.querySelector('[data-gallery-prev]'), next=gallery.querySelector('[data-gallery-next]');
    swipe(gallery, ()=>prev?.click(), ()=>next?.click());
  });

  syncButtons();
  emitFavorites();
  emitCompare();
})();