/* =========================================================
   make.js — Make my recipe (나만의 빵 만들기)
   피그마: 나만의 빵 만들기 (node 2265-1591)

   1) 문항: 한 화면에 한 문항씩, 가운데 패널에 표시
   2) 배경: 고른 답이 글자로 떨어져 바닥에 쌓임 (간단한 물리)
   3) 완성: 쌓인 글자가 바닥 아래로 우수수 떨어진 뒤 → 수식이 한 줄씩 완성
   4) 레시피 모음: 만든 빵을 이 브라우저에 최신 15개까지 저장, 결과 화면 오른쪽에 목록

   선택지·수치: js/make-data.js (window.BBANG_MAKE)
   수식 생성:   js/make-engine.js (window.BbangMaker)
   ========================================================= */

BR.pages.make = (() => {
  const D = window.BBANG_MAKE;
  const Mk = window.BbangMaker;

  /* ---------- 모션 값 (여기서 조정) ---------- */
  const AUTO_NEXT = 520; // 하나만 고르는 문항: 고른 뒤 다음 문항으로 넘어가기까지(ms)
  const SWAP_OUT = 380; // 문항이 사라지는 시간(ms) — css/make.css .mk-q.is-out 과 맞춤
  const DROP_TIME = 2200; // 완성 시 글자가 바닥 아래로 떨어지는 시간(ms) — 넉넉히 (다 떨어지면 바로 넘어감)

  const mkName = (sym) => D.names[sym] || sym;
  const range = (r, unit) => (r[0] === r[1] ? `${r[0]}${unit}` : `${r[0]}~${r[1]}${unit}`);
  const find = (list, id) => list.find((x) => x.id === id);
  const isFried = (c) => c.type === "fried";
  const symItems = (syms, labels = {}) => syms.map((s) => ({ id: s, sym: s, label: labels[s] || mkName(s), fall: s, math: true }));

  /* ---------------------------------------------------------
     문항 목록
     kind: single(하나 고르기) / multi(여러 개) / name(이름 입력)
     optional: 안 골라도 넘어갈 수 있음
     when: 이 문항이 나오는 조건 (빵 유형에 따라 빠지는 문항)
     items: 선택지 [{ id, label, desc, sym, fall(떨어지는 글자), math(수식 글꼴) }]
     --------------------------------------------------------- */
  const QUESTIONS = [
    {
      id: "type",
      title: "어떤 빵을 만들까요?",
      items: () => D.types.map((t) => ({ id: t.id, label: t.ko, desc: t.desc, fall: t.ko }))
    },
    {
      id: "size",
      title: "반죽은 얼마나 만들까요?",
      lede: "전체 반죽의 양이에요. 빵 하나의 크기는 뒤에서 정해요.",
      items: () => D.sizes.map((s) => ({ id: s.id, label: s.ko, desc: `밀가루 ${s.flour}g`, fall: `F${Mk.sub(s.flour)}·g`, math: true }))
    },
    {
      id: "subs",
      kind: "multi",
      optional: true,
      title: "무엇을 더 넣을까요?",
      lede: (c) => {
        const lim = D.subLimits[c.type];
        return `종류는 ${lim.maxCats}가지까지, 종류마다 ${lim.perCat}개까지 고를 수 있어요.`;
      },
      when: (c) => c.type && D.subLimits[c.type].cats.length > 0
    },
    {
      id: "powder",
      optional: true,
      title: "향을 더할 가루를 넣을까요?",
      items: () => symItems(D.powders.items)
    },
    {
      id: "mix1",
      title: (c) => (c.type === "lean" ? "얼마나 세게 치댈까요?" : "처음엔 얼마나 세게 치댈까요?"),
      lede: "세게 치댈수록 반죽 온도가 올라가요.",
      items: () => mixItems()
    },
    {
      id: "mix2",
      title: "버터를 넣고, 얼마나 세게?",
      when: (c) => c.type && c.type !== "lean",
      items: () => mixItems()
    },
    {
      id: "f1",
      title: "어떻게 발효할까요?",
      lede: (c) => (c.type === "laminated" ? "발효가 끝나면 버터를 넣고 세 번 접어요." : "이스트가 반죽을 부풀려요."),
      items: () => D.ferment1.map((f) => ({ id: f.id, label: f.ko, desc: `${range(f.T, "°")} · ${range(f.t, "분")}`, fall: `${f.ko.split(" ")[0]} 발효` }))
    },
    {
      id: "breadSize",
      title: "빵 하나의 크기는?",
      items: () => D.breadSizes.map((b) => ({ id: b.id, label: b.ko, desc: b.w ? `개당 ${range(b.w, "g")}` : "나누지 않음", fall: b.ko }))
    },
    {
      id: "shape",
      title: "어떤 모양으로 만들까요?",
      items: () =>
        D.shapes.map((s) => ({
          id: s.id,
          label: s.ko,
          desc: s.id === "round" ? "둥글린 그대로" : s.id === "flat" ? `${range(s.press.A, "mm")}로 밀기` : "밀고 나서 말기",
          fall: s.ko
        }))
    },
    {
      id: "f2",
      title: "2차 발효는 얼마나 할까요?",
      items: (c) =>
        D.ferment2[c.type === "laminated" ? "laminated" : "default"].map((f) => ({
          id: f.id,
          label: f.ko,
          desc: `${range(f.T, "°")} · ${range(f.t, "분")}`,
          fall: `2차 ${f.ko}`
        }))
    },
    {
      id: "preFill",
      optional: true,
      title: (c) => (isFried(c) ? "튀기기 전, 속에 넣을 재료는?" : "굽기 전, 속에 넣을 재료는?"),
      items: () => symItems(D.preFill.items)
    },
    {
      id: "preTop",
      optional: true,
      title: "굽기 전, 위에 올릴 재료는?",
      when: (c) => !isFried(c),
      items: () => symItems(D.preTop.items, D.preTop.labels)
    },
    {
      id: "cook",
      title: (c) => (isFried(c) ? "기름 온도는?" : "오븐 온도는?"),
      lede: "시간은 빵 크기와 온도에 맞춰 정해져요.",
      items: (c) =>
        (isFried(c) ? D.fry.levels : D.bake.levels).map((l) => ({ id: l.id, label: l.ko, desc: range(l.T, "°"), fall: `${l.T[0]}°`, math: true }))
    },
    {
      id: "postFill",
      optional: true,
      title: (c) => (isFried(c) ? "튀긴 뒤, 속에 짜 넣을 크림은?" : "구운 뒤, 속에 짜 넣을 크림은?"),
      items: () => symItems(D.postFill.items)
    },
    {
      id: "postTop",
      optional: true,
      title: "마지막으로, 위에 올릴 마무리는?",
      items: () => symItems(D.postTop.items, D.postTop.labels)
    },
    {
      id: "name",
      kind: "name",
      optional: true,
      title: "빵의 이름을 지어 주세요",
      lede: `비워 두면 '${D.defaultName}'이 돼요.`
    }
  ];

  const mixItems = () => {
    const word = { weak: "약하게", mid: "중간", strong: "강하게" };
    return D.mixLevels.map((l) => ({ id: l.id, label: word[l.id], desc: `${range(l.n, "단계")} · ${range(l.t, "분")}`, fall: `Σ ${l.ko}` }));
  };

  // css 의 --px 와 같은 값 (피그마 1px 이 화면에서 몇 px 인지)
  const pxUnit = () => Math.min(innerWidth / 1440, innerHeight / 920);

  const val = (fnOrValue, c) => (typeof fnOrValue === "function" ? fnOrValue(c) : fnOrValue);

  /* ---------------------------------------------------------
     상태
     --------------------------------------------------------- */
  let root, panel, qBox, pileEl, resultEl;
  let S;
  let busy = false; // 문항 전환 중 클릭 막기
  let autoTimer = null;

  const fresh = () => ({ qid: "type", c: Mk.blank(), rolls: {}, done: false, none: new Set() });

  // '선택하지 않음' 선택지 id (none: 이 선택지를 고른 문항 목록)
  const NONE = "__none";
  const noneItem = { id: NONE, label: "선택하지 않음", none: true };
  const isOn = (q, id) => (id === NONE ? S.none.has(q.id) : S.c[q.id] === id);

  // 빵 유형을 고르기 전에는 모든 문항을 센다 (고른 뒤 빠지는 문항이 생기면 줄어듦)
  const activeList = () => QUESTIONS.filter((q) => !q.when || !S.c.type || q.when(S.c));
  const current = () => find(QUESTIONS, S.qid);

  const answered = (q) => {
    const v = S.c[q.id];
    if (q.kind === "multi") return v.length > 0;
    if (q.kind === "name") return true;
    return v != null;
  };

  // 빵 유형이 바뀌면 그 유형에서 쓸 수 없는 선택을 비움 (원본 setType 과 같은 규칙)
  const setType = (id) => {
    const c = S.c;
    c.type = id;
    const lim = D.subLimits[id];
    const catOf = (sym) => D.subCategories.find((k) => k.items.includes(sym)).id;
    c.subs = c.subs.filter((s) => lim.cats.includes(catOf(s)));
    const cats = [...new Set(c.subs.map(catOf))].slice(0, lim.maxCats);
    c.subs = c.subs.filter((s) => cats.includes(catOf(s)));
    cats.forEach((k) => c.subs.filter((s) => catOf(s) === k).slice(lim.perCat).forEach((s) => c.subs.splice(c.subs.indexOf(s), 1)));
    if (id === "lean") c.mix2 = null;
    if (id === "fried") c.preTop = null;
  };

  /* ---------------------------------------------------------
     1) 문항 그리기
     --------------------------------------------------------- */
  const optionHTML = (q, it, on) => `
    <button type="button" class="mk-opt${it.sym ? " mk-opt--sym" : ""}${it.none ? " mk-opt--none" : ""}${on ? " is-on" : ""}" data-id="${BR.esc(it.id)}" aria-pressed="${on}">
      ${it.sym ? `<span class="mk-opt__sym">${BR.esc(it.sym)}</span>` : ""}
      <span class="mk-opt__label">${BR.esc(it.label)}</span>
      ${it.desc ? `<span class="mk-opt__desc">${BR.esc(it.desc)}</span>` : ""}
    </button>`;

  // 부재료: 종류(카테고리)별 줄
  const subsHTML = () => {
    const c = S.c;
    const lim = D.subLimits[c.type];
    const F = find(D.sizes, c.size)?.flour || 300;
    const catOf = (sym) => D.subCategories.find((k) => k.items.includes(sym)).id;
    const used = [...new Set(c.subs.map(catOf))];
    return D.subCategories
      .filter((k) => lim.cats.includes(k.id))
      .map((k) => {
        const picked = c.subs.filter((s) => k.items.includes(s));
        const catLocked = !used.includes(k.id) && used.length >= lim.maxCats;
        return `<div class="mk-subrow${catLocked ? " is-locked" : ""}">
          <p class="mk-subrow__name">${k.ko}<span>${Math.round((F * k.pct) / 100)}g</span></p>
          <div class="mk-subrow__chips">${k.items
            .map((s) => {
              const on = picked.includes(s);
              const locked = !on && (catLocked || picked.length >= lim.perCat);
              return `<button type="button" class="mk-chip${on ? " is-on" : ""}" data-sub="${s}" aria-pressed="${on}" ${locked ? "disabled" : ""}>
                <span class="mk-chip__sym">${s}</span><span class="mk-chip__label">${mkName(s)}</span></button>`;
            })
            .join("")}</div>
        </div>`;
      })
      .join("");
  };

  const bodyHTML = (q) => {
    const c = S.c;
    if (q.kind === "multi")
      return `<div class="mk-q__subnone">${optionHTML(q, noneItem, isOn(q, NONE))}</div><div class="mk-q__subs">${subsHTML()}</div>`;
    if (q.kind === "name")
      return `<label class="mk-name">
          <input type="text" class="mk-name__input" maxlength="${D.nameMax}" placeholder="${BR.esc(D.defaultName)}" value="${BR.esc(c.name)}" autocomplete="off" spellcheck="false">
          <span class="mk-name__count"><b>${[...c.name].length}</b> / ${D.nameMax}</span>
        </label>`;
    // 안 골라도 되는 문항은 맨 앞에 '선택하지 않음'
    const items = (q.optional ? [noneItem] : []).concat(q.items(c));
    const cols = items.length === 4 ? 2 : Math.min(items.length, 3);
    return `<div class="mk-q__opts" style="--cols:${cols}">${items.map((it) => optionHTML(q, it, isOn(q, it.id))).join("")}</div>`;
  };

  const nextLabel = (q) => {
    if (q.kind === "name") return "완성하기";
    return answered(q) || S.none.has(q.id) ? "다음" : "넘어가기";
  };

  const renderQuestion = (dir = 1) => {
    const q = current();
    const list = activeList();
    const idx = list.indexOf(q);
    const lede = val(q.lede, S.c);

    const el = document.createElement("div");
    el.className = `mk-q mk-q--${q.kind || "single"} is-in`;
    el.style.setProperty("--dir", dir);
    el.innerHTML = `
      <button type="button" class="mk-q__prev" ${idx === 0 ? "hidden" : ""}>${BR.arrowSVG("arrow--left")}이전</button>
      <p class="mk-q__count">${idx + 1} / ${list.length}</p>
      <div class="mk-q__head">
        <h2 class="mk-q__title">${BR.esc(val(q.title, S.c))}</h2>
        ${lede ? `<p class="mk-q__lede">${BR.esc(lede)}</p>` : ""}
      </div>
      <div class="mk-q__body">${bodyHTML(q)}</div>
      <button type="button" class="mk-q__next" ${!q.optional && !answered(q) ? "disabled" : ""}>${nextLabel(q)}</button>`;

    // 이전 문항은 위로 사라지고, 새 문항이 아래에서 올라옴
    const old = qBox.querySelector(".mk-q:not(.is-out)");
    if (old) {
      old.classList.add("is-out");
      old.style.setProperty("--dir", dir);
      setTimeout(() => old.remove(), SWAP_OUT + 50);
    }
    qBox.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("is-in")));

    const input = el.querySelector(".mk-name__input");
    if (input) setTimeout(() => input.focus({ preventScroll: true }), SWAP_OUT);
  };

  // 같은 문항 안에서 선택만 바뀐 경우: 다시 만들지 않고 표시만 갱신
  const refreshQuestion = () => {
    const q = current();
    const el = qBox.querySelector(".mk-q:not(.is-out)");
    if (!el) return;
    if (q.kind === "multi") el.querySelector(".mk-q__subs").innerHTML = subsHTML();
    if (q.kind !== "name")
      el.querySelectorAll(".mk-opt").forEach((b) => {
        const on = isOn(q, b.dataset.id);
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on);
      });
    const next = el.querySelector(".mk-q__next");
    next.textContent = nextLabel(q);
    next.disabled = !q.optional && !answered(q);
    // 빵 유형이 바뀌면 전체 문항 수가 바뀔 수 있음
    const list = activeList();
    el.querySelector(".mk-q__count").textContent = `${list.indexOf(q) + 1} / ${list.length}`;
  };

  const goto = (qid, dir) => {
    clearTimeout(autoTimer);
    busy = true;
    S.qid = qid;
    renderQuestion(dir);
    setTimeout(() => (busy = false), SWAP_OUT);
  };

  const next = () => {
    const list = activeList();
    const i = list.indexOf(current());
    if (i === list.length - 1) return complete();
    goto(list[i + 1].id, 1);
  };

  const prev = () => {
    const list = activeList();
    const i = list.indexOf(current());
    if (i > 0) goto(list[i - 1].id, -1);
  };

  const onClick = (e) => {
    if (busy || S.done) return;
    const q = current();
    const c = S.c;

    if (e.target.closest(".mk-q__prev")) return prev();
    if (e.target.closest(".mk-q__next")) return next();

    const opt = e.target.closest(".mk-opt");
    if (opt) {
      const id = opt.dataset.id;
      clearTimeout(autoTimer);
      if (id === NONE) {
        // 선택하지 않음: 고른 것을 비우고 다음 문항으로
        if (q.kind === "multi") c.subs = [];
        else c[q.id] = null;
        S.none.add(q.id);
        autoTimer = setTimeout(next, AUTO_NEXT);
      } else {
        S.none.delete(q.id);
        // 선택 사항(optional)은 다시 누르면 해제
        if (q.optional && c[q.id] === id) c[q.id] = null;
        else if (q.id === "type") setType(id);
        else c[q.id] = id;
        if (c[q.id] != null) autoTimer = setTimeout(next, AUTO_NEXT);
      }
      refreshQuestion();
      syncPile();
      return;
    }

    const chip = e.target.closest(".mk-chip");
    if (chip && !chip.disabled) {
      const s = chip.dataset.sub;
      const at = c.subs.indexOf(s);
      if (at >= 0) c.subs.splice(at, 1);
      else c.subs.push(s);
      S.none.delete(q.id);
      refreshQuestion();
      syncPile();
    }
  };

  const onInput = (e) => {
    if (!e.target.matches(".mk-name__input")) return;
    S.c.name = [...e.target.value].slice(0, D.nameMax).join("");
    e.target.closest(".mk-q").querySelector(".mk-name__count b").textContent = [...S.c.name].length;
  };

  const onKey = (e) => {
    if (BR.router.current() !== "make" || S.done || busy) return;
    if (e.key === "Enter" && e.target.matches?.(".mk-name__input")) next();
  };

  /* ---------------------------------------------------------
     2) 배경: 떨어져 쌓이는 글자
     글자 하나 = 상자 하나 (회전은 보기용, 충돌은 똑바른 상자로 계산)
     --------------------------------------------------------- */
  const pile = (() => {
    const bodies = [];
    let W = 0;
    let H = 0;
    let raf = null;
    let last = 0;
    let floorOn = true;
    let onEmpty = null;
    let fallen = []; // 완성 때 바닥 아래로 떨어진 글자들 (결과 화면에서 위에서 다시 떨어뜨림 — BR.makeRain)

    const unit = pxUnit;

    const measure = () => {
      W = pileEl.clientWidth;
      H = pileEl.clientHeight;
    };

    const add = (tag, text, math) => {
      const px = unit();
      const el = document.createElement("span");
      el.className = `mk-fall${math ? " mk-fall--math" : ""}`;
      el.textContent = text;
      // 글자 크기: 기호는 크게, 한글은 조금 작게 (피그마 px 기준)
      // 글자 크기 (피그마 px) — 처음 크기에서 50% 키움
      const sizes = math ? [165, 195, 225, 255] : [96, 114, 135, 156];
      const fs = sizes[Math.floor(Math.random() * sizes.length)];
      el.style.fontSize = `${fs * px}px`;
      pileEl.appendChild(el);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const b = {
        tag,
        el,
        fs,
        w,
        h,
        x: w / 2 + Math.random() * Math.max(1, W - w),
        y: -h / 2 - Math.random() * 120 * px,
        vx: 0,
        vy: 0,
        rot: (Math.random() - 0.5) * 30,
        vr: (Math.random() - 0.5) * 40,
        rest: (Math.random() - 0.5) * 8, // 쌓였을 때 기울기
        sleep: false
      };
      bodies.push(b);
      draw(b);
      start();
    };

    const remove = (tag) => {
      const i = bodies.findIndex((b) => b.tag === tag);
      if (i < 0) return;
      const [b] = bodies.splice(i, 1);
      b.el.classList.add("is-gone");
      setTimeout(() => b.el.remove(), 400);
      wakeAll(); // 받치던 글자가 사라지면 위의 글자들이 다시 떨어짐
    };

    const wakeAll = () => {
      bodies.forEach((b) => (b.sleep = false));
      start();
    };

    const tags = () => bodies.map((b) => b.tag);

    const draw = (b) => {
      b.el.style.transform = `translate3d(${b.x - b.w / 2}px, ${b.y - b.h / 2}px, 0) rotate(${b.rot}deg)`;
    };

    // b 아래에서 받쳐 줄 수 있는 가장 높은 면 (가로로 겹치는 글자 중 b 보다 아래에 있는 것)
    const groundOf = (b, prevBottom) => {
      let top = floorOn ? H : Infinity;
      let supports = [];
      for (const o of bodies) {
        if (o === b || o.dead || o.ghost) continue; // 결과 화면에서 떨어지는 글자(ghost)는 받침이 되지 않음
        const overlapX = Math.abs(o.x - b.x) < (o.w + b.w) / 2 - 2;
        const oTop = o.y - o.h / 2;
        if (!overlapX || oTop < prevBottom - 2) continue;
        if (oTop < top - 0.5) {
          top = oTop;
          supports = [o];
        } else if (Math.abs(oTop - top) <= 0.5) supports.push(o);
      }
      return { top, supports };
    };

    const step = (dt) => {
      const px = unit();
      const g = 2600 * px;
      let awake = 0;

      // 아래쪽 글자부터 처리해야 위에 쌓이는 글자가 정확히 얹힘
      bodies.sort((a, b) => b.y - a.y);

      for (const b of bodies) {
        if (b.sleep || b.wait > 0) {
          if (b.wait > 0) {
            b.wait -= dt;
            awake++;
          }
          continue;
        }
        awake++;
        const prevBottom = b.y + b.h / 2;
        b.vy += g * dt;
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        b.x = Math.min(Math.max(b.x, b.w / 2), W - b.w / 2);
        b.rot += b.vr * dt;

        // 결과 화면에서 떨어지는 글자(ghost)는 서로 부딪히지 않고 그대로 통과
        const { top, supports } = b.ghost ? { top: Infinity, supports: [] } : groundOf(b, prevBottom);
        if (b.y + b.h / 2 >= top) {
          b.y = top - b.h / 2;
          // 세게 떨어지면 살짝 튀어오름
          if (b.vy > 900 * px) {
            b.vy = -b.vy * 0.16;
            b.vr *= -0.5;
          } else {
            b.vy = 0;
            // 받침 범위 밖에 무게중심이 있으면 옆으로 미끄러져 떨어짐
            if (supports.length) {
              const left = Math.min(...supports.map((o) => o.x - o.w / 2));
              const right = Math.max(...supports.map((o) => o.x + o.w / 2));
              if (b.x < left) b.vx = Math.min(b.vx, -260 * px);
              else if (b.x > right) b.vx = Math.max(b.vx, 260 * px);
              else b.vx *= 0.6;
            } else b.vx *= 0.6;
            // 기울기는 쌓였을 때 각도로 천천히
            b.rot += (b.rest - b.rot) * Math.min(1, dt * 12);
            b.vr = 0;
            // 바닥이 열린 뒤(완성)에는 잠들지 않음 — 아래 글자가 빠지면 같이 떨어져야 함
            if (floorOn && Math.abs(b.vx) < 5 * px && Math.abs(b.rot - b.rest) < 0.3) {
              b.vx = 0;
              b.rot = b.rest;
              b.sleep = true;
            }
          }
        }

        // 바닥이 열린 상태(완성)에서 화면 아래로 빠지면 제거
        if (!floorOn && b.y - b.h / 2 > H + 40) b.dead = true;
        draw(b);
      }

      for (let i = bodies.length - 1; i >= 0; i--) {
        if (bodies[i].dead) {
          bodies[i].el.remove();
          bodies.splice(i, 1);
        }
      }
      if (!floorOn && !bodies.length && onEmpty) {
        const cb = onEmpty;
        onEmpty = null;
        cb();
      }
      return awake;
    };

    const loop = (t) => {
      const dt = Math.min((t - last) / 1000, 1 / 30);
      last = t;
      const awake = step(dt);
      raf = awake || (!floorOn && bodies.length) ? requestAnimationFrame(loop) : null;
    };

    const start = () => {
      if (raf || BR.router.current() !== "make") return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = null;
    };

    // 완성: 바닥을 열어 모든 글자를 우수수 떨어뜨림
    const drop = (done) => {
      floorOn = false;
      const px = unit();
      // 떨어진 글자 기억 (같은 가로 위치·크기로 결과 화면 위에서 이어서 떨어짐)
      fallen = bodies.map((b) => ({
        text: b.el.textContent,
        math: b.el.classList.contains("mk-fall--math"),
        fs: b.fs,
        rx: b.x / (W || 1),
        rot: b.rot
      }));
      bodies.forEach((b) => {
        b.sleep = false;
        b.wait = Math.random() * 0.25; // 조금씩 다른 때에 떨어지기 시작
        b.vy = Math.random() * 120 * px; // 튀어 오르지 않고 그대로 아래로
        b.vx = (Math.random() - 0.5) * 160 * px;
        b.vr = (Math.random() - 0.5) * 120;
      });
      onEmpty = done;
      if (!bodies.length) {
        onEmpty = null;
        done();
      }
      start();
    };

    // 결과 화면 시작: 방금 바닥 아래로 빠진 글자들이 화면 위에서 이어서 떨어져 내려가 사라짐
    // 서로 부딪히지 않고(ghost) 원래보다 작은 글자(RAIN_SCALE)로 자연스럽게 떨어짐
    // (2안 — BR.makeRain. 완성 때 떨어지는 움직임과 이어지도록 같은 가로 자리·빠른 속도로 시작)
    const rain = () => {
      if (!fallen.length) return;
      const RAIN_SCALE = 0.5; // 결과 화면에서 떨어지는 글자 크기 (원래 크기 대비)
      floorOn = false;
      onEmpty = null;
      const px = unit();
      fallen.forEach((f, k) => {
        const el = document.createElement("span");
        el.className = `mk-fall${f.math ? " mk-fall--math" : ""}`;
        el.textContent = f.text;
        el.style.fontSize = `${f.fs * RAIN_SCALE * px}px`;
        pileEl.appendChild(el);
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const b = {
          tag: `rain:${k}`,
          ghost: true,
          el,
          fs: f.fs,
          w,
          h,
          x: Math.min(Math.max(f.rx * W, w / 2), W - w / 2),
          y: -h / 2 - Math.random() * 160 * px,
          vx: (Math.random() - 0.5) * 120 * px,
          vy: (500 + Math.random() * 400) * px, // 떨어지던 흐름을 이어서
          rot: f.rot,
          vr: (Math.random() - 0.5) * 60,
          rest: 0,
          wait: Math.random() * 0.45,
          sleep: false
        };
        bodies.push(b);
        draw(b);
      });
      fallen = [];
      start();
    };

    const clear = () => {
      bodies.splice(0).forEach((b) => b.el.remove());
      floorOn = true;
      onEmpty = null;
    };

    // 화면 크기가 바뀌면 글자 크기를 다시 맞추고 위에서 다시 떨어뜨림
    // (그대로 늘이거나 줄이면 쌓인 글자끼리 겹침)
    const resize = () => {
      const oldW = W;
      const oldH = H;
      measure();
      if (!floorOn || (W === oldW && H === oldH)) return;
      const px = unit();
      bodies
        .sort((a, b) => b.y - a.y) // 아래에 있던 글자부터 다시 쌓이도록
        .forEach((b, i) => {
          b.el.style.fontSize = `${b.fs * px}px`;
          b.w = b.el.offsetWidth;
          b.h = b.el.offsetHeight;
          b.x = Math.min(Math.max((b.x / (oldW || W)) * W, b.w / 2), W - b.w / 2);
          b.y = -b.h / 2 - i * 60 * px;
          b.vx = b.vy = 0;
          b.sleep = false;
          draw(b);
        });
      start();
    };

    return { add, remove, tags, drop, rain, clear, start, stop, measure, resize };
  })();

  // 지금 선택 상태에 맞춰 배경 글자 추가/제거
  const syncPile = () => {
    const want = new Map();
    activeList().forEach((q) => {
      const v = S.c[q.id];
      if (q.kind === "multi") v.forEach((s) => want.set(`${q.id}:${s}`, { text: s, math: true }));
      else if (q.kind !== "name" && v != null) {
        const it = find(q.items(S.c), v);
        if (it) want.set(`${q.id}:${v}`, { text: it.fall, math: it.math });
      }
    });
    const have = pile.tags();
    have.filter((t) => !want.has(t)).forEach((t) => pile.remove(t));
    want.forEach((v, t) => {
      if (!have.includes(t)) pile.add(t, v.text, v.math);
    });
  };

  /* ---------------------------------------------------------
     3) 완성 → 수식
     --------------------------------------------------------- */
  const complete = () => {
    if (S.done) return;
    S.done = true;
    clearTimeout(autoTimer);
    root.classList.add("is-dropping"); // 패널 내용이 먼저 사라짐
    pile.drop(() => setTimeout(showResult, 150));
    // 혹시 글자가 다 안 빠져도 일정 시간 뒤에는 넘어감
    setTimeout(() => !root.classList.contains("is-result") && showResult(), DROP_TIME + 900);
  };

  const unitText = (x) => (x.unit === "p" ? "개" : x.unit);

  /* ---------- 레시피 모음 (이 사이트에서 만들어진 빵) ----------
     처음 기획 그대로: 이 브라우저에 최신 15개만 저장 (오래된 것부터 지움)
     저장할 수 없는 환경(사생활 보호 모드 등)에서는 화면에만 남음 */
  const COLLECTION_KEY = "breadmatics.collection";

  const loadCollection = () => {
    try {
      return JSON.parse(localStorage.getItem(COLLECTION_KEY)) || [];
    } catch (e) {
      return [];
    }
  };

  const saveRecord = (rec) => {
    const list = loadCollection().filter((x) => x.id !== rec.id);
    list.push(rec);
    while (list.length > D.collectionMax) list.shift();
    try {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(list));
    } catch (e) {
      /* 저장 불가 — 지금 화면에만 표시 */
    }
    return list;
  };

  // 지금 고른 답 → 저장할 레시피 한 건
  const buildRecord = () => {
    const out = Mk.generate(S.c, S.rolls, D);
    const name = S.c.name.trim() || D.defaultName;
    return {
      id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name,
      type: find(D.types, S.c.type).ko,
      rows: out.rows.map(({ sym, ko, amt, unit }) => ({ sym, ko, amt, unit })),
      count: out.count,
      per: out.per,
      lines: [...out.formula.split("\n"), "", `= (${name})`],
      createdAt: Date.now()
    };
  };

  const pad2 = (n) => String(n).padStart(2, "0");
  const dateText = (t) => {
    const d = new Date(t);
    return `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  // 기록된 지 얼마나 됐는지 — 방금 전 / 3분 전 / 2시간 전 / 어제 / 5일 전 (일주일 넘으면 날짜)
  const agoText = (t) => {
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return "방금 전";
    if (s < 3600) return `${Math.floor(s / 60)}분 전`;
    if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
    const days = Math.floor(s / 86400);
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    const d = new Date(t);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  let collection = [];
  let latestId = null;

  // 오른쪽: 만들어진 빵 목록 (최신이 위)
  const collectionHTML = (shownId) => `
    <aside class="mk-col">
      <p class="mk-col__head"><span>이곳에서 만들어진 빵</span><span>${pad2(collection.length)} / ${D.collectionMax}</span></p>
      <ol class="mk-col__list">${[...collection]
        .reverse()
        .map((r, k) => {
          const no = k + 1; // 위(가장 최근)부터 01
          const first = (r.lines.find((l) => l.trim().startsWith("→")) || "").trim();
          return `<li><button type="button" class="mk-col__item${r.id === shownId ? " is-current" : ""}" data-id="${r.id}">
              <span class="mk-col__no">${pad2(no)}</span>
              <span class="mk-col__name">${BR.esc(r.name)}${r.id === latestId ? `<em>방금 만든 빵</em>` : `<small class="mk-col__ago">${agoText(r.createdAt)}</small>`}</span>
              <span class="mk-col__meta">${BR.esc(r.type)} · ${dateText(r.createdAt)}</span>
              <span class="mk-col__eq">${BR.esc(first)}</span>
            </button></li>`;
        })
        .join("")}</ol>
    </aside>`;

  // 결과 화면 그리기: 왼쪽 정보 · 가운데 수식 · 오른쪽 레시피 모음
  const renderRecord = (rec) => {
    resultEl.classList.remove("is-drawn");
    resultEl.innerHTML = `
      <aside class="mk-res__side">
        <p class="mk-res__kicker">My recipe · ${BR.esc(rec.type)}</p>
        <h2 class="mk-res__name">${BR.esc(rec.name)}</h2>
        <ul class="mk-res__ings">${rec.rows
          .map((x) => `<li><span class="mk-res__sym">${BR.esc(x.sym)}</span><span>${BR.esc(x.ko)}</span><span class="mk-res__amt">${x.amt}${unitText(x)}</span></li>`)
          .join("")}</ul>
        <p class="mk-res__meta">${rec.count > 1 ? `${rec.count}개 · 개당 ${rec.per}g` : `한 덩어리 · ${rec.per}g`}</p>
        <div class="mk-res__actions">
          <button type="button" class="mk-btn mk-res__again">다시 만들기</button>
          <a class="mk-btn" href="#/main">처음으로 ${BR.arrowSVG()}</a>
        </div>
      </aside>
      <div class="mk-res__formula">${rec.lines
        .map((l, i) => `<span class="mk-line${i === rec.lines.length - 1 ? " mk-line--end" : ""}" style="--i:${i}">${BR.esc(l)}</span>`)
        .join("")}</div>
      ${collectionHTML(rec.id)}`;

    const formulaEl = resultEl.querySelector(".mk-res__formula");
    fitFormula(formulaEl);
    BR.smoothScroll(formulaEl, "y");
    BR.smoothScroll(resultEl.querySelector(".mk-col__list"), "y");
    // 외곽선으로 먼저 나타난 뒤 → 한 줄씩 채워짐 (css/make.css)
    requestAnimationFrame(() => requestAnimationFrame(() => resultEl.classList.add("is-drawn")));
  };

  const showResult = () => {
    if (root.classList.contains("is-result")) return;
    const rec = buildRecord();
    latestId = rec.id;
    collection = saveRecord(rec);
    if (!collection.some((r) => r.id === rec.id)) collection = [...collection, rec];
    // 결과 화면이 처음 나타나는 동안만 표시 (목록에서 다른 빵을 눌러 다시 그릴 때는 들어오는 모션 없음)
    resultEl.classList.add("is-entering");
    setTimeout(() => resultEl.classList.remove("is-entering"), 1600);
    root.classList.add("is-result");
    renderRecord(rec);
    if (BR.makeRain) pile.rain(); // 2안: 떨어진 글자들이 위에서 이어서 떨어지며 결과 화면 시작
  };

  // 수식 글자 크기: 크게 시작해서 한 화면에 들어오도록 줄이되, 너무 작아지지 않게 (넘치면 스크롤)
  const FORMULA_MAX = 60;
  const FORMULA_MIN = 34;
  const fitFormula = (el) => {
    const px = pxUnit();
    let size = FORMULA_MAX;
    el.style.fontSize = `${size * px}px`;
    while (el.scrollHeight > el.clientHeight && size > FORMULA_MIN) {
      size -= 2;
      el.style.fontSize = `${size * px}px`;
    }
  };

  /* ---------- 이전에 만든 빵 보러 가기 (2안 버튼) ----------
     문항 도중에도 결과 화면을 열어 가장 최근 빵부터 보여 줌. '다시 만들기'로 처음 문항으로 */
  const syncHistory = () => {
    const btn = root.querySelector(".mk-history");
    if (!btn) return;
    const n = loadCollection().length;
    btn.hidden = n === 0;
    const count = btn.querySelector(".mk-history__count");
    if (count) count.textContent = pad2(n);
  };

  const showHistory = () => {
    collection = loadCollection();
    if (!collection.length || root.classList.contains("is-result")) return;
    S.done = true; // 문항 입력 막기
    clearTimeout(autoTimer);
    pile.clear(); // 쌓여 있던 글자는 비움 ('다시 만들기'로 돌아가면 처음부터)
    latestId = null;
    root.classList.add("is-dropping", "is-result");
    resultEl.classList.add("is-entering");
    setTimeout(() => resultEl.classList.remove("is-entering"), 1600);
    renderRecord(collection[collection.length - 1]);
  };

  const restart = () => {
    S = fresh();
    pile.clear();
    root.classList.remove("is-dropping", "is-result");
    resultEl.classList.remove("is-drawn");
    setTimeout(() => (resultEl.innerHTML = ""), 500);
    qBox.innerHTML = "";
    renderQuestion(1);
    syncHistory();
  };


  /* ---------------------------------------------------------
     페이지 등록
     --------------------------------------------------------- */
  const init = () => {
    root = document.querySelector(".make");
    panel = root.querySelector(".mk-panel");
    qBox = root.querySelector(".mk-questions");
    pileEl = root.querySelector(".mk-pile");
    resultEl = root.querySelector(".mk-result");
    S = fresh();

    panel.addEventListener("click", onClick);
    panel.addEventListener("input", onInput);
    window.addEventListener("keydown", onKey);
    resultEl.addEventListener("click", (e) => {
      if (e.target.closest(".mk-res__again")) return restart();
      // 레시피 모음에서 다른 빵을 누르면 그 빵의 수식을 다시 그림
      const item = e.target.closest(".mk-col__item");
      if (item && !item.classList.contains("is-current")) {
        const rec = collection.find((r) => r.id === item.dataset.id);
        if (rec) renderRecord(rec);
      }
    });
    // (2안) 문항 화면의 '이전에 만든 빵' 버튼 — 버튼이 있을 때만 (v2/index.html .mk-history)
    root.querySelector(".mk-history")?.addEventListener("click", showHistory);
    syncHistory();

    window.addEventListener("resize", () => BR.router.current() === "make" && pile.resize());

    renderQuestion(1);
  };

  const enter = (param, prev) => {
    // 다른 페이지에서 들어오면 항상 1번 문항부터 새로 시작 (쌓인 글자도 비움)
    if (prev) restart();
    pile.resize(); // 다른 페이지에 있는 동안 창 크기가 바뀌었으면 다시 쌓음
    pile.start();
  };

  const leave = () => {
    clearTimeout(autoTimer);
    pile.stop();
  };

  return { init, enter, leave };
})();
