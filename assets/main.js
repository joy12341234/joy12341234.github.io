// 첫 화면 그린 스크린 키잉: 처음 한 번 자동으로 걷히고, 이후엔 끌어서 조절
(() => {
  const viewer = document.getElementById('viewer');
  const wipe = document.getElementById('wipe');
  const readout = document.getElementById('readout');
  if (!viewer || !wipe) return;

  // 자동 키잉이 멈추는 위치(%). 좁은 화면은 오른쪽 위 표시와 겹치지 않게 조금 덜 간다
  const REST = window.matchMedia('(max-width: 860px)').matches ? 60 : 72;
  let pos = 0;
  let frame = null;

  const set = (v) => {
    pos = Math.max(0, Math.min(100, v));
    viewer.style.setProperty('--key-pos', pos.toFixed(2));
    const r = Math.round(pos);
    readout.textContent = r;
    wipe.setAttribute('aria-valuenow', r);
    wipe.setAttribute('aria-valuetext', `${r}% 키잉됨`);
  };

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };

  const animateTo = (to, ms) => {
    stop();
    const from = pos;
    const t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      set(from + (to - from) * ease(t));
      frame = t < 1 ? requestAnimationFrame(step) : null;
    };
    frame = requestAnimationFrame(step);
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    set(REST);
  } else {
    set(0);
    setTimeout(() => animateTo(REST, 1600), 500);
  }

  // 마우스·터치로 끌기
  const fromEvent = (e) => {
    const r = viewer.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };
  let dragging = false;
  viewer.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    stop();
    viewer.setPointerCapture(e.pointerId);
    set(fromEvent(e));
  });
  viewer.addEventListener('pointermove', (e) => {
    if (dragging) set(fromEvent(e));
  });
  const end = () => { dragging = false; };
  viewer.addEventListener('pointerup', end);
  viewer.addEventListener('pointercancel', end);

  // 키보드: 좌우 화살표, Home, End
  wipe.addEventListener('keydown', (e) => {
    const steps = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 };
    let v = null;
    if (e.key in steps) v = pos + steps[e.key];
    else if (e.key === 'Home') v = 0;
    else if (e.key === 'End') v = 100;
    if (v === null) return;
    e.preventDefault();
    stop();
    set(v);
  });
})();
