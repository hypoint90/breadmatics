/* =========================================================
   recipe.js (2안) — Bread Recipe   피그마: 레시피 (2304:770)
   한 화면에 목록 + 수식을 함께 보여줌
   - 왼쪽: 빵 사진 세로 줄 (가운데가 크게, 위아래는 작고 흐리게)
   - 사진 옆: 영문·한글 이름, 재료, 중량, 칼로리
   - 오른쪽: 회색 유리 카드에 수식 (위아래로 앞뒤 빵의 카드가 살짝 보임)
     → 카드에 마우스를 올리면 수식 글자가 부드럽게 커짐 (v2/css/recipe.css)
   넘기기: 휠 / ↑↓ 키 / 사진 클릭 / 앞뒤 카드 클릭
   (1안 js/recipe.js 대신 이 파일을 씀)
   ========================================================= */

BR.state = BR.state || { breadIndex: 0 };

BR.pages.recipe = (() => {
  const VISIBLE = 2; // 가운데 기준 위아래로 보이는 사진 장 수
  const STEP_LOCK = 100; // 한 칸 넘긴 뒤 다음 칸까지 최소 간격(ms)
  const INFO_SWAP = 450; // 이름·재료가 새로 나오기 시작하는 시점(ms) — 사진이 멈추기 직전 (사진 이동 0.8초, recipe.css --rx-move)
  /* 가운데 카드에 마우스를 올려 수식이 커졌을 때 자동 스크롤 */
  const AUTO_WAIT = 900; // 글자가 커지는 동안 기다렸다가 시작(ms)
  const AUTO_SPEED = 54; // 내려가는 속도 (피그마 px / 초) — 45 에서 20% 빠르게
  const AUTO_HOLD_END = 1200; // 맨 아래에서 멈춰 있는 시간(ms)
  const AUTO_BACK = 1000; // 맨 위로 되돌아가는 시간(ms)
  const AUTO_HOLD_TOP = 900; // 맨 위에서 다시 내려가기 전 멈춤(ms)
  const AUTO_USER_PAUSE = 1500; // 직접 휠을 굴리면 이만큼 쉬었다가 그 자리부터 이어감(ms)
  let root, thumbs, cards, info, bar;
  let lock = false;
  let infoTimer = null;

  const total = () => BR.breads.length;

  // 가운데(cur) 기준 i 번째의 상대 위치 (-N/2 ~ N/2, 처음과 끝이 이어짐)
  const offset = (i, cur) => {
    const n = total();
    let d = (((i - cur) % n) + n) % n;
    if (d > n / 2) d -= n;
    return d;
  };

  const slotOf = (d, visible) => (Math.abs(d) <= visible ? String(d) : d < 0 ? "hide-up" : "hide-down");

  // 글자 하나하나를 span 으로 (마우스 근처 글자만 서체를 바꾸려고) — 띄어쓰기는 그대로 두어 줄바꿈 위치 유지
  const charsHTML = (line) =>
    Array.from(line)
      .map((ch) => (ch === " " ? " " : `<span class="rx-ch">${BR.esc(ch)}</span>`))
      .join("");

  // 수식: 노션 코드블록 그대로 — 들여쓰기 유지, 빈 줄은 단계 사이 간격(.rx-card__gap)
  const formulaHTML = (lines) =>
    lines
      .map((l) => l.replace(/s+$/, ""))
      .map((l) =>
        l
          ? `<span class="rx-card__line">${charsHTML(l)}</span>`
          : `<span class="rx-card__gap" aria-hidden="true"></span>`
      )
      .join("");

  const renderInfo = (b) => {
    info.querySelector(".rx-info__en").textContent = b.en;
    info.querySelector(".rx-info__kr").textContent = b.kr;
    info.querySelector(".rx-info__ing").textContent = b.ingredients;
    info.querySelector(".rx-info__weight").textContent = b.weight;
    info.querySelector(".rx-info__kcal").textContent = b.kcal;
    info.classList.remove("is-changing");
  };

  const update = (withMotion = true) => {
    const cur = BR.state.breadIndex;

    // 왼쪽 세로선의 위치 표시 (첫 빵 = 맨 위, 마지막 빵 = 맨 아래)
    bar.style.setProperty("--p", total() > 1 ? cur / (total() - 1) : 0);

    thumbs.querySelectorAll(".rx-thumb").forEach((el, i) => {
      el.dataset.slot = slotOf(offset(i, cur), VISIBLE);
      el.tabIndex = el.dataset.slot === "0" ? -1 : 0;
    });

    // 카드는 가운데 1장 + 위아래 1장씩만 보임
    cards.querySelectorAll(".rx-card").forEach((el, i) => {
      const slot = slotOf(offset(i, cur), 1);
      // 가운데에서 벗어나는 카드는 수식을 맨 위로 되돌림
      if (el.dataset.slot === "0" && slot !== "0") {
        if (auto.el && el.contains(auto.el)) stopAuto();
        el.querySelector(".rx-card__scroll").scrollTop = 0;
      }
      el.dataset.slot = slot;
    });

    // 넘긴 뒤 마우스가 새 가운데 카드 위에 있으면 그 카드에서 자동 스크롤
    if (cards.matches(":hover")) syncAuto();
    lensClear(); // 넘기면 바뀐 글자는 원래대로 (다음 마우스 움직임에서 새 카드 기준으로)

    // 빠르게 연속으로 넘길 때는 마지막 빵 기준으로 한 번만 교체
    clearTimeout(infoTimer);
    const b = BR.breads[cur];
    if (withMotion) {
      info.classList.add("is-changing");
      infoTimer = setTimeout(() => renderInfo(b), INFO_SWAP);
    } else {
      renderInfo(b);
    }
  };

  /* ---------- 자동 스크롤 ----------
     wait(대기) → down(천천히 내려감) → end(맨 아래 멈춤) → back(맨 위로 부드럽게) → top(멈춤) → down … 반복
     마우스가 나가면 home(맨 위로 돌아가며 끝) */
  const auto = { el: null, raf: null, phase: null, until: 0, pos: 0, from: 0, t0: 0, last: 0 };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const unit = () => Math.min(innerWidth / 1440, innerHeight / 920);

  const autoTick = (now) => {
    const a = auto;
    const el = a.el;
    if (!el) return;
    const dt = Math.min(0.05, (now - (a.last || now)) / 1000);
    a.last = now;
    const max = el.scrollHeight - el.clientHeight;

    if (a.phase === "wait") {
      a.pos = el.scrollTop; // 기다리는 동안은 손대지 않음 (직접 굴린 위치 그대로)
      if (now >= a.until) a.phase = "down";
    } else if (a.phase === "down") {
      if (max > 1) {
        a.pos = Math.min(max, a.pos + AUTO_SPEED * unit() * dt);
        el.scrollTop = a.pos;
        if (a.pos >= max - 0.5) {
          a.phase = "end";
          a.until = now + AUTO_HOLD_END;
        }
      }
    } else if (a.phase === "end" || a.phase === "top") {
      if (now >= a.until) {
        if (a.phase === "end") {
          a.phase = "back";
          a.from = el.scrollTop;
          a.t0 = now;
        } else a.phase = "down";
      }
    } else if (a.phase === "back" || a.phase === "home") {
      const t = Math.min(1, (now - a.t0) / AUTO_BACK);
      a.pos = a.from * (1 - easeInOut(t));
      el.scrollTop = a.pos;
      if (t >= 1) {
        if (a.phase === "home") return stopAuto();
        a.phase = "top";
        a.until = now + AUTO_HOLD_TOP;
      }
    }
    a.raf = requestAnimationFrame(autoTick);
  };

  const startAuto = (card) => {
    const el = card.querySelector(".rx-card__scroll");
    if (auto.el === el && auto.phase !== "home") return;
    stopAuto();
    Object.assign(auto, { el, phase: "wait", until: performance.now() + AUTO_WAIT, pos: el.scrollTop, last: 0 });
    auto.raf = requestAnimationFrame(autoTick);
  };

  // 마우스가 나가면: 글자가 작아지는 동안 맨 위로 부드럽게 돌아가며 끝
  const leaveAuto = () => {
    if (!auto.el || auto.phase === "home") return;
    Object.assign(auto, { phase: "home", from: auto.el.scrollTop, t0: performance.now() });
  };

  const stopAuto = () => {
    cancelAnimationFrame(auto.raf);
    Object.assign(auto, { el: null, raf: null, phase: null });
  };

  // 지금 가운데 카드 위에 마우스가 있으면 자동 스크롤 시작
  const syncAuto = () => {
    const main = cards.querySelector('.rx-card[data-slot="0"]');
    if (main && main.matches(":hover")) startAuto(main);
    else leaveAuto();
  };

  /* ---------- 마우스 근처 글자만 서체 바꾸기 ----------
     가운데 카드에서 마우스와 SERIF_RADIUS 안에 있는 글자에 .is-serif → Baskervville 이탤릭
     (Baskervville 에 없는 수학 기호·첨자는 Libertinus Math 로 — v2/css/recipe.css)
     범위를 벗어나도 SERIF_HOLD 만큼 그대로 있다가 .is-plain → 원래 서체로 (그 사이 다시 들어오면 취소)
     둘 다 바뀔 때 살짝 흐려졌다 돌아옴 */
  const SERIF_RADIUS = 110; // 마우스에서 이 거리(피그마 px) 안의 글자만 바뀜
  const SERIF_HOLD = 500; // 범위를 벗어난 뒤 원래 서체로 돌아가기까지(ms)
  const lens = { x: 0, y: 0, card: null, raf: null, on: new Set(), back: new Map() }; // on: 지금 세리프 / back: 돌아갈 예약

  const swapFont = (ch, serif) => {
    ch.classList.toggle("is-serif", serif);
    ch.classList.toggle("is-plain", !serif);
  };

  const lensApply = () => {
    lens.raf = null;
    const next = new Set();
    if (lens.card) {
      const r = SERIF_RADIUS * unit();
      lens.card.querySelectorAll(".rx-ch").forEach((ch) => {
        const b = ch.getBoundingClientRect();
        if (b.bottom < lens.y - r || b.top > lens.y + r) return; // 먼 줄은 바로 건너뜀
        const dx = b.left + b.width / 2 - lens.x;
        const dy = b.top + b.height / 2 - lens.y;
        if (dx * dx + dy * dy <= r * r) next.add(ch);
      });
    }
    // 범위 안: 바로 세리프로 (돌아갈 예약이 있었으면 취소)
    next.forEach((ch) => {
      clearTimeout(lens.back.get(ch));
      lens.back.delete(ch);
      if (!lens.on.has(ch)) {
        swapFont(ch, true);
        lens.on.add(ch);
      }
    });
    // 범위 밖: 잠시 뒤 원래 서체로
    lens.on.forEach((ch) => {
      if (next.has(ch) || lens.back.has(ch)) return;
      lens.back.set(
        ch,
        setTimeout(() => {
          lens.back.delete(ch);
          lens.on.delete(ch);
          swapFont(ch, false);
        }, SERIF_HOLD)
      );
    });
  };

  const lensUpdate = () => {
    if (!lens.raf) lens.raf = requestAnimationFrame(lensApply);
  };

  const lensClear = () => {
    lens.card = null;
    lensUpdate();
  };

  const go = (step) => {
    if (lock || !step) return;
    lock = true;
    BR.state.breadIndex = (BR.state.breadIndex + step + total()) % total();
    update();
    setTimeout(() => (lock = false), STEP_LOCK);
  };

  // 가운데 카드 수식이 넘칠 때(글자가 커졌을 때 등)는 휠로 수식을 먼저 내림
  const canScroll = (el, dy) => {
    if (!el) return false;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 1) return false;
    return dy > 0 ? el.scrollTop < max - 1 : el.scrollTop > 0;
  };

  const init = () => {
    root = document.querySelector(".recipe");
    thumbs = root.querySelector(".rx-thumbs");
    cards = root.querySelector(".rx-cards");
    info = root.querySelector(".rx-info");
    bar = root.querySelector(".rx-bar");

    thumbs.innerHTML = BR.breads
      .map(
        (b, i) =>
          `<button class="rx-thumb" data-index="${i}" aria-label="${BR.esc(b.kr)}">
             <img src="${b.img}" alt="">
           </button>`
      )
      .join("");

    cards.innerHTML = BR.breads
      .map(
        (b, i) =>
          `<article class="rx-card" data-index="${i}">
             <img class="rx-card__bg" src="${b.img}" alt="" loading="lazy">
             <div class="rx-card__glass">
               <div class="rx-card__scroll">
                 <div class="rx-card__text">
                   <p class="rx-card__label">Recipe</p>
                   <p class="rx-card__formula">${formulaHTML(b.formula)}</p>
                   ${b.desc ? `<p class="rx-card__desc" lang="ko">${BR.esc(b.desc)}</p>` : ""}
                 </div>
               </div>
             </div>
           </article>`
      )
      .join("");

    thumbs.addEventListener("click", (e) => {
      const el = e.target.closest(".rx-thumb");
      if (el) go(offset(Number(el.dataset.index), BR.state.breadIndex));
    });

    // 가운데 카드에 마우스가 들어오고 나갈 때 자동 스크롤 켜고 끄기
    cards.addEventListener("mouseover", syncAuto);
    cards.addEventListener("mouseleave", leaveAuto);

    // 마우스 근처 글자 서체 바꾸기 — 마우스가 움직이거나, 자동 스크롤·글자 커짐으로 글자가 움직일 때 다시 계산
    cards.addEventListener("mousemove", (e) => {
      lens.x = e.clientX;
      lens.y = e.clientY;
      lens.card = e.target.closest('.rx-card[data-slot="0"]');
      lensUpdate();
    });
    cards.addEventListener("mouseleave", lensClear);
    cards.addEventListener("scroll", () => lens.card && lensUpdate(), true);
    cards.addEventListener("transitionend", () => lens.card && lensUpdate());

    // 바뀌는 서체를 미리 받아 둠 (처음 바뀔 때 깜빡임 방지)
    document.fonts?.load("italic 600 50px Baskervville");
    document.fonts?.load('50px "Libertinus Math"', "→Σ₅⁵×∪Δθ°");

    // 위아래로 살짝 보이는 앞뒤 카드를 누르면 그 빵으로
    cards.addEventListener("click", (e) => {
      const el = e.target.closest(".rx-card");
      if (el && el.dataset.slot !== "0") go(offset(Number(el.dataset.index), BR.state.breadIndex));
    });

    root.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const scroller = e.target.closest('.rx-card[data-slot="0"] .rx-card__scroll');
        if (canScroll(scroller, e.deltaY)) {
          scroller.scrollTop += e.deltaY;
          // 직접 굴리면 자동 스크롤은 잠깐 쉬었다가 그 자리부터 이어감
          if (auto.el === scroller) Object.assign(auto, { phase: "wait", until: performance.now() + AUTO_USER_PAUSE });
          return;
        }
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

  // 들어올 때마다 첫 번째 빵부터 (#/recipe/아이디 로 왔으면 그 빵부터)
  const enter = () => {
    BR.state.breadIndex = BR.state.jumpTo ?? 0;
    BR.state.jumpTo = null;
    cards.querySelectorAll(".rx-card__scroll").forEach((el) => (el.scrollTop = 0));
    update(false);
  };

  const leave = () => {
    stopAuto();
    lensClear();
  };

  return { init, enter, leave };
})();

/* 2안에는 상세 페이지가 따로 없음 — #/recipe/아이디 로 들어오면 그 빵을 가운데에 둔 목록으로 */
BR.pages.detail = {
  enter(id) {
    const index = BR.breads.findIndex((b) => b.id === id);
    BR.state.jumpTo = index >= 0 ? index : null;
    location.replace("#/recipe");
  }
};
