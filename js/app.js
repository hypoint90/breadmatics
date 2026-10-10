/* =========================================================
   app.js — 페이지 전환(라우터) · 상단 메뉴 · 공통 유틸
   주소 형식: #/main, #/ingredients, #/manual, #/recipe, #/recipe/croissant, #/make
   각 페이지 스크립트는 BR.pages.이름 = { init, enter, leave } 로 등록합니다.
   ========================================================= */

window.BR = window.BR || {};
BR.pages = BR.pages || {};

/* 공통: 화살표 SVG (피그마 arrow) */
BR.arrowSVG = (extraClass = "") =>
  `<svg class="arrow ${extraClass}" viewBox="0 0 18 8" fill="none" aria-hidden="true">
     <path d="M0 4h17M13.6 0.5 17.1 4l-3.5 3.5" stroke="currentColor" stroke-width="1"/>
   </svg>`;

/* 공통: 아래 꺾쇠 SVG (한번에 보기 버튼) */
BR.chevronSVG = (extraClass = "") =>
  `<svg class="${extraClass}" viewBox="0 0 7 3" fill="none" aria-hidden="true">
     <path d="M0.3 0.3 3.5 2.6 6.7 0.3" stroke="currentColor" stroke-width="0.7"/>
   </svg>`;

/* 공통: HTML 이스케이프 */
BR.esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------------------------------------------------------
   부드러운 스크롤 (휠 입력을 목표값으로 모은 뒤 조금씩 따라감)
   BR.smoothScroll(요소, "x" | "y", { ease })
   - ease: 0~1, 작을수록 더 미끄러지듯 부드러움
   - 가로("x") 영역은 세로 휠도 가로 이동으로 바꿔줌
   --------------------------------------------------------- */
BR.smoothScroll = (el, axis = "y", { ease = 0.1 } = {}) => {
  const prop = axis === "x" ? "scrollLeft" : "scrollTop";
  const max = () => (axis === "x" ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight);
  let current = el[prop];
  let target = current;
  let raf = null;

  const tick = () => {
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.5) current = target;
    el[prop] = current;
    raf = current === target ? null : requestAnimationFrame(tick);
  };

  el.addEventListener(
    "wheel",
    (e) => {
      let d = axis === "x" && Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) d *= 32; // 줄 단위 휠 보정
      if (!d || max() <= 0) return;
      e.preventDefault();
      if (!raf) current = el[prop]; // 다른 방법(드래그 등)으로 움직였으면 거기서부터
      target = Math.min(Math.max(target + d, 0), max());
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: false }
  );

  // 스크롤바 드래그·scrollTo 등 바깥에서 움직이면 목표값 맞춤
  el.addEventListener("scroll", () => {
    if (!raf) current = target = el[prop];
  }, { passive: true });

  return {
    reset() {
      cancelAnimationFrame(raf);
      raf = null;
      current = target = el[prop];
    }
  };
};

/* ---------------------------------------------------------
   라우터
   --------------------------------------------------------- */
BR.router = (() => {
  let current = null;

  // 주소 → { page, param }
  const parse = () => {
    const [, page = "main", param = null] = location.hash.replace(/^#/, "").split("/");
    if (page === "recipe" && param) return { page: "detail", param };
    return { page: BR.pages[page] ? page : "main", param };
  };

  // 페이지 전환 시간(ms) — css/base.css 의 .page.is-leaving 과 맞춤
  const LEAVE = 420;
  let swapTimer = null;
  let pending = null; // 나가는 중인 페이지가 끝나면 할 일

  const pageEl = (name) => document.querySelector(`.page[data-page="${name}"]`);

  // 새 페이지: 아래에 내려둔 상태에서 시작 → 다음 프레임에 제자리로 올라옴
  const show = (page, param) => {
    document.querySelectorAll(".page").forEach((el) => {
      el.classList.remove("is-leaving");
      el.classList.toggle("is-active", el.dataset.page === page);
    });
    const el = pageEl(page);
    el.classList.add("is-entering");
    void el.offsetWidth; // 시작 위치를 먼저 그리게 함
    el.classList.remove("is-entering");
    BR.pages[page].enter?.(param);
  };

  const go = () => {
    const { page, param } = parse();
    const prev = current;

    // 이전 전환이 아직 진행 중이면 바로 마무리
    if (pending) {
      clearTimeout(swapTimer);
      pending = null;
    }

    if (prev && prev !== page) BR.pages[prev].leave?.();
    document.body.dataset.page = page;

    // 상단 메뉴 활성 표시 (상세는 Bread Recipe 로 표시)
    const navKey = page === "detail" ? "recipe" : page;
    document.querySelectorAll(".nav__item").forEach((a) => {
      a.classList.toggle("is-active", a.dataset.nav === navKey);
    });

    // Manual book 안(메뉴얼북 · 재료 · 메뉴얼)에서만 하위 메뉴(재료 · 메뉴얼)를 펼침
    const inBook = ["manual-book", "ingredients", "manual"].includes(page);
    document.body.classList.toggle("in-book", inBook);
    document.querySelector('.nav__item[data-nav="manual-book"]').classList.toggle("is-parent", inBook && page !== "manual-book");

    current = page;

    // 지금 페이지는 위로 올라가며 사라지고(LEAVE) → 그다음 새 페이지가 아래에서 올라옴
    // 상단 메뉴바는 페이지 밖이라 그대로 있음
    const out = prev && prev !== page ? pageEl(prev) : null;
    if (out && out.classList.contains("is-active")) {
      out.classList.add("is-leaving");
      pending = () => show(page, param);
      swapTimer = setTimeout(() => {
        const run = pending;
        pending = null;
        run?.();
      }, LEAVE);
    } else {
      show(page, param);
    }
  };

  const start = () => {
    Object.values(BR.pages).forEach((p) => p.init?.());
    window.addEventListener("hashchange", go);
    go();
  };

  return { start, current: () => current };
})();

/* 상단 메뉴 화살표 그리기 */
document.querySelectorAll("[data-arrow]").forEach((el) => {
  el.insertAdjacentHTML(el.dataset.arrow === "before" ? "afterbegin" : "beforeend", BR.arrowSVG(el.dataset.arrowClass || ""));
});

/* 이미지·텍스트 드래그와 우클릭 메뉴(이미지 저장) 막기 */
document.addEventListener("dragstart", (e) => e.preventDefault());
document.addEventListener("contextmenu", (e) => e.preventDefault());

document.addEventListener("DOMContentLoaded", BR.router.start);
