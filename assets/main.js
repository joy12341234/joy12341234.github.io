// 첫 화면 렌즈: 커서(터치) 위치에 그린 스크린 촬영 원본을 보여 준다
(() => {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const btn = stage.querySelector('.raw-toggle');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lensSize = () => Math.max(96, Math.min(180, stage.clientWidth * 0.14));

  // 현재값(x, y, r)이 목표값(tx, ty, tr)을 부드럽게 따라간다
  let x = 0, y = 0, r = 0, tx = 0, ty = 0, tr = 0;
  let frame = null, raw = false, hovering = false, intro = !reduce;

  const apply = () => {
    stage.style.setProperty('--mx', `${x}px`);
    stage.style.setProperty('--my', `${y}px`);
    stage.style.setProperty('--r', `${r}px`);
    stage.classList.toggle('lens-on', r > 8 && !raw);
  };

  const tick = () => {
    const k = reduce ? 1 : 0.18;
    x += (tx - x) * k;
    y += (ty - y) * k;
    r += (tr - r) * (reduce ? 1 : 0.14);
    if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tr - r) < 0.4) {
      x = tx; y = ty; r = tr;
      apply();
      frame = null;
      return;
    }
    apply();
    frame = requestAnimationFrame(tick);
  };
  const kick = () => { if (!frame) frame = requestAnimationFrame(tick); };

  const local = (e) => {
    const b = stage.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top];
  };

  stage.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || raw) return;
    intro = false;
    hovering = true;
    [tx, ty] = local(e);
    if (r < 1) { x = tx; y = ty; }
    tr = lensSize();
    kick();
  });

  stage.addEventListener('pointermove', (e) => {
    if (raw) return;
    if (e.pointerType !== 'mouse' && !e.buttons) return;
    intro = false;
    [tx, ty] = local(e);
    tr = lensSize();
    kick();
  });

  stage.addEventListener('pointerdown', (e) => {
    if (raw || e.target.closest('button')) return;
    intro = false;
    [tx, ty] = local(e);
    x = tx; y = ty;
    tr = lensSize();
    kick();
  });

  const hide = () => { if (!raw) { tr = 0; kick(); } };
  stage.addEventListener('pointerleave', () => { hovering = false; hide(); });
  stage.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') hide(); });
  stage.addEventListener('pointercancel', hide);

  // 원본 전체 보기 버튼 (키보드로도 쓸 수 있음)
  btn.addEventListener('click', () => {
    raw = !raw;
    intro = false;
    btn.setAttribute('aria-pressed', String(raw));
    btn.textContent = raw ? '합성본 보기' : '원본 보기';
    stage.classList.toggle('is-raw', raw);
    const b = stage.getBoundingClientRect();
    if (raw) {
      tx = b.width / 2; ty = b.height / 2;
      if (r < 1) { x = tx; y = ty; }
      tr = Math.hypot(b.width, b.height);
    } else {
      tr = hovering ? lensSize() : 0;
    }
    kick();
  });

  // 처음 들어왔을 때 렌즈가 이름 위를 한 번 지나간다
  if (intro) {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const baseY = h * 0.4;
    const D = 2400;
    let t0 = null;
    const sweep = (now) => {
      if (!intro) return;
      if (t0 === null) t0 = now + 500;
      const t = (now - t0) / D;
      if (t < 0) { requestAnimationFrame(sweep); return; }
      if (t >= 1) { intro = false; tr = 0; kick(); return; }
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      tx = x = w * (0.14 + 0.72 * e);
      ty = y = baseY + Math.sin(t * Math.PI * 2) * h * 0.05;
      tr = r = lensSize() * Math.min(1, Math.sin(Math.PI * t) * 2.4);
      apply();
      requestAnimationFrame(sweep);
    };
    requestAnimationFrame(sweep);
  }
})();
