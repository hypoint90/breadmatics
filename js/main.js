/* =========================================================
   main.js — 메인 화면
   - 오른쪽 사진: BR.mainSlides 순서대로 자동 전환 (메뉴에 마우스 올리면 일시정지)
   - 타이틀 1줄(BREADMATICS…): 가로로 계속 흐름 (css/main.css .main__marquee)
   ========================================================= */

BR.pages.main = (() => {
  let imgs = [];
  let index = 0;
  let timer = null;
  let paused = false;
  const PRESS_DELAY = 60; // 메뉴 클릭 → 페이지 전환 시작까지(ms). 검정 박스가 먼저 살짝 보이고 나서 함께 올라감

  // 피그마 px 값을 화면 단위로
  const px = (v) => `calc(${v} * var(--px))`;

  const show = (i) => {
    index = (i + imgs.length) % imgs.length;
    imgs.forEach((img, k) => img.classList.toggle("is-active", k === index));
  };

  const start = () => {
    stop();
    timer = setInterval(() => {
      if (!paused) show(index + 1);
    }, BR.mainSlideInterval);
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
  };

  const init = () => {
    const visual = document.querySelector(".main__visual");
    const menu = document.querySelector(".main__menu");
    const track = document.querySelector(".main__marquee-track");

    // 슬라이드 — 화면 오른쪽 끝 기준으로 피그마와 같은 거리에 배치
    // (오른쪽으로 넘치는 부분은 화면 밖으로 나가서 잘린 면이 보이지 않음)
    const cropStyle = (c) => (c ? `left:${c[0]}%;top:${c[1]}%;width:${c[2]}%;height:${c[3]}%` : "");
    visual.innerHTML = BR.mainSlides
      .map(
        (s, i) =>
          // 전환 때 깜빡이지 않도록 모든 슬라이드를 미리 불러옴 (lazy 사용 안 함)
          `<div class="main__slide ${i === 0 ? "is-active" : ""} ${s.crop ? "is-crop" : ""}"
                style="right:${px(1440 - s.x - s.w)};top:${px(s.y)};width:${px(s.w)};height:${px(s.h)}">
             <img src="${s.img}" alt="" decoding="async" style="${cropStyle(s.crop)}">
           </div>`
      )
      .join("");
    imgs = [...visual.querySelectorAll(".main__slide")];

    // 흐르는 타이틀: 같은 묶음을 2번 넣고 절반만큼 이동 → 끊김 없이 반복
    const unit = `<span>BREAD</span><span class="sans">MATICS</span>`;
    const half = `<span class="main__marquee-half">${unit.repeat(4)}</span>`;
    track.innerHTML = half + half;

    // 메뉴 — 마우스를 올리면 슬라이드를 멈추고 해당 사진(hover)을 보여줌
    menu.innerHTML = BR.mainMenu
      .map((m, i) => `<li><a href="${m.href}" data-index="${i}">${BR.arrowSVG()}<span>${BR.esc(m.label)}</span></a></li>`)
      .join("");
    menu.querySelectorAll("a").forEach((a) => {
      const { hover } = BR.mainMenu[Number(a.dataset.index)];
      const onEnter = () => {
        paused = true;
        if (hover !== undefined) show(hover);
      };
      a.addEventListener("mouseenter", onEnter);
      a.addEventListener("focus", onEnter);
    });
    // 클릭: 검정 박스가 왼쪽에서 채워지는 동안 메인이 위로 올라가며 사라짐 (피그마 Component 1 '선택창3')
    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();
      if (menu.classList.contains("is-going")) return;
      menu.classList.add("is-going");
      a.classList.add("is-pressed");
      setTimeout(() => (location.hash = a.getAttribute("href")), PRESS_DELAY);
    });

    // 메뉴에서 벗어나면 그 사진부터 다시 자동 전환 (간격 처음부터)
    menu.addEventListener("mouseleave", () => {
      paused = false;
      start();
    });
  };

  return {
    init,
    enter: () => {
      // 다른 페이지에서 돌아오면 눌렸던 메뉴 원래대로
      const menu = document.querySelector(".main__menu");
      menu.classList.remove("is-going");
      menu.querySelectorAll(".is-pressed").forEach((a) => a.classList.remove("is-pressed"));
      // 흐르는 타이틀도 처음 위치부터 다시
      const track = document.querySelector(".main__marquee-track");
      track.style.animation = "none";
      void track.offsetWidth;
      track.style.animation = "";
      paused = false;
      show(0);
      start();
    },
    leave: stop
  };
})();
