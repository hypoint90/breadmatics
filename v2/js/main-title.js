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

/* 타이틀 오른쪽 회색 수식 (v2/css/main.css .mx-eq)
   호버 → 오른쪽에서 들어와 붙음 / 호버 끝 → 유지(EQ_HOLD) 뒤 다시 오른쪽으로 빠짐 */
document.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector(".mx-title");
  if (!title || !title.querySelector(".mx-eq")) return;

  // 헬베티카 노이에가 설치돼 있는지 (글자 폭 비교) — 없으면 html.no-helvetica (v2/css/main.css)
  const hasFont = (name) => {
    const c = document.createElement("canvas").getContext("2d");
    const probe = "BREADMATICS × Σ 0123456789 mmmwwwiii";
    return ["monospace", "serif"].some((base) => {
      c.font = `100px ${base}`;
      const w0 = c.measureText(probe).width;
      c.font = `100px "${name}", ${base}`;
      return c.measureText(probe).width !== w0;
    });
  };
  if (!hasFont("Helvetica Neue")) document.documentElement.classList.add("no-helvetica");

  const EQ_HOLD = 300; // 호버가 끝나고 빠지기 시작하기까지(ms) — 타이틀(1초 유지)보다 먼저 빠짐
  let outTimer = null;

  /* 괄호 ) 가 타이틀 글자의 위(BREADMATICS 대문자 윗선) ~ 아래(RECIPE 기준선)와 꼭 맞게
     글자 모양의 실제 높이를 재서 수식 글자 크기와 위치를 정함 (창 크기·폰트 로딩 때 다시) */
  const eq = title.querySelector(".mx-eq");
  const sans = title.querySelector(".mx-title__sans");
  const serif = title.querySelector(".mx-title__serif");
  const ctx = document.createElement("canvas").getContext("2d");

  // 줄(line-height 1) 안에서 기준선 위치와, 그 글꼴의 글자 높이(위·아래)를 잼
  const metrics = (el, text) => {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const m = ctx.measureText(text);
    const fa = m.fontBoundingBoxAscent;
    const fd = m.fontBoundingBoxDescent;
    const lh = parseFloat(cs.lineHeight) || size;
    return { size, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent, base: (lh - fa - fd) / 2 + fa };
  };

  const fitEq = () => {
    if (!eq || !sans || !serif) return;
    const top = sans.offsetTop + metrics(sans, "B").base - metrics(sans, "B").ascent; // 대문자 윗선
    const bottom = serif.offsetTop + metrics(serif, "R").base; // RECIPE 기준선
    eq.style.fontSize = "100px";
    const p = metrics(eq, ")"); // 100px 일 때 괄호 높이
    const k = (bottom - top) / (p.ascent + p.descent);
    const size = 100 * k;
    eq.style.fontSize = `${size}px`;
    const q = metrics(eq, ")");
    eq.style.top = `${top + q.ascent - q.base}px`; // 괄호 윗끝 = 타이틀 윗선

    // × 와 Σ 의 세로 가운데를 괄호 ) 의 세로 가운데에 맞춤 (기준선에서의 높이 차이만큼 위아래로)
    const mid = (m) => (m.ascent - m.descent) / 2; // 기준선 위 가운데 높이
    const parenMid = mid(q);
    const x = eq.querySelector(".mx-eq__x");
    const rest = eq.querySelector(".mx-eq__rest");
    if (x) x.style.top = `${mid(metrics(x, "×")) - parenMid}px`;
    if (rest) rest.style.top = `${mid(metrics(rest, "Σ")) - parenMid}px`;
  };
  fitEq();
  document.fonts?.ready.then(fitEq);
  window.addEventListener("resize", fitEq);

  title.addEventListener("mouseenter", () => {
    clearTimeout(outTimer);
    title.classList.add("is-eq-in");
  });

  title.addEventListener("mouseleave", () => {
    clearTimeout(outTimer);
    outTimer = setTimeout(() => title.classList.remove("is-eq-in"), EQ_HOLD);
  });
});

/* 수식 Σ 의 윗첨자 숫자가 1~2초마다 아무 숫자로 바뀜 (수식이 보일 때만 — .is-eq-in) */
document.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector(".mx-title");
  const sup = document.querySelector(".mx-eq__sup");
  if (!title || !sup) return;
  const DIGITS = "¹²³⁴⁵⁶⁷⁸⁹";
  const tick = () => {
    if (title.classList.contains("is-eq-in") && BR.router.current() === "main") {
      let d;
      do d = DIGITS[Math.floor(Math.random() * DIGITS.length)];
      while (d === sup.textContent); // 같은 숫자가 연달아 나오지 않게
      sup.textContent = d;
    }
    setTimeout(tick, 1000 + Math.random() * 1000); // 1~2초
  };
  setTimeout(tick, 1000);
});
