/* =========================================================
   make-engine.js — 나만의 빵 만들기: 선택 → 빵정식 수식 생성
   원본: Documents/bbangjeongsik/js/maker.js (빵정식 체험 웹)
   ========================================================= */

/* 나만의 레시피 만들기 — 관람객의 선택 + 범위 안의 랜덤 값 → 빵정식 수식 · 재료 블록 · 요약줄 */
(function (root) {
  'use strict';

  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sub = (n) => String(n).replace(/\d/g, (d) => SUB[d]);
  const sup = (n) => String(n).replace(/\d/g, (d) => SUP[d]);

  // 반죽 단계 이름: 0 → (d), 1 → (d¹) …
  const dn = (k) => (k === 0 ? '(d)' : `(d${sup(k)})`);
  // 배율 표기: 2.70 → 2.7, 2.0 → 2
  const times = (x) => String(Math.round(x * 10) / 10);

  /**
   * 화면 번호 (명세서 §1)
   * 1 재료 · 2 혼합 · 3 1차 발효 · 4 성형 · 5 2차 발효 · 6 굽기 전 추가 · 7 굽기/튀기기 · 8 굽고 난 후 추가 · 9 이름
   */
  const SCREENS = ['ingredients', 'mix', 'ferment1', 'shape', 'ferment2', 'preAdd', 'cook', 'postAdd', 'name'];

  /** 빈 선택 상태 */
  function blank() {
    return {
      type: null, size: null, subs: [], powder: null,
      mix1: null, mix2: null,
      f1: null,
      breadSize: null, shape: null,
      f2: null,
      preFill: null, preTop: null,
      cook: null,
      postFill: null, postTop: null,
      name: '',
    };
  }

  /**
   * 선택 c와 랜덤 캐시 rolls로 수식을 만든다.
   * rolls는 { 키: 값 } — 같은 (공정, 선택지)는 한 번 정한 값을 계속 쓴다. 새 값이 필요하면 여기에 채운다.
   * upTo: 이 화면 번호까지의 선택만 반영한다 (만들기 중 실시간 수식용). 생략하면 끝까지.
   */
  function generate(c, rolls, D, upTo) {
    const until = upTo == null ? 99 : upTo;
    const pick = (key, range, step) => {
      if (!(key in rolls)) {
        const s = step || 1;
        const k = Math.floor((range[1] - range[0]) / s) + 1;
        rolls[key] = range[0] + s * Math.floor(Math.random() * k);
      }
      return rolls[key];
    };
    const find = (list, id) => list.find((x) => x.id === id);
    const unitOf = (sym) => (D.liquids.includes(sym) ? 'ml' : 'g');
    const term = (x) => (x.unit === 'p' ? `${x.sym}${sub(x.amt)}` : `${x.sym}${sub(x.amt)}·${x.unit}`);
    const gram = (x) => (x.unit === 'p' ? x.amt * (D.pieceWeight[x.sym] || 0) : x.amt);

    const out = { blocks: [], rows: [], done: false };
    const rows = out.rows;
    const row = (sym, amt, unit) => { const x = { sym, ko: D.names[sym], amt, unit: unit || unitOf(sym) }; rows.push(x); return x; };
    const block = (screen, label, lines) => { out.blocks.push({ screen, label, text: lines.join('\n') }); };

    if (!c.type || !c.size) return finish(out, D);
    const type = c.type;
    const isFried = type === 'fried';
    const F = find(D.sizes, c.size).flour;
    const base = D.base[type];
    const pct = (p) => Math.round(F * p / 100);

    // ── 재료 (3-3 ~ 3-5) ── 투입 순서: F → 첨가 가루 → 기본 재료 → (버터) → 부재료
    const first = [row('F', F)];
    if (c.powder) first.push(row(c.powder, pct(D.powders.pct)));
    base.first.forEach(([sym, p]) => {
      first.push(p === '1p' ? row(sym, 1, 'p') : row(sym, pct(p)));
    });
    const butter = base.butter ? row('B', pct(base.butter)) : null;

    // 부재료: 카테고리 총량을 고른 개수로 나눈다. 홀수면 먼저 고른 재료가 1g 더
    const subs = [];
    c.subs.forEach((sym) => {
      const cat = D.subCategories.find((k) => k.items.includes(sym));
      const mates = c.subs.filter((s) => cat.items.includes(s));
      const total = pct(cat.pct);
      const amt = mates.length === 1 ? total : mates.indexOf(sym) === 0 ? Math.ceil(total / 2) : Math.floor(total / 2);
      subs.push(row(sym, amt));
    });

    let weight = [...first, ...(butter ? [butter] : []), ...subs].reduce((n, x) => n + gram(x), 0);

    // ── 2 혼합 ──
    const needMix2 = type !== 'lean';
    if (until < 2 || !c.mix1 || (needMix2 && !c.mix2)) return finish(out, D);
    const lv1 = find(D.mixLevels, c.mix1);
    const mixLines = [];
    const results = [];
    mixLines.push([`→ Σ${sup(pick(`mix1.${lv1.id}.n`, lv1.n))} (${first.map(term).join(' + ')}) ${pick(`mix1.${lv1.id}.t`, lv1.t)}'`]);
    let last = lv1;
    if (needMix2) {
      const lv2 = find(D.mixLevels, c.mix2);
      mixLines.push([`→ Σ${sup(pick(`mix2.${lv2.id}.n`, lv2.n))} ((m¹) + ${term(butter)}) ${pick(`mix2.${lv2.id}.t`, lv2.t)}'`]);
      last = lv2;
    }
    if (subs.length) {
      const m = mixLines.length;
      mixLines.push([`→ Σ${sup(pick('subMix.n', D.subMix.n))} ((m${sup(m)}) + ${subs.map(term).join(' + ')}) ${D.subMix.t}'`]);
    }
    mixLines.forEach((l, i) => { results.push(i === mixLines.length - 1 ? '(d)' : `(m${sup(i + 1)})`); });
    const doughT = pick(`mixT.${last.id}`, D.doughTemp[last.id]);
    block(2, '혼합', mixLines.map((l, i) => `${l[0]} = ${results[i]}`).concat(`   {(d) = ${doughT}° / ${weight}·g}`));

    // ── 3 1차 발효 ──
    if (until < 3 || !c.f1) return finish(out, D);
    let k = 0;
    const f1 = find(D.ferment1, c.f1);
    const T1 = pick(`f1.${f1.id}.T`, f1.T);
    const t1 = pick(`f1.${f1.id}.t`, f1.t, 5);
    const x1 = pick(`f1.${f1.id}.x`, [Math.round(f1.x[0] * 10), Math.round(f1.x[1] * 10)]) / 10;
    const H1 = pick('f1.H', D.humidity);
    block(3, '1차 발효', [`→ ${dn(k)} × Y^(${T1}×${t1}') = Δ${dn(k + 1)}`, `   {Δ${dn(k + 1)} = ${T1}° / ${H1}% / ×${times(x1)}}`]);
    k += 1;

    // 결이 있는 빵: 접기 (자동, 3회 고정). 이후 반죽 무게에 접기용 버터 포함
    if (base.fold) {
      const fold = row('B', pct(base.fold));
      block(3, '접기', [`→ ${dn(k)} ∪ (${term(fold)}) × P${sup(D.folds)} = ${dn(k + 1)}`]);
      k += 1;
      weight += fold.amt;
    }

    // ── 4 성형: 분할 → 둥글리기 → 벤치타임 → (굽기 전 속) → 최종 모양 ──
    if (until < 4 || !c.breadSize) return finish(out, D);
    const bs = find(D.breadSizes, c.breadSize);
    let per = weight;
    if (bs.w) {
      const w = pick(`size.${bs.id}.w`, bs.w);
      const count = Math.max(1, Math.floor(weight / w));
      per = Math.round(weight / count);
      block(4, '분할', [`→ ${dn(k)} ÷ ${count}${sub(per)}·g = ${count}${dn(k + 1)}`, `   {${count}${dn(k + 1)} = ${per}·g}`]);
      k += 1;
      out.count = count;
    } else {
      out.count = 1;
    }
    out.per = per;
    const r = Math.round(Math.cbrt((3 * per) / (4 * Math.PI)) * 10);
    out.r = r;
    block(4, '둥글리기', [`→ 2π${r}mm ${dn(k)} = ${dn(k + 1)}`, `   {${dn(k + 1)} = ${per}·g / 2πr${r}mm}`]);
    k += 1;
    block(4, '벤치타임', [`→ ${dn(k)} × Y^(${D.bench.T}×${D.bench.t}') = Δ${dn(k + 1)}`]);
    k += 1;

    // 굽기 전 속에 넣기 — 6번 화면에서 고르지만 수식에서는 여기 (부푼 반죽에 넣으면 가스가 빠지므로)
    let preFillG = 0;   // 굽기 무게에 더할 g
    let preFillCap = 0; // 속 상한 계산용 g (소시지 제외)
    if (until >= 6 && c.preFill) {
      const isPiece = D.preFill.pieces.includes(c.preFill);
      const x = isPiece ? row(c.preFill, 1, 'p') : row(c.preFill, Math.round(per * D.preFill.pct / 100));
      preFillG = gram(x);
      preFillCap = isPiece ? 0 : x.amt;
      block(6, '굽기 전 · 속에 넣기', [`→ ${dn(k)} ⊂ (${term(x)}) = ${dn(k + 1)}`]);
      k += 1;
    }

    if (!c.shape) return finish(out, D);
    const sh = find(D.shapes, c.shape);
    let dx = r;
    if (sh.press) {
      const pF = pick(`shape.${sh.id}.F`, sh.press.F);
      const pA = pick(`shape.${sh.id}.A`, sh.press.A);
      block(4, '밀기', [`→ ${dn(k)} × P = ${dn(k + 1)}`, `   P = ${pF}N/${pA}mm`]);
      k += 1;
      dx = pA;
    }
    if (sh.roll) {
      const a = pick('shape.roll.a', sh.roll.a);
      const b = pick('shape.roll.b', sh.roll.b);
      const n = pick('shape.roll.n', sh.roll.n);
      block(4, '말기', [`→ ${dn(k)} × R = ${dn(k + 1)}`, `   R = ${a}mm + ${b}mm × ${n}θ`]);
      k += 1;
      dx = a + b * n;
    }

    // ── 5 2차 발효 ──
    if (until < 5 || !c.f2) return finish(out, D);
    const table = type === 'laminated' ? 'laminated' : 'default';
    const f2 = find(D.ferment2[table], c.f2);
    const T2 = pick(`f2.${table}.${f2.id}.T`, f2.T);
    const t2 = pick(`f2.${table}.${f2.id}.t`, f2.t, 5);
    const H2 = pick('f2.H', D.humidity);
    block(5, '2차 발효', [`→ ${dn(k)} × Y^(${T2}×${t2}') = Δ${dn(k + 1)}`, `   {Δ${dn(k + 1)} = ${T2}° / ${H2}% / ×${times(f2.x)}}`]);
    k += 1;

    // ── 6 굽기 전 위에 올리기 (튀기는 빵 제외) ──
    let preTopG = 0;
    if (until >= 6 && c.preTop && !isFried) {
      const x = row(c.preTop, Math.round(per * D.preTop.pct / 100));
      preTopG = x.amt;
      block(6, '굽기 전 · 위에 올리기', [`→ ${dn(k)} ∪ (${term(x)}) = ${dn(k + 1)}`]);
      k += 1;
    }

    // ── 7 굽기 / 튀기기 ──
    if (until < 7 || !c.cook) return finish(out, D);
    const before = per + preFillG + preTopG;
    const P = isFried ? 'f' : 'b';
    if (!isFried) {
      const lv = find(D.bake.levels, c.cook);
      const T0 = pick(`bake.${lv.id}.T`, lv.T);
      const t = Math.round(pick(`bakeBase.${bs.id}`, D.bake.base[bs.id]) * lv.mult);
      const loss = pick('bake.loss', D.bake.loss);
      const core = pick('bake.core', D.bake.core);
      const w = Math.round(before * (1 - loss / 100));
      block(7, '굽기', [`→ ${dn(k)} × q = (b)`, `   q = k(${T0}° - ${T2}° / ${dx}mm) ${t}'`, `   {(b) = ${core}° / ${w}·g}`]);
    } else {
      const lv = find(D.fry.levels, c.cook);
      const T0 = pick(`fry.${lv.id}.T`, lv.T);
      const s = Math.round(pick(`fryBase.${bs.id}`, D.fry.base[bs.id]) * lv.mult);
      const t = s >= D.fry.minuteFrom ? `${Math.round(s / 60)}'` : `${s}"`;
      const gain = pick('fry.gain', D.fry.gain);
      const core = pick('fry.core', D.fry.core);
      const w = Math.round(before * (1 + gain / 100));
      block(7, '튀기기', [`→ ${dn(k)} × q = (f)`, `   q = h × 4π(${r}mm)² × (${T0}° - ${T2}°) ${t}`, `   {(f) = ${core}° / ${w}·g}`]);
    }

    // ── 8 굽고 난 후 추가하기 → 마지막 줄은 항상 (P) ──
    if (until < 8) return finish(out, D);
    let cur = `(${P})`;
    const steps = [];
    if (c.postFill) {
      // 굽기 전 속 + 굽고 난 후 속 ≤ per × 60% (소시지 제외)
      const cap = Math.round(per * D.fillCap / 100) - preFillCap;
      const amt = Math.min(Math.round(per * D.postFill.pct / 100), cap);
      if (amt > 0) steps.push({ label: '굽고 난 후 · 속에 넣기', op: '⊂', x: row(c.postFill, amt) });
    }
    if (c.postTop) steps.push({ label: '굽고 난 후 · 위에 올리기', op: '∪', x: row(c.postTop, Math.round(per * D.postTop.pct / 100)) });
    if (!steps.length) {
      block(8, '완성', [`→ ${cur} = (P)`]);
    } else {
      steps.forEach((st, i) => {
        const next = i === steps.length - 1 ? '(P)' : `(${P}${sup(i + 1)})`;
        block(8, st.label, [`→ ${cur} ${st.op} (${term(st.x)}) = ${next}`]);
        cur = next;
      });
    }
    out.done = true;
    return finish(out, D);
  }

  // 한글은 고정폭 글꼴에서 두 칸을 차지한다
  const width = (s) => [...s].reduce((n, ch) => n + (/[ᄀ-ᇿ㄰-㆏가-힣]/.test(ch) ? 2 : 1), 0);
  const padTo = (s, w) => s + ' '.repeat(Math.max(1, w - width(s)));

  function finish(out, D) {
    out.formula = out.blocks.map((b) => b.text).join('\n\n');
    out.ingredientsBlock = out.rows.map((x) => `${padTo(x.sym, 5)}${padTo(x.ko, 12)}${x.amt}${x.unit === 'p' ? '개' : x.unit}`).join('\n');
    out.summaryLine = out.rows.map((x) => `${x.sym} · ${x.amt}${x.unit}`).join(' | ');
    // 같은 기호가 두 번 이상 나오는지 (정보글용)
    const seen = new Set();
    out.repeated = [...new Set(out.rows.filter((x) => (seen.has(x.sym) ? true : (seen.add(x.sym), false))).map((x) => x.sym))];
    return out;
  }

  const api = { generate, blank, SCREENS, sub, sup };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BbangMaker = api;
})(typeof window !== 'undefined' ? window : globalThis);
