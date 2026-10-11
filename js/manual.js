/* =========================================================
   manual.js — 메뉴얼 (스크롤로 읽는 설명서)
   ---------------------------------------------------------
   동작 방식
   - 한 번에 한 항목만 열림 (01 → 02 → … → 07)
   - 휠을 내리면 열린 항목의 설명이 위로 올라가며 읽힘
   - 설명 끝까지 읽은 뒤 조금 더 내리면 → 다음 항목 open, 현재 항목 close
   - 위로 올리면 반대로 이전 항목이 다시 열림 (끝부분부터)
   - 제목을 클릭하면 해당 항목으로 바로 이동

   애니메이션
   - 열림/닫힘 높이, 내용 올라오기, 목록 스크롤을 '하나의 타임라인'으로
     같은 easing 으로 움직여서 끊김 없이 이어지게 함
   - 내용은 선(.m-item__line) 아래 가림막 안에 숨어 있다가 위로 밀려 올라옴
   ========================================================= */

BR.pages.manual = (() => {
  /* ---- 조정용 값 ---- */
  const NEXT_THRESHOLD = 140; // 끝에서 이만큼(px) 더 굴리면 다음 항목으로
  const SWITCH_DURATION = 1100; // 열림/닫힘 시간(ms)
  const RISE = 180; // 내용이 아래에서 올라오는 거리 (피그마 px)
  const SMOOTH = 0.12; // 읽기 스크롤 부드러움 (0~1, 작을수록 미끄러짐)
  const END_RATIO = 0.55; // 설명 끝이 화면 높이의 몇 % 지점까지 올라오면 '다 읽음'
  const PEEK = 40; // 열린 항목 위로 남겨두는 여백 (피그마 px)
  const INTRO_DELAY = 450; // (BR.manualIntro 일 때) 들어온 뒤 01 이 열리기 시작하기까지(ms)

  // 부드러운 가속·감속 (easeInOutCubic)
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let root, list, items, bodies, sections;
  let active = 0; // 열린 항목 번호
  let y = 0; // 현재 스크롤 위치
  let target = 0; // 목표 스크롤 위치
  let push = 0; // 끝에서 더 굴린 양 (다음/이전 전환 판단)
  let anim = null; // 진행 중인 열림/닫힘 애니메이션
  let raf = null;
  let m = null; // 측정값
  let intro = false; // 들어올 때 모두 닫힌 채 기다리는 중 (BR.manualIntro — 2안)
  let introTimer = null;

  /* ---------- 렌더 ---------- */
  // 표: cols(머리줄)는 있을 때만 표시
  const renderTable = (t) => {
    const width = (t.cols || t.rows[0]).length;
    const cls = !t.cols ? "m-table--plain" : width === 3 ? "m-table--3" : "m-table--2";
    const head = (t.cols || []).map((c) => `<span class="m-table__head">${BR.esc(c)}</span>`).join("");
    const cells = head + t.rows.flat().map((c) => `<span>${BR.esc(c)}</span>`).join("");
    return `<div class="m-table ${cls}">${cells}</div>`;
  };

  const renderSections = (list) => {
    if (!list.length) return `<div class="m-sections"><p class="m-empty">내용 준비 중입니다.</p></div>`;
    return `<div class="m-sections">${list
      .map(
        (s) => `
        <section class="m-sec">
          <h3 class="m-sec__title">${BR.esc(s.title)}</h3>
          ${
            s.text
              ? `<div class="m-sec__row">
                   <p class="m-sec__text">${BR.esc(s.text)}</p>
                   ${s.table ? renderTable(s.table) : ""}
                 </div>`
              : renderTable(s.table)
          }
        </section>`
      )
      .join("")}</div>`;
  };

  const render = () =>
    BR.manual
      .map(
        (it, i) => `
        <li class="m-item" data-index="${i}">
          <button class="m-item__head" aria-expanded="false">
            <span class="m-item__num">${it.num}</span>
            <span class="m-item__title">${BR.esc(it.title)}</span>
          </button>
          <div class="m-item__body">${renderSections(it.sections)}</div>
          <span class="m-item__line" aria-hidden="true"></span>
          <span class="m-item__progress" aria-hidden="true"></span>
        </li>`
      )
      .join("");

  /* ---------- 측정 ----------
     항목 k 가 열렸을 때(앞 항목은 모두 닫힘) 의 위치를 계산 */
  const measure = () => {
    const px = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--px")) || 1;
    const cs = getComputedStyle(list);
    const gap = parseFloat(cs.rowGap) || 0;
    const padTop = parseFloat(cs.paddingTop) || 0;
    const V = root.clientHeight;

    const heads = items.map((li) => li.querySelector(".m-item__head").offsetHeight + li.querySelector(".m-item__line").offsetHeight);
    const contents = sections.map((s) => s.offsetHeight);

    const top = [];
    let acc = padTop;
    heads.forEach((h, k) => {
      top[k] = acc;
      acc += h + gap;
    });

    const start = top.map((t, k) => (k === 0 ? 0 : Math.max(0, t - PEEK * px)));
    const end = top.map((t, k) => Math.max(start[k], t + heads[k] + contents[k] - V * END_RATIO));

    m = { start, end, contents, rise: RISE * px };
  };

  /* 애니메이션 없이 현재 상태 그대로 배치 */
  const layoutStatic = () => {
    if (intro) {
      bodies.forEach((b) => (b.style.height = "0px"));
      return;
    }
    bodies.forEach((b, i) => (b.style.height = i === active ? `${m.contents[i]}px` : "0px"));
    sections.forEach((s) => (s.style.transform = ""));
  };

  /* ---------- 상태 반영 ---------- */
  const setClasses = (k) => {
    items.forEach((li, i) => {
      li.classList.toggle("is-open", i === k);
      li.classList.toggle("is-done", i < k);
      li.querySelector(".m-item__head").setAttribute("aria-expanded", String(i === k));
    });
  };

  const updateProgress = () => {
    const range = m.end[active] - m.start[active];
    const p = range > 0 ? (y - m.start[active]) / range : 1;
    items[active].style.setProperty("--read", Math.min(1, Math.max(0, p)).toFixed(3));
  };

  /* ---------- 프레임 루프 ---------- */
  const tick = (now) => {
    if (anim) {
      const t = Math.min(1, (now - anim.t0) / SWITCH_DURATION);
      const e = ease(t);
      const { open, close } = anim;

      // 여는 항목: 가림막이 내려가며 내용이 아래에서 위로 올라옴
      bodies[open].style.height = `${m.contents[open] * e}px`;
      sections[open].style.transform = `translate3d(0, ${m.rise * (1 - e)}px, 0)`;

      // 닫는 항목: 가림막이 올라가며 내용이 선 뒤로 들어감
      if (close !== null) {
        bodies[close].style.height = `${m.contents[close] * (1 - e)}px`;
        sections[close].style.transform = `translate3d(0, ${-m.rise * 0.5 * e}px, 0)`;
      }

      // 목록 스크롤도 같은 타이밍으로
      y = anim.fromY + (anim.toY - anim.fromY) * e;

      if (t >= 1) {
        anim = null;
        y = target;
        layoutStatic();
      }
    } else {
      y += (target - y) * SMOOTH;
      if (Math.abs(target - y) < 0.3) y = target;
    }

    list.style.transform = `translate3d(0, ${-y}px, 0)`;
    updateProgress();
    raf = anim || y !== target ? requestAnimationFrame(tick) : null;
  };

  const animate = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  /* 항목 전환 — 아래로/위로/클릭 모두 해당 항목의 맨 위(제목)로 이동 */
  const openItem = (k) => {
    if (anim || k < 0 || k >= items.length || k === active) return;
    const close = active;
    active = k;
    push = 0;
    setClasses(k);
    target = m.start[k];
    sections[k].style.transform = `translate3d(0, ${m.rise}px, 0)`;
    anim = { t0: performance.now(), open: k, close, fromY: y, toY: target };
    animate();
  };

  /* ---------- 입력 ---------- */
  const scrollBy = (delta) => {
    if (anim || intro) return; // 열리고 닫히는 중에는 입력 무시
    if (!m) relayout();
    const { start, end } = m;
    const next = target + delta;

    if (next > end[active]) {
      target = end[active];
      push = push > 0 ? push + delta : delta;
      if (push > NEXT_THRESHOLD) return openItem(active + 1);
    } else if (next < start[active]) {
      target = start[active];
      push = push < 0 ? push + delta : delta;
      if (push < -NEXT_THRESHOLD) return openItem(active - 1);
    } else {
      target = next;
      push = 0;
    }
    animate();
  };

  /* 전환 직후엔 관성 스크롤(트랙패드)이 멈출 때까지 휠 무시
     → 한 번에 여러 항목이 연달아 넘어가는 것 방지 */
  let lastWheel = 0;
  let waitPause = false;
  const PAUSE_GAP = 180; // 휠 입력이 이만큼(ms) 끊기면 '멈춤'으로 판단

  const onWheel = (e) => {
    e.preventDefault();
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;

    if (anim) {
      waitPause = true;
      return;
    }
    if (waitPause) {
      if (gap < PAUSE_GAP) return;
      waitPause = false;
    }

    const delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY; // 줄 단위 휠 보정
    scrollBy(delta);
  };

  const onKey = (e) => {
    if (BR.router.current() !== "manual") return;
    const page = root.clientHeight * 0.8;
    const map = { ArrowDown: 100, ArrowUp: -100, PageDown: page, PageUp: -page, " ": e.shiftKey ? -page : page };
    if (!(e.key in map)) return;
    e.preventDefault();
    scrollBy(map[e.key]);
  };

  /* 크기 바뀔 때(창 크기, 폰트 로딩) 다시 측정 */
  const relayout = () => {
    if (anim) return;
    measure();
    layoutStatic();
    target = Math.min(Math.max(target, m.start[active]), m.end[active]);
    y = target;
    list.style.transform = `translate3d(0, ${-y}px, 0)`;
    updateProgress();
  };

  /* ---------- 초기화 ---------- */
  const init = () => {
    root = document.querySelector(".manual");
    list = root.querySelector(".manual__list");
    list.innerHTML = render();
    items = [...list.querySelectorAll(".m-item")];
    bodies = items.map((li) => li.querySelector(".m-item__body"));
    sections = items.map((li) => li.querySelector(".m-sections"));
    setClasses(active);

    root.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", relayout);
    document.fonts?.ready.then(relayout);

    list.addEventListener("click", (e) => {
      const head = e.target.closest(".m-item__head");
      if (!head || intro) return;
      openItem(Number(head.parentElement.dataset.index));
    });
  };

  // 들어올 때마다 처음 상태: 01 이 열린 채 맨 위, 읽음 표시 초기화
  const enter = () => {
    cancelAnimationFrame(raf);
    raf = null;
    anim = null;
    // 나갈 때(leave) 붙인 닫힘 전환 제거
    bodies.forEach((b) => (b.style.transition = ""));
    sections.forEach((s) => (s.style.transition = ""));
    active = 0;
    push = 0;
    target = y = 0;
    waitPause = false;
    setClasses(0);
    items.forEach((li) => li.style.setProperty("--read", 0));
    relayout();

    // 2안: 번호 칸들이 모두 닫혀 모여 있다가 → 01 이 열리며 내용이 보임
    clearTimeout(introTimer);
    intro = false;
    if (BR.manualIntro) {
      intro = true;
      setClasses(-1);
      layoutStatic();
      sections[0].style.transform = `translate3d(0, ${m.rise}px, 0)`;
      introTimer = setTimeout(() => {
        intro = false;
        setClasses(0);
        anim = { t0: performance.now(), open: 0, close: null, fromY: 0, toY: 0 };
        animate();
      }, BR.manualIntroDelay ?? INTRO_DELAY); // 메뉴얼북에서 검정 면으로 넘어올 땐 면이 걷힌 뒤에 열림 (v2/js/book-wipe.js)
    }
  };

  // 2안: 나갈 때 — 들어올 때(01 이 열림)를 거꾸로: 열려 있던 항목이 닫히며 내용이 선 뒤로 들어감
  //      (페이지는 그동안 아래로 내려가며 흰 막에 덮임 — v2/css/base.css .page.is-leaving)
  const leave = () => {
    clearTimeout(introTimer);
    if (!BR.manualIntro || !m) return;
    cancelAnimationFrame(raf);
    raf = null;
    anim = null;
    intro = true; // 닫히는 동안 휠·클릭 무시
    const close = "0.5s cubic-bezier(0.7, 0, 0.84, 0)";
    bodies[active].style.transition = `height ${close}`;
    sections[active].style.transition = `transform ${close}`;
    bodies[active].style.height = "0px";
    sections[active].style.transform = `translate3d(0, ${-m.rise * 0.5}px, 0)`;
    setClasses(-1);
  };

  return { init, enter, leave };
})();
