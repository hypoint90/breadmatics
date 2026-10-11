/* =========================================================
   main-title.js — 2안 메인 타이틀
   - 글자를 하나씩 나눔 (BREADMATICS = 고딕 / RECIPE = 세리프)
   - 타이틀 위에서 마우스와 RADIUS 안에 있는 글자만 이탤릭으로 (.is-it)
     고딕: 기울이기(헬베티카 이탤릭 ≈ 12°) / 세리프: 정자체 → 이탤릭 겹쳐 바꾸기 (v2/css/main.css)
   - 범위를 벗어나도 HOLD 만큼 남았다가 원래대로
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector(".mx-title");
  if (!title) return;

  const RADIUS = 170; // 마우스에서 이 거리(피그마 px) 안의 글자만 이탤릭 (타이틀 159px 기준)
  const HOLD = 200; // 범위를 벗어난 뒤 원래대로 돌아가기까지(ms)

  // 글자 나누기 — 세리프는 정자체·이탤릭 두 벌을 겹쳐 둠
  title.querySelectorAll("[data-letters]").forEach((line) => {
    const serif = line.classList.contains("mx-title__serif");
    line.innerHTML = Array.from(line.textContent.trim())
      .map((ch) =>
        serif
          ? `<span class="mx-l"><span class="mx-l__up">${ch}</span><span class="mx-l__it">${ch}</span></span>`
          : `<span class="mx-l">${ch}</span>`
      )
      .join("");
  });

  const letters = [...title.querySelectorAll(".mx-l")];
  const unit = () => Math.min(innerWidth / 1440, innerHeight / 920);
  const on = new Set();
  const back = new Map();
  let mouse = null;
  let raf = null;

  const apply = () => {
    raf = null;
    const r = RADIUS * unit();
    letters.forEach((el) => {
      let near = false;
      if (mouse) {
        const b = el.getBoundingClientRect();
        const dx = b.left + b.width / 2 - mouse.x;
        const dy = b.top + b.height / 2 - mouse.y;
        near = dx * dx + dy * dy <= r * r;
      }
      if (near) {
        clearTimeout(back.get(el));
        back.delete(el);
        if (!on.has(el)) {
          el.classList.add("is-it");
          on.add(el);
        }
      } else if (on.has(el) && !back.has(el)) {
        back.set(
          el,
          setTimeout(() => {
            back.delete(el);
            on.delete(el);
            el.classList.remove("is-it");
          }, HOLD)
        );
      }
    });
  };

  const update = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };

  title.addEventListener("mousemove", (e) => {
    mouse = { x: e.clientX, y: e.clientY };
    update();
  });

  title.addEventListener("mouseleave", () => {
    mouse = null;
    update();
  });

  // 바뀌는 서체를 미리 받아 둠 (처음 바뀔 때 깜빡임 방지)
  document.fonts?.load("italic 600 151px Baskervville");
});

/* 메인 메뉴 옵션을 누르면 그 옵션이 검정으로 차오름 → 페이지가 나가며 오른쪽으로 빠짐 (v2/css/main.css)
   다시 메인으로 돌아왔을 때는 원래대로 */
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".mx-menu");
  if (!menu) return;
  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    menu.querySelectorAll("a").forEach((x) => x.classList.toggle("is-picked", x === a));
  });
  window.addEventListener("hashchange", () => {
    if (BR.router.current() === "main" || /^#\/main|^#?$/.test(location.hash)) {
      menu.querySelectorAll(".is-picked").forEach((x) => x.classList.remove("is-picked"));
    }
  });
});
