/* =========================================================
   ingredients-focus.js — 2안 재료 '자세히 보기'
   - 화면 가운데에 가장 가까운 카드에 .is-center → 커지고 이름이 보임 (v2/css/ingredients.css)
   - 맞춤 도우미: 스크롤이 멈추면 가장 가까운 카드를 화면 가운데로 부드럽게 맞춤
   - 다른 카드를 누르면 그 카드가 가운데로 부드럽게 이동
   - 가운데 카드를 누르면 한번에 보기(주기율표)로 전환, 그 재료 칸을 잠깐 강조
   (공용 js/ingredients.js 가 카드를 만든 뒤에 실행)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const cols = document.querySelector(".ing__columns");
  if (!cols) return;
  const root = cols.closest(".ing");
  const cards = [...cols.querySelectorAll(".ing-col")];

  /* ---------- 맞춤 도우미 값 (여기서 조정) ---------- */
  const SETTLE = 140; // 스크롤이 이만큼(ms) 멈추면 맞춤 시작
  const SNAP_TIME = 520; // 가운데로 맞추는 데 걸리는 시간(ms)
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  let current = null;
  let raf = null;
  let settleTimer = null;
  let snapRaf = null;
  let snapping = false; // 도우미가 움직이는 중 (이때 생긴 scroll 은 '사용자 스크롤'로 보지 않음)
  let dragging = false; // 스크롤바 손잡이를 끄는 중

  const nearest = () => {
    const mid = cols.scrollLeft + cols.clientWidth / 2;
    let best = null;
    let bestDist = Infinity;
    cards.forEach((c) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    });
    return best;
  };

  const centerOf = (card) => {
    const max = cols.scrollWidth - cols.clientWidth;
    return Math.min(max, Math.max(0, card.offsetLeft + card.offsetWidth / 2 - cols.clientWidth / 2));
  };

  /* 가운데 카드 표시 */
  const update = () => {
    raf = null;
    const best = nearest();
    if (best !== current) {
      current?.classList.remove("is-center");
      best?.classList.add("is-center");
      current = best;
    }
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  /* 부드럽게 x 위치로 이동 */
  const cancelSnap = () => {
    cancelAnimationFrame(snapRaf);
    snapRaf = null;
    snapping = false;
  };

  const glideTo = (x) => {
    cancelSnap();
    const from = cols.scrollLeft;
    if (Math.abs(x - from) < 1) return;
    const t0 = performance.now();
    snapping = true;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / SNAP_TIME);
      cols.scrollLeft = from + (x - from) * easeOut(t);
      if (t < 1) snapRaf = requestAnimationFrame(step);
      else {
        snapRaf = null;
        // 마지막 scroll 이벤트가 처리된 뒤에 해제
        requestAnimationFrame(() => (snapping = false));
      }
    };
    snapRaf = requestAnimationFrame(step);
  };

  /* 스크롤이 멈추면 가장 가까운 카드를 가운데로 */
  const settle = () => {
    if (dragging || root.classList.contains("is-table") || BR.router.current() !== "ingredients") return;
    const card = nearest();
    if (card) glideTo(centerOf(card));
  };

  cols.addEventListener(
    "scroll",
    () => {
      schedule();
      if (snapping) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, SETTLE);
    },
    { passive: true }
  );

  // 사용자가 다시 굴리면 맞춤을 멈추고 그 입력을 따름
  cols.addEventListener("wheel", cancelSnap, { passive: true });

  // 스크롤바 손잡이를 끄는 동안은 맞추지 않고, 놓으면 맞춤
  root.querySelector(".ing__scrollbar-thumb")?.addEventListener("pointerdown", () => {
    dragging = true;
    cancelSnap();
  });
  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SETTLE);
  });

  window.addEventListener("resize", () => {
    schedule();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SETTLE);
  });
  window.addEventListener("hashchange", () => {
    cancelSnap();
    setTimeout(update, 0);
  });

  // 카드 클릭
  // - 가운데가 아닌 카드: 그 카드를 가운데로
  // - 가운데 카드: '한번에 보기'(주기율표)로 전환하고, 표에서 그 재료 칸을 잠깐 강조
  cols.addEventListener("click", (e) => {
    const card = e.target.closest(".ing-col");
    if (!card) return;
    clearTimeout(settleTimer);
    if (card !== current) return glideTo(centerOf(card));

    root.querySelector(".ing__toggle .pill")?.click();
    const cell = root.querySelectorAll(".ing-card")[Number(card.dataset.index)];
    if (cell) {
      cell.classList.remove("is-focus");
      void cell.offsetWidth;
      cell.classList.add("is-focus");
      setTimeout(() => cell.classList.remove("is-focus"), 1600);
    }
  });

  update();
});
