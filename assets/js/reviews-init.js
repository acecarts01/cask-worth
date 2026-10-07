(function() {
  const slider = document.getElementById('rev-slider');
  const dotsWrap = document.getElementById('rev-dots');
  if (!slider) return;

  function renderStars(rating) {
    let stars = '<div style="display:flex; gap:2px;">';
    const full = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      const color = i < full ? '#00b67a' : '#dcdce6';
      stars += `
        <div style="width:18px;height:18px;background:${color};display:flex;align-items:center;justify-content:center;border-radius:1px;">
          <svg width="10" height="10" fill="#fff"><use href="#tpStar"></use></svg>
        </div>`;
    }
    stars += '</div>';
    return stars;
  }

  function initSlider() {
    const reviews = window.CASKWORTH_REVIEWS || [];
    if (reviews.length === 0) return;

    // We take a subset for the slider (e.g. 15 reviews)
    const sliderReviews = reviews.slice(0, 15);
    
    let html = '';
    sliderReviews.forEach(rev => {
      html += `
        <div class="rev-card" style="background:#fff; border-color:#eee; color:#191919;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
            ${renderStars(rev.rating)}
            <span style="font-size:11px; color:#696a7d; font-weight:500;">Verified</span>
          </div>
          <p class="rev-text" style="color:#191919; font-weight:500; font-style:normal; font-size:14px; line-height:1.5;">${rev.text}</p>
          <div class="rev-foot" style="border-top-color:#f2f2f5;">
            <div class="rev-avatar" style="background:#f2f2f5; color:#191919; border:1px solid #eee;">${rev.initials}</div>
            <div>
              <div class="rev-name" style="color:#191919; font-size:14px;">
                ${rev.name}
              </div>
              <div class="rev-loc" style="color:#696a7d; display:flex; align-items:center; gap:4px;">
                ${rev.location}
                <svg class="rev-flag" width="14" height="10" aria-hidden="true">
                  <use href="#flag${rev.country}"></use>
                </svg>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    // Add "View More" card
    html += `
      <a href="/reviews/" class="rev-card view-more-card" style="justify-content:center; align-items:center; text-align:center; background:#f9f9fb; border-style:dashed; border-color:#ccc;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:12px;">
           <svg width="24" height="24" aria-hidden="true"><use href="#tpLogo"></use></svg>
           <span style="font-weight:700; color:#191919;">Trustpilot</span>
        </div>
        <div style="font-size:32px; font-weight:700; color:#00b67a; margin-bottom:4px;">+4,700</div>
        <div style="font-weight:600; color:#191919; font-size:15px;">Customer Reviews</div>
        <div class="btn btn-sm" style="margin-top:20px; background:#191919; color:#fff; border-radius:4px;">Read All →</div>
      </a>
    `;

    slider.innerHTML = html;

    // Initialize slider functionality
    const cards = slider.querySelectorAll('.rev-card');
    cards.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'rev-dot';
      d.setAttribute('aria-label', 'Go to review ' + (i + 1));
      d.onclick = () => scrollToCard(i);
      dotsWrap.appendChild(d);
    });

    const dots = dotsWrap.querySelectorAll('.rev-dot');
    function padLeft() { return parseFloat(getComputedStyle(slider).scrollPaddingLeft) || 0; }
    function targetLeft(i) { return cards[i].offsetLeft - padLeft(); }
    
    function currentIndex() {
      const sl = slider.scrollLeft;
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((_, i) => {
        const d = Math.abs(targetLeft(i) - sl);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    }

    function updateDots() {
      const idx = currentIndex();
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }

    let animFrame = null;
    function animateTo(target, duration = 420) {
      if (animFrame) cancelAnimationFrame(animFrame);
      const start = slider.scrollLeft;
      const change = target - start;
      let startTime = null;
      if (Math.abs(change) < 1) return;
      function step(ts) {
        if (!startTime) startTime = ts;
        const t = Math.min(1, (ts - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        slider.scrollLeft = start + change * eased;
        if (t < 1) animFrame = requestAnimationFrame(step);
        else animFrame = null;
      }
      animFrame = requestAnimationFrame(step);
    }

    function scrollToCard(i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      animateTo(targetLeft(i));
    }

    window.revSliderMove = (dir) => scrollToCard(currentIndex() + dir);
    
    let scrollTimer;
    slider.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateDots, 100);
    }, { passive: true });
    
    updateDots();

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer;
    function startAuto() {
      if (reduceMotion) return;
      stopAuto();
      timer = setInterval(() => {
        const next = (currentIndex() + 1) % cards.length;
        scrollToCard(next);
      }, 5500);
    }
    function stopAuto() { clearInterval(timer); }
    
    const wrap = slider.closest('.rev-slider-wrap') || slider;
    wrap.addEventListener('pointerdown', stopAuto);
    wrap.addEventListener('mouseenter', stopAuto);
    wrap.addEventListener('mouseleave', startAuto);
    wrap.addEventListener('focusin', stopAuto);
    startAuto();
  }

  // --- Pop-up Logic ---
  function initPopup() {
    const reviews = window.CASKWORTH_REVIEWS || [];
    if (reviews.length === 0) return;

    const style = document.createElement('style');
    style.textContent = `
      #review-popup {
        position: fixed;
        bottom: 90px;
        left: 20px;
        width: 320px;
        background: #fff;
        border: 1px solid #eee;
        border-radius: 4px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        padding: 16px;
        z-index: 550;
        transform: translateX(-380px);
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      #review-popup.show {
        transform: translateX(0);
      }
      .rp-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: var(--muted2);
        cursor: pointer;
        font-size: 16px;
      }
      .rp-stars { display: flex; gap: 2px; }
      .rp-star { color: #f4a800; font-size: 12px; }
      .rp-text { font-size: 12px; line-height: 1.5; color: var(--text); font-style: italic; }
      .rp-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted); }
      .rp-avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--goldbg); color: var(--gold-a11y); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; }
    `;
    document.head.appendChild(style);

    const popup = document.createElement('div');
    popup.id = 'review-popup';
    document.body.appendChild(popup);

    function showRandomReview() {
      const rev = reviews[Math.floor(Math.random() * reviews.length)];
      const starsHtml = renderStars(rev.rating);
      
      popup.innerHTML = `
        <button type="button" class="rp-close" onclick="this.parentElement.classList.remove('show')" aria-label="Close">&times;</button>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <svg width="20" height="20" aria-hidden="true"><use href="#tpLogo"></use></svg>
          <span style="font-weight:700; color:#191919; font-size:14px;">Trustpilot</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
          ${starsHtml}
          <span style="font-size:10px; color:#00b67a; font-weight:700; text-transform:uppercase; letter-spacing:0.02em;">Verified</span>
        </div>
        <p class="rp-text" style="color:#191919; font-weight:500; font-style:normal;">${rev.text}</p>
        <div class="rp-meta">
          <div class="rp-avatar" style="background:#f2f2f5; color:#191919; border:1px solid #eee;">${rev.initials}</div>
          <span style="color:#696a7d;"><strong>${rev.name}</strong> from ${rev.location}</span>
        </div>
      `;
      popup.classList.add('show');
      setTimeout(() => {
        popup.classList.remove('show');
      }, 7000);
    }

    // Every 40 seconds
    setInterval(showRandomReview, 40000);
    // Initial delay of 10s
    setTimeout(showRandomReview, 10000);
  }

  if (window.CASKWORTH_REVIEWS) {
    initSlider();
    initPopup();
  } else {
    window.addEventListener('load', () => {
      initSlider();
      initPopup();
    });
  }
})();
