/* =========================================================
   recipe.js — Bread Recipe
   1) 목록: 세로 캐러셀 (휠 / ↑↓ 키 / 앞뒤 빵 클릭)
            가운데 빵 클릭 → 상세
   2) 상세: 왼쪽 정보 + 오른쪽 수식
   3) Make my recipe: 준비 중 화면 (등록만)
   ========================================================= */

BR.state = BR.state || { breadIndex: 0 };

/* ---------------------------------------------------------
   1) 목록
   --------------------------------------------------------- */
BR.pages.recipe = (() => {
  const VISIBLE = 2; // 가운데 기준 위아래로 보이는 장 수
  const STEP_LOCK = 100; // 한 칸 넘긴 뒤 다음 칸까지 최소 간격(ms) — 작을수록 빨리 넘어감 (0.1초당 1칸)
  let stack, names, formulaL, formulaR, counter;
  let lock = false;
  let nameTimer = null;

  const total = () => BR.breads.length;

  // 가운데(cur) 기준 i 번째 카드의 상대 위치 (-N/2 ~ N/2)
  const offset = (i, cur) => {
    const n = total();
    let d = (((i - cur) % n) + n) % n;
    if (d > n / 2) d -= n;
    return d;
  };

  const slotOf = (d) => (Math.abs(d) <= VISIBLE ? String(d) : d < 0 ? "hide-up" : "hide-down");

  const formulaHTML = (lines) => {
    const text = lines.join("\n");
    return `<div class="r-formula__track">${BR.esc(text)}\n${BR.esc(text)}</div>`;
  };

  const update = (withNameMotion = true) => {
    const cur = BR.state.breadIndex;
    const b = BR.breads[cur];

    stack.querySelectorAll(".r-card").forEach((card, i) => {
      card.dataset.slot = slotOf(offset(i, cur));
      card.tabIndex = card.dataset.slot === "0" ? 0 : -1;
    });

    const apply = () => {
      names.querySelector(".r-name--en .r-name__title").textContent = b.en;
      names.querySelector(".r-name--kr .r-name__title").textContent = b.kr;
      names.querySelectorAll(".r-name__meta").forEach((el) => (el.textContent = `${b.weight}\n${b.kcal}`));
      // 같은 빵이면 수식을 다시 그리지 않음 (다시 그리면 흐르던 위치가 처음으로 튐)
      if (formulaL.dataset.id !== b.id) {
        formulaL.innerHTML = formulaHTML(b.formula);
        formulaR.innerHTML = formulaHTML(b.formula);
        formulaL.dataset.id = b.id;
      }
      counter.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(total()).padStart(2, "0")}`;
      names.classList.remove("is-changing");
    };

    // 빠르게 연속으로 넘길 때는 마지막 빵 기준으로 한 번만 이름·수식 교체
    clearTimeout(nameTimer);
    if (withNameMotion) {
      names.classList.add("is-changing");
      nameTimer = setTimeout(apply, 250);
    } else {
      apply();
    }
  };

  // 사진 아래 15% 의 평균 밝기(0~255)가 기준보다 낮으면 '어두움'
  const DARK_LIMIT = 120;
  const isDarkBottom = (img) => {
    try {
      const w = 40;
      const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
      const band = Math.max(1, Math.round(h * 0.15));
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = band;
      const ctx = cv.getContext("2d");
      // 사진 아래 15% 띠만 작게 그려서 평균 밝기 계산
      ctx.drawImage(img, 0, img.naturalHeight * 0.85, img.naturalWidth, img.naturalHeight * 0.15, 0, 0, w, band);
      const d = ctx.getImageData(0, 0, w, band).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      return sum / (d.length / 4) < DARK_LIMIT;
    } catch (e) {
      return false; // 파일로 직접 열면(file://) 사진 픽셀을 못 읽어서 기본(검정 글자) 유지
    }
  };

  const go = (step) => {
    if (lock || !step) return;
    lock = true;
    BR.state.breadIndex = (BR.state.breadIndex + step + total()) % total();
    update();
    setTimeout(() => (lock = false), STEP_LOCK); // 연속 휠 과속 방지
  };

  const init = () => {
    const root = document.querySelector(".recipe");
    stack = root.querySelector(".r-stack");
    names = root.querySelector(".r-names");
    formulaL = root.querySelector(".r-formula--left");
    formulaR = root.querySelector(".r-formula--right");
    counter = root.querySelector(".r-counter");

    stack.innerHTML = BR.breads
      .map(
        (b, i) =>
          `<button class="r-card" data-index="${i}" aria-label="${BR.esc(b.kr)}">
             <img src="${b.img}" alt="${BR.esc(b.kr)}" loading="lazy">
             <span class="r-card__go" aria-hidden="true">레시피 보러가기${BR.arrowSVG()}</span>
           </button>`
      )
      .join("");

    // 카드 사진 아래쪽(띠가 올라오는 자리)이 어두우면 '레시피 보러가기' 글자를 흰색으로
    stack.querySelectorAll(".r-card").forEach((card) => {
      const img = card.querySelector("img");
      const check = () => {
        if (isDarkBottom(img)) card.classList.add("is-dark");
      };
      if (img.complete && img.naturalWidth) check();
      else img.addEventListener("load", check, { once: true });
    });

    stack.addEventListener("click", (e) => {
      const card = e.target.closest(".r-card");
      if (!card) return;
      const d = offset(Number(card.dataset.index), BR.state.breadIndex);
      if (d === 0) location.hash = `#/recipe/${BR.breads[BR.state.breadIndex].id}`;
      else go(d);
    });

    root.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        if (Math.abs(e.deltaY) < 8) return;
        go(e.deltaY > 0 ? 1 : -1);
      },
      { passive: false }
    );

    window.addEventListener("keydown", (e) => {
      if (BR.router.current() !== "recipe") return;
      if (e.key === "ArrowDown") go(1);
      if (e.key === "ArrowUp") go(-1);
    });

    update(false);
  };

  return { init, enter: () => update(false) };
})();

/* ---------------------------------------------------------
   2) 상세
   --------------------------------------------------------- */
BR.pages.detail = (() => {
  let side, formula;

  const init = () => {
    const root = document.querySelector(".detail");
    side = root.querySelector(".d-info");
    formula = root.querySelector(".d-formula");
    root.querySelector(".d-back").insertAdjacentHTML("afterbegin", BR.arrowSVG("arrow--left"));

    // 수식·왼쪽 정보 영역 부드러운 스크롤
    BR.smoothScroll(formula, "y");
    BR.smoothScroll(root.querySelector(".d-side"), "y");
  };

  const enter = (id) => {
    const index = Math.max(0, BR.breads.findIndex((b) => b.id === id));
    const b = BR.breads[index];
    BR.state.breadIndex = index;

    side.innerHTML = `
      <div class="d-info__names">
        <p class="d-info__kr">${BR.esc(b.kr)}</p>
        <p class="d-info__en">${BR.esc(b.en)}</p>
      </div>
      <img class="d-info__img" src="${b.img}" alt="${BR.esc(b.kr)}">
      <div class="d-info__meta">
        <p style="white-space:pre-line">${BR.esc(b.ingredients)}</p>
        <p>${BR.esc(b.weight)}</p>
        <p>${BR.esc(b.kcal)}</p>
      </div>`;

    formula.innerHTML = b.formula.map((line, i) => `<span class="d-formula__line" style="--i:${i}">${BR.esc(line)}</span>`).join("");
    formula.scrollTop = 0;
  };

  return { init, enter };
})();
