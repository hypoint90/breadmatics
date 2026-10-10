/* =========================================================
   ingredients.js — 재료 화면
   - 컬럼 보기: 마우스 휠로 가로 스크롤 / 커스텀 스크롤바 드래그
   - '한번에 보기' ↔ '자세히 보기' 로 주기율표 보기 전환
   - 표에서 카드를 누르면 컬럼 보기로 돌아가 해당 재료로 이동
   ========================================================= */

BR.pages.ingredients = (() => {
  let root, cols, table, thumb, track, toggle, wheel;

  const renderColumns = () =>
    BR.ingredients
      .map(
        (it, i) => `
        <article class="ing-col" data-index="${i}" tabindex="0">
          ${it.img ? `<img class="ing-col__bg" src="${it.img}" alt="" loading="lazy">` : ""}
          <p class="ing-col__num">${i + 1}</p>
          <p class="ing-col__symbol">${BR.esc(it.symbol)}</p>
          <div class="ing-col__names">
            <p class="ing-col__en">${BR.esc(it.en)}</p>
            <p class="ing-col__kr">${BR.esc(it.kr)}</p>
          </div>
        </article>`
      )
      .join("");

  const renderTable = () =>
    BR.ingredients
      .map(
        (it, i) => `
        <button class="ing-card" data-index="${i}" style="--i:${i}">
          <span class="ing-card__num">${i + 1}</span>
          <span class="ing-card__symbol">${BR.esc(it.symbol)}</span>
          <span class="ing-card__kr">${BR.esc(it.kr)}</span>
          <span class="ing-card__en">${BR.esc(it.en)}</span>
        </button>`
      )
      .join("");

  /* ---------- 커스텀 스크롤바 ---------- */
  const syncThumb = () => {
    const max = cols.scrollWidth - cols.clientWidth;
    const ratio = cols.clientWidth / cols.scrollWidth;
    const trackW = track.clientWidth;
    const thumbW = Math.max(trackW * ratio, 30);
    thumb.style.width = `${thumbW}px`;
    thumb.style.transform = `translateX(${max ? (cols.scrollLeft / max) * (trackW - thumbW) : 0}px)`;
  };

  const enableThumbDrag = () => {
    let startX = 0;
    let startScroll = 0;

    const move = (e) => {
      const trackW = track.clientWidth - thumb.offsetWidth;
      const max = cols.scrollWidth - cols.clientWidth;
      cols.scrollLeft = startScroll + ((e.clientX - startX) / trackW) * max;
    };
    const up = () => {
      thumb.style.cursor = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    thumb.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startX = e.clientX;
      startScroll = cols.scrollLeft;
      thumb.style.cursor = "grabbing";
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  };

  /* ---------- 휠 → 부드러운 가로 스크롤 (app.js BR.smoothScroll) ---------- */
  const enableWheel = () => BR.smoothScroll(cols, "x", { ease: 0.08 });

  /* ---------- 보기 전환 ---------- */
  const setTableView = (on) => {
    root.classList.toggle("is-table", on);
    toggle.querySelector(".pill__label").textContent = on ? "자세히 보기" : "한번에 보기";
  };

  const focusColumn = (index) => {
    const col = cols.children[index];
    cols.querySelectorAll(".ing-col.is-active").forEach((c) => c.classList.remove("is-active"));
    col.classList.add("is-active");
    const left = col.offsetLeft - (cols.clientWidth - col.offsetWidth) / 2;
    cols.scrollTo({ left, behavior: "smooth" });
  };

  const init = () => {
    root = document.querySelector(".ing");
    cols = root.querySelector(".ing__columns");
    table = root.querySelector(".ing__table");
    thumb = root.querySelector(".ing__scrollbar-thumb");
    track = root.querySelector(".ing__scrollbar");
    toggle = root.querySelector(".ing__toggle .pill");

    cols.innerHTML = renderColumns();
    table.innerHTML = renderTable();
    toggle.insertAdjacentHTML("beforeend", BR.chevronSVG("ing__toggle-icon"));

    cols.addEventListener("scroll", syncThumb, { passive: true });
    window.addEventListener("resize", syncThumb);
    enableThumbDrag();
    wheel = enableWheel();

    // 컬럼 클릭 → 활성 고정 (다시 누르면 해제)
    cols.addEventListener("click", (e) => {
      const col = e.target.closest(".ing-col");
      if (!col) return;
      const wasActive = col.classList.contains("is-active");
      cols.querySelectorAll(".ing-col.is-active").forEach((c) => c.classList.remove("is-active"));
      if (!wasActive) col.classList.add("is-active");
    });

    toggle.addEventListener("click", () => setTableView(!root.classList.contains("is-table")));

    table.addEventListener("click", (e) => {
      const card = e.target.closest(".ing-card");
      if (!card) return;
      setTableView(false);
      focusColumn(Number(card.dataset.index));
    });
  };

  // 들어올 때마다 처음 상태: 컬럼 보기 · 맨 왼쪽 · 고정된 컬럼 없음
  const enter = () => {
    setTableView(false);
    cols.querySelectorAll(".ing-col.is-active").forEach((c) => c.classList.remove("is-active"));
    wheel.reset();
    cols.scrollLeft = 0;
    wheel.reset();
    requestAnimationFrame(syncThumb);
  };

  return { init, enter };
})();
