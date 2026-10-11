/* =========================================================
   book-wipe.js — 2안 Manual book 옵션 클릭 전환
   1) 누른 칸(재료 / 메뉴얼)에서 검정 면이 화면 전체로 커지고, 가운데에 페이지 이름(Ingredients / Manual)이 나타남
   2) 그 뒤에서 다음 페이지로 바뀜
   3) 검정 면이 옆으로 밀려 나가며 다음 페이지가 드러남 (옆으로 넘기는 느낌)
      - 재료(왼쪽 칸): 오른쪽으로 밀려 나감 + 재료 카드 줄도 왼쪽에서 오른쪽으로 쭉 스크롤되며 들어옴
      - 메뉴얼(오른쪽 칸): 왼쪽으로 밀려 나감
   모양은 v2/css/book.css 의 .book-wipe
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const book = document.querySelector(".book");
  if (!book) return;

  const GROW = 600; // 1) 화면을 채우는 시간(ms) — book.css 와 맞춤
  const HOLD = 850; // 2) 덮고 있는 시간(ms) — 페이지 이름을 읽을 시간 + 페이지가 나가는 시간(BR.leaveTime 700) 보다 길게
  const SLIDE = 800; // 3) 옆으로 밀려 나가는 시간(ms) — book.css 와 맞춤
  const GLIDE_DIST = 1200; // 재료: 카드 줄이 이만큼(피그마 px) 앞에서부터 스크롤되며 들어옴
  const GLIDE_TIME = 2200; // 재료: 그 스크롤 시간(ms)
  let busy = false;

  // 재료 카드 줄을 실제로 스크롤시켜 들어오게 함 (상자째 옮기면 화면 끝에서 잘려 보여서)
  // 끝으로 갈수록 천천히 멈춤. 도중에 휠·드래그를 하면 바로 멈추고 사용자 입력을 따름
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  const glideCards = (cols) => {
    if (!cols) return;
    const unit = Math.min(innerWidth / 1440, innerHeight / 920);
    const from = Math.min(cols.scrollWidth - cols.clientWidth, GLIDE_DIST * unit);
    if (from <= 0) return;
    let stopped = false;
    const stop = () => (stopped = true);
    cols.addEventListener("wheel", stop, { once: true, passive: true });
    cols.addEventListener("pointerdown", stop, { once: true });
    cols.scrollLeft = from;
    const t0 = performance.now();
    const step = (now) => {
      if (stopped) return;
      const t = Math.min(1, (now - t0) / GLIDE_TIME);
      cols.scrollLeft = from * (1 - easeOut(t));
      if (t < 1) requestAnimationFrame(step);
      else {
        cols.removeEventListener("wheel", stop);
        cols.removeEventListener("pointerdown", stop);
      }
    };
    requestAnimationFrame(step);
  };

  book.addEventListener("click", (e) => {
    const part = e.target.closest(".book__part");
    if (!part || busy || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    busy = true;

    // 누른 칸 자리에 검정 면을 놓고
    const r = part.getBoundingClientRect();
    const wipe = document.createElement("div");
    wipe.className = "book-wipe";
    // 검정 면 가운데에 들어갈 페이지 이름 — 영문(왼쪽에서) + 한글(오른쪽에서)
    const label = document.createElement("div");
    label.className = "book-wipe__label";
    const name = (sel) => BR.esc(part.querySelector(sel)?.textContent.trim() || "");
    label.innerHTML = `<span class="book-wipe__en">${name(".book__en")}</span><span class="book-wipe__kr">${name(".book__kr")}</span>`;
    wipe.appendChild(label);
    Object.assign(wipe.style, {
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`
    });
    document.body.appendChild(wipe);

    // 1) 화면 전체로
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        wipe.classList.add("is-full");
        Object.assign(wipe.style, { left: "0px", top: "0px", width: "100vw", height: "100vh" });
      })
    );

    // 2) 덮인 상태에서 다음 페이지로
    //    (메뉴얼은 검정 면이 걷힌 뒤에 01 이 열리도록 열림 시작을 늦춤 — js/manual.js)
    setTimeout(() => {
      //    페이지는 나가는 시간(BR.leaveTime) 뒤에 들어오므로 그만큼 빼고, 면이 60% 걷혔을 때 열리게
      BR.manualIntroDelay = HOLD - (BR.leaveTime || 420) + SLIDE * 0.6;
      location.hash = part.getAttribute("href");
    }, GROW);

    // 3) 옆으로 밀려 나가며 다음 페이지가 드러남
    //    재료(왼쪽 칸)는 오른쪽으로, 메뉴얼(오른쪽 칸)은 왼쪽으로
    const toIngredients = part.getAttribute("href") === "#/ingredients";
    const ing = document.querySelector(".ing");
    setTimeout(() => {
      wipe.classList.add(toIngredients ? "is-out-right" : "is-out");
      // 재료 카드 줄도 같은 때에 왼쪽에서 오른쪽으로 쭉 스크롤되며 들어옴 (카드 4장쯤 뒤 → 첫 카드)
      if (toIngredients && ing) glideCards(ing.querySelector(".ing__columns"));
    }, GROW + HOLD);
    setTimeout(() => {
      wipe.remove();
      busy = false;
      BR.manualIntroDelay = undefined;
    }, GROW + HOLD + SLIDE + 50);
  });
});
