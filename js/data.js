/* =========================================================
   data.js — 사이트 내용 데이터
   텍스트·이미지를 바꾸려면 이 파일만 수정하면 됩니다.
   ========================================================= */

window.BR = window.BR || {};

/* ---------------------------------------------------------
   재료 (원소 주기율표)
   symbol: 기호 / kr: 한글 / en: 영문 / img: hover 배경 사진(없으면 null)
   --------------------------------------------------------- */
BR.ingredients = [
  { symbol: "W", kr: "물", en: "Water", img: null },
  { symbol: "S", kr: "소금", en: "Salt", img: "assets/img/ingredient/salt.webp" },
  { symbol: "Y", kr: "이스트", en: "Yeast", img: "assets/img/ingredient/yeast.webp" },
  { symbol: "F", kr: "밀가루", en: "Flour", img: null },
  { symbol: "Ww", kr: "통밀가루", en: "Whole wheat flour", img: null },
  { symbol: "St", kr: "전분", en: "Starch", img: null },
  { symbol: "Br", kr: "빵가루", en: "Breadcrumb", img: null },
  { symbol: "M", kr: "우유", en: "Milk", img: null },
  { symbol: "B", kr: "버터", en: "Butter", img: null },
  { symbol: "Ol", kr: "올리브유", en: "Olive oil", img: null },
  { symbol: "Oi", kr: "식용유", en: "Oil", img: null },
  { symbol: "C", kr: "생크림", en: "Cream", img: null },
  { symbol: "Pm", kr: "분유", en: "Powdered milk", img: null },
  { symbol: "Cc", kr: "크림치즈", en: "Cream cheese", img: null },
  { symbol: "Mz", kr: "모짜렐라", en: "Mozzarella", img: null },
  { symbol: "Cd", kr: "체다", en: "Cheddar", img: null },
  { symbol: "Sg", kr: "설탕", en: "Sugar", img: null },
  { symbol: "An", kr: "앙금", en: "Anko", img: null },
  { symbol: "Dc", kr: "다크초콜릿", en: "Dark chocolate", img: null },
  { symbol: "Hn", kr: "꿀", en: "Honey", img: null },
  { symbol: "E", kr: "달걀", en: "Egg", img: null },
  { symbol: "Hm", kr: "햄", en: "Ham", img: null },
  { symbol: "Bc", kr: "베이컨", en: "Bacon", img: null },
  { symbol: "Sa", kr: "소시지", en: "Sausage", img: null },
  { symbol: "On", kr: "양파", en: "Onion", img: null },
  { symbol: "Ga", kr: "마늘", en: "Garlic", img: null },
  { symbol: "To", kr: "토마토", en: "Tomato", img: null },
  { symbol: "Po", kr: "감자", en: "Potato", img: null },
  { symbol: "Co", kr: "옥수수", en: "Corn", img: null },
  { symbol: "Ps", kr: "파슬리", en: "Parsley", img: null },
  { symbol: "Be", kr: "베리", en: "Berry", img: null },
  { symbol: "Ap", kr: "사과", en: "Apple", img: null },
  { symbol: "Or", kr: "오렌지", en: "Orange", img: null },
  { symbol: "Wn", kr: "호두", en: "Walnut", img: null },
  { symbol: "Sd", kr: "씨", en: "Seed", img: null },
  { symbol: "My", kr: "마요네즈", en: "Mayonnaise", img: null },
  { symbol: "Mu", kr: "머스타드", en: "Mustard", img: null },
  { symbol: "Ci", kr: "계피", en: "Cinnamon", img: null },
  { symbol: "Bs", kr: "베이킹소다", en: "Baking soda", img: null }
];

/* ---------------------------------------------------------
   빵 레시피 — 노션 "빵정식 레시피"(🗂 프로젝트 / 그래픽스)에서 가져옴 (2026-10-10)
   id: 주소에 쓰이는 이름 (#/recipe/croissant)
   formula: 수식 (노션 코드블록 그대로 — 줄바꿈·들여쓰기 유지, 빈 줄 = 단계 구분)
   ingredients: 재료 요약 / weight·kcal: 개당 중량·칼로리
   --------------------------------------------------------- */
const lines = (s) => s.replace(/^\n+|\s+$/g, "").split("\n");

BR.breads = [
  {
    id: "croissant", kr: "크루아상", en: "Croissant", img: "assets/img/photo/croissant-01.webp",
    weight: "120g±5g", kcal: "520kcal",
    ingredients: "F · 500g | W · 130ml | M · 130ml | Sg · 55g | S · 10g | B · 40g | Y · 10g | B · 250g | E · 1p",
    formula: lines(`
→ Σ¹ (F₅₀₀·g + W₁₃₀·ml + M₁₃₀·ml + Sg₅₅·g + S₁₀·g + Y₁₀·g) 4' = (m¹)
→ Σ³ ((m¹) + B₄₀·g) 2' = (d)
   {(d) = 24° / 855·g}

→ (d) × Y^(5×60') = Δ(d¹)
   {Δ(d¹) = 5°}

→ (d¹) ∪ (B₂₅₀·g) = (d²)

→ (d²) × P³ = (d³)
   P = 2N/6mm

→ (d³) × Y^(5×30') = Δ(d⁴)

→ (d⁴) × R = (d⁵)
   R = 100mm + 0mm × 1θ

→ (d⁵) × Y^(28×90') = Δ(d⁶)
   {Δ(d⁶) = 28° / 80%}

→ (d⁶) ∪ (E₁·개) = (d⁶)

→ (d⁶) × q = (b)
   q = k(200° - 28° / 25mm) 15'
   {(b) = 95° / 90·g}

= (크루아상)`)
  },
  {
    // 사진: 빵 껍질 클로즈업 → 노션 레시피 중 바게트로 매칭
    id: "baguette", kr: "바게트", en: "Baguette", img: "assets/img/photo/crust-01.webp",
    weight: "230g±10g", kcal: "585kcal",
    ingredients: "F · 500g | W · 350ml | Y · 5g | S · 10g",
    formula: lines(`
→ Σ¹ (F₅₀₀·g + W₃₅₀·ml + Y₅·g + S₁₀·g) 5' = (d)
   {(d) = 24° / 865·g}

→ (d) × Y^(20×720') = Δ(d¹)
   {Δ(d¹) = 20° / 75% / ×2}

→ (d¹) ÷ 3₂₈₀·g = 3(d²)
   {3(d²) = 280·g}

→ (d²) × Y^(20×20') = Δ(d³)

→ (d³) × R = (d⁴)
   R = 200mm + 50mm × 3θ

→ (d⁴) × Y^(27×40') = Δ(d⁵)
   {Δ(d⁵) = 27° / 78% / ×1.8}

→ (d⁵) × q = (b)
   q = k(230° - 20° / 60mm) 25'
   {(b) = 95° / 245·g}

= (바게트)`)
  },
  {
    id: "pain-au-chocolat", kr: "팽오쇼콜라", en: "Pain au Chocolat", img: "assets/img/photo/pain-au-chocolat-02.webp",
    weight: "149g±6g", kcal: "680kcal",
    ingredients: "F · 500g | W · 130ml | M · 130ml | Sg · 55g | S · 10g | B · 40g | Y · 10g | B · 250g | Dc · 8p(15g/p) | E · 1p",
    formula: lines(`
→ Σ¹ (F₅₀₀·g + W₁₃₀·ml + M₁₃₀·ml + Sg₅₅·g + S₁₀·g + Y₁₀·g) 4' = (m¹)
→ Σ³ ((m¹) + B₄₀·g) 2' = (d)
   {(d) = 24° / 855·g}

→ (d) × Y^(5×60') = Δ(d¹)
   {Δ(d¹) = 5°}

→ (d¹) ∪ (B₂₅₀·g) = (d²)

→ (d²) × P³ = (d³)
   P = 2N/6mm

→ (d³) × Y^(5×30') = Δ(d⁴)

→ (d⁴) ÷ 8₁₀₀·g = 8(d⁵)

→ (d⁵) ⊂ (Dc₁₅·g) = (d⁶)

→ (d⁶) × Y^(28×90') = Δ(d⁷)
   {Δ(d⁷) = 28° / 80%}

→ (d⁷) ∪ (E₁·개) = (d⁷)

→ (d⁷) × q = (b)
   q = k(200° - 28° / 25mm) 15'
   {(b) = 95° / 100·g}

= (팽오쇼콜라)`)
  },
  {
    id: "scone", kr: "스콘", en: "Scone", img: "assets/img/photo/scone-02.webp",
    weight: "70g±3g", kcal: "255kcal",
    ingredients: "F · 300g | B · 90g | Sg · 50g | Bs · 12g | S · 3g | M · 120ml | E · 1p",
    formula: lines(`
→ Σ² (F₃₀₀·g + B₉₀·g) 1' = (m¹)
→ Σ¹ ((m¹) + Sg₅₀·g + Bs₁₂·g + S₃·g) 1' = (m²)
→ Σ¹ ((m²) + M₁₂₀·ml + E₁) 1' = (d)
   {(d) = 18° / 575·g}

→ (d) × Y^(4×20') = Δ(d¹)

→ (d¹) × P = (d²)
   P = 3N/20mm

→ (d²) ÷ 8₆₀·g = 8(d³)

→ (d³) × q = (b)
   q = k(200° - 4° / 20mm) 15'
   {(b) = 92° / 55·g}

= (스콘)`)
  },
  {
    id: "pretzel", kr: "프레첼", en: "Pretzel", img: "assets/img/photo/pretzel-02.webp",
    weight: "96g±4g", kcal: "265kcal",
    ingredients: "F · 500g | W · 280ml | B · 40g | Sg · 20g | S · 10g | Y · 7g | Bs · 50g",
    formula: lines(`
→ Σ¹ (F₅₀₀·g + W₂₈₀·ml + Sg₂₀·g + S₁₀·g + Y₇·g) 4' = (m¹)
→ Σ⁵ ((m¹) + B₄₀·g) 4' = (d)
   {(d) = 26° / 857·g}

→ (d) × Y^(27×45') = Δ(d¹)
   {Δ(d¹) = 27° / 75% / ×1.8}

→ (d¹) ÷ 8₁₀₀·g = 8(d²)
   {8(d²) = 100·g}

→ (d²) × R = (d³)
   R = 300mm + 0mm × 1θ

→ (d³) ∪ (Bs₅₀·g) 20"

→ (d³) ∪ (S₃·g) = (d⁴)

→ (d⁴) × q = (b)
   q = k(220° - 27° / 25mm) 15'
   {(b) = 95° / 95·g}

= (프레첼)`)
  },
  {
    id: "corn-bread", kr: "옥수수빵", en: "Corn Mayo Bread", img: "assets/img/photo/corn-bread-01.webp",
    weight: "82g±3g", kcal: "228kcal",
    ingredients: "F · 300g | M · 170ml | Sg · 30g | S · 5g | B · 20g | Y · 5g | Co · 150g | My · 40g",
    formula: lines(`
→ Σ¹ (F₃₀₀·g + M₁₇₀·ml + Sg₃₀·g + S₅·g + Y₅·g) 3' = (m¹)
→ Σ³ ((m¹) + B₂₀·g) 3' = (d)
   {(d) = 26° / 525·g}

→ (d) × Y^(27×60') = Δ(d¹)
   {Δ(d¹) = 27° / 80% / ×2.3}

→ (d¹) ÷ 8₆₀·g = 8(d²)
   {8(d²) = 60·g}

→ (d²) × Y^(20×15') = Δ(d³)

→ Σ¹ (Co₁₅₀·g + My₄₀·g) 2' = (m²)

→ (d³) ⊂ (m²) = (d⁴)

→ (d⁴) × Y^(32×30') = Δ(d⁵)
   {Δ(d⁵) = 32° / 80% / ×1.8}

→ (d⁵) × q = (b)
   q = k(190° - 32° / 15mm) 15'
   {(b) = 92° / 63·g}

= (옥수수빵)`)
  },
  {
    id: "salt-bread", kr: "소금빵", en: "Salt Bread", img: "assets/img/photo/roll-01.webp",
    weight: "61g±3g", kcal: "186kcal",
    ingredients: "F · 300g | W · 165ml | Sg · 20g | S · 5g | Y · 5g | B · 50g | M · trace | S · trace",
    formula: lines(`
→ Σ¹ (F₃₀₀·g + W₁₆₅·ml + Sg₂₀·g + S₅·g + Y₅·g) 3' = (d)
   {(d) = 26° / 495·g}

→ (d) × Y^(27×60') = Δ(d¹)
   {Δ(d¹) = 27° / 78% / ×2.2}

→ (d¹) ÷ 8₆₀·g = 8(d²)
   {8(d²) = 60·g}

→ (d²) × Y^(20×15') = Δ(d³)

→ (d³) ∪ (B₆·g) = (d⁴)

→ (d⁴) × R = (d⁵)
   R = 100mm + 20mm × 2θ

→ (d⁵) × Y^(32×30') = Δ(d⁶)
   {Δ(d⁶) = 32° / 80% / ×1.8}

→ (d⁶) ∪ (M·ml) ∪ (S₁·g) = (d⁶)

→ (d⁶) × q = (b)
   q = k(200° - 32° / 15mm) 15'
   {(b) = 93° / 63·g}

= (소금빵)`)
  },
  {
    id: "simit", kr: "시미트", en: "Simit", img: "assets/img/photo/simit-01.webp",
    weight: "121g±5g", kcal: "371kcal",
    ingredients: "F · 500g | W · 280ml | Y · 7g | S · 10g | Sg · 15g | Hn · 100g | Sd · 150g",
    formula: lines(`
→ Σ¹ (F₅₀₀·g + W₂₈₀·ml + Y₇·g + S₁₀·g + Sg₁₅·g) 5' = (d)
   {(d) = 25° / 812·g}

→ (d) × Y^(27×50') = Δ(d¹)
   {Δ(d¹) = 27° / 78% / ×2}

→ (d¹) ÷ 8₁₀₀·g = 8(d²)
   {8(d²) = 100·g}

→ (d²) × Y^(20×15') = Δ(d³)

→ (d³) × R = (d⁴)
   R = 300mm + 0mm × 1θ

→ (d⁴) ∪ (Hn₁₀₀·g) = (d⁴)

→ (d⁴) ∪ (Sd₁₅₀·g) = (d⁵)

→ (d⁵) × q = (b)
   q = k(220° - 27° / 20mm) 15'
   {(b) = 94° / 95·g}

= (시미트)`)
  },
  {
    id: "english-muffin", kr: "잉글리시 머핀", en: "English Muffin", img: "assets/img/photo/stacked-bread-02.webp",
    weight: "82g±3g", kcal: "229kcal",
    ingredients: "F · 400g | M · 250ml | B · 20g | Sg · 15g | S · 6g | Y · 6g | Co · trace",
    formula: lines(`
→ Σ¹ (F₄₀₀·g + M₂₅₀·ml + Sg₁₅·g + S₆·g + Y₆·g) 3' = (m¹)
→ Σ³ ((m¹) + B₂₀·g) 3' = (d)
   {(d) = 26° / 691·g}

→ (d) × Y^(27×50') = Δ(d¹)
   {Δ(d¹) = 27° / 78% / ×2}

→ (d¹) ÷ 8₈₀·g = 8(d²)
   {8(d²) = 80·g}

→ 2π40mm(d²) = (d³)
   {(d³) = 80·g / 2πr40mm}

→ (d³) ∪ (Co·g) = (d³)

→ (d³) × Y^(27×30') = Δ(d⁴)
   {Δ(d⁴) = 27° / 75% / ×1.5}

→ (d⁴) × q = (b)
   q = k(160° - 27° / 20mm) 16'

= (잉글리시 머핀)`)
  },
  {
    // 사진: 어두운 소라 모양 빵 → 노션 레시피 중 초코소라빵으로 매칭
    id: "chocolate-cornet", kr: "초코소라빵", en: "Chocolate Cornet", img: "assets/img/photo/dark-croissant-01.webp",
    weight: "99g±4g", kcal: "328kcal",
    ingredients: "F · 300g | M · 150ml | Sg · 40g | S · 4g | B · 30g | E · 1p | Y · 5g | C · 200g | Sg · 20g | Dc · 50g",
    formula: lines(`
→ Σ¹ (F₃₀₀·g + M₁₅₀·ml + Sg₄₀·g + S₄·g + E₁ + Y₅·g) 4' = (m¹)
→ Σ³ ((m¹) + B₃₀·g) 3' = (d)
   {(d) = 27° / 555·g}

→ (d) × Y^(27×60') = Δ(d¹)
   {Δ(d¹) = 27° / 80% / ×2.3}

→ (d¹) ÷ 8₄₀·g = 8(d²)
   {8(d²) = 40·g ± 2g}

→ (d²) × Y^(20×15') = Δ(d³)

→ (d³) × R = (d⁴)
   R = 5mm + 3mm × 4θ

→ (d⁴) × Y^(35×40') = Δ(d⁵)
   {Δ(d⁵) = 35° / 85% / ×1.8}

→ (d⁵) × q = (b)
   q = k(190° - 35° / 12mm) 13'
   {(b) = 90° / 85·g ± 4g}

→ Σ³ (C₂₀₀·g + Sg₂₀·g + Dc₅₀·g) 3' = (m²)

→ (b) ⊂ (m²) = (p)

= (초코소라빵)`)
  }
];

/* ---------------------------------------------------------
   메인 화면 메뉴
   --------------------------------------------------------- */
/* hover: 마우스를 올리면 BR.mainSlides 의 몇 번째 사진을 보여줄지 (0 = 첫 번째)
   피그마 main(프레첼) / main 2(버터 크루아상, Bread recipe 에 화살표) 시안 기준 */
BR.mainMenu = [
  { label: "Manual book", href: "#/manual-book", hover: 0 }, // 프레첼
  { label: "Bread recipe", href: "#/recipe", hover: 1 }, // 버터 크루아상
  { label: "Make my recipe", href: "#/make", hover: 0 } // 프레첼 (상단 메뉴바와 같은 이름)
];

/* ---------------------------------------------------------
   메인 화면 슬라이드 (피그마: main 시안 8장, node 2241-773)
   사진이 순서대로 바뀝니다.
   x, y, w, h = 피그마 1440×920 프레임 기준 이미지 박스 위치·크기(px) — 피그마 수치 그대로
     · 화면 오른쪽 끝 기준으로 배치되며, 프레임 밖으로 넘치는 부분은 화면 밖으로 자연스럽게 나감
   crop = 박스 안에서 이미지 위치·크기(%) — 피그마 'Crop' 설정. 없으면 박스를 꽉 채움(cover)
   이미지는 피그마 원본(배경 투명 누끼, 잘리지 않은 전체)
   --------------------------------------------------------- */
BR.mainSlides = [
  { img: "assets/img/main/pretzel.webp", x: 583, y: -131, w: 998, h: 1188 }, // Desktop - 3
  { img: "assets/img/main/croissant-butter.webp", x: 576, y: -166, w: 1269, h: 1168, crop: [-0.02, 0, 100.04, 100] }, // Desktop - 4
  { img: "assets/img/main/corn.webp", x: 558, y: -186, w: 981, h: 1168, crop: [5.94, -7.97, 100.11, 111.63] }, // Desktop - 5
  { img: "assets/img/main/croissant.webp", x: 637, y: 38, w: 743, h: 929, crop: [0, -0.03, 100, 104.79] }, // Desktop - 6
  { img: "assets/img/main/fork-bun.webp", x: 523, y: -348, w: 992, h: 1299, crop: [0, -0.02, 100, 100.05] }, // Desktop - 7
  { img: "assets/img/main/round-bun.webp", x: 576, y: 137, w: 883, h: 752 } // Desktop - 8
  // 사용 안 함 (요청으로 제외) — 다시 쓰려면 위 목록에 옮겨 넣기
  // { img: "assets/img/main/dark-loaf.webp", x: 482, y: 246, w: 1003, h: 953 }, // Desktop - 9
  // { img: "assets/img/main/crusty-loaf.webp", x: 576, y: 307, w: 849, h: 847, crop: [0, 2.36, 100, 100.1] } // Desktop - 10
];

BR.mainSlideInterval = 3500; // 사진 바뀌는 간격(ms)

/* ---------------------------------------------------------
   메뉴얼 (아코디언)
   sections: { title, text, table?: { cols, rows } }
   ※ 02~07 내용은 피그마에서 아직 가져오지 못해 비워둔 상태입니다.
   --------------------------------------------------------- */
BR.manual = [
  {
    num: "01",
    title: "공용",
    sections: [
      {
        title: "1. 공정 시작",
        text: "모든 공정의 시작은 → 로 표기.\n예시: → Σ¹ (F⁺₈₀₀·g + W₄₂₄·ml) 3' = (m¹)"
      },
      {
        title: "2. 결과물 표기",
        text:
          '결과물은 ( ) 괄호로 감싸서 표기.\n( ) 는 "묶음"의 개념으로 일관되게 사용. 재료 묶음과 공정 결과물 모두 같은 원리. 같은 결과물이 여러 단계를 거치면 위첨자로 구분.\n예시: (m¹) → (m²) → (d)',
        table: {
          cols: ["표기", "의미", "이니셜 출처"],
          rows: [
            ["(m)", "혼합 중간 단계 반죽", "mix"],
            ["(d)", "완성된 반죽 (재료 추가 없음)", "dough"],
            ["(b)", "구워진 빵", "bake"],
            ["(f)", "튀겨진 빵", "fry"],
            ["(p)", "최종 완성품", "product"]
          ]
        }
      },
      {
        title: "3. 시간",
        text: "분은 ' , 초는 \" 로 표기.\n예시: 25' = 25분 / 90\" = 90초 / 1'20\" = 1분 20초",
        table: {
          cols: ["표기", "의미"],
          rows: [
            ["'", "분 (minute)"],
            ['"', "초 (second)"]
          ]
        }
      },
      {
        title: "4. 재료 표기",
        text: "재료 기호 + 아래첨자(양) + · + 단위 순서로 표기.\n액체는 ml, 고체는 g 사용. 나눌 수 없는 재료는 단위 없이 개수만 표기.",
        table: {
          cols: ["표기", "의미"],
          rows: [
            ["F₃₀₀·g", "밀가루 300g"],
            ["W₁₈₀·ml", "물 180ml"],
            ["Y₄·g", "이스트 4g"],
            ["B₅₀·g", "버터 50g"],
            ["E₂·개", "달걀 2개"]
          ]
        }
      },
      {
        title: "5. 첨자",
        text: "아래첨자는 양(질량·개수), 위첨자는 단계·세기를 표기.",
        table: {
          cols: ["표기", "의미"],
          rows: [
            ["F₃₀₀·g", "밀가루 300g"],
            ["W₁₈₀·ml", "물 180ml"],
            ["E₂·개", "달걀 2개"]
          ]
        }
      },
      {
        title: "6. 상태 표기",
        text: "결과물의 조건(온도, 무게 등)은 { } 로 표기. 수식과 분리해 다음 줄에 표기.\n예시: → Σ⁷ ((m¹) + B₉₆·g) 7' = (d)\n　　　  {(d) = 27° / 45g}"
      },
      {
        title: "7. 재료 투입 순서",
        text: "수식 안 재료의 나열 순서는 실제 투입 순서와 동일하게 표기.\n교환법칙이 성립하더라도 순서가 공정 정보를 담으므로 바꾸지 않음.\n예시: → Σ¹ (F₈₀₀·g + Sg₁₂₈·g + Y₃₂·g + E₈₀·g + W₄₂₄·ml) 3' = (m¹)"
      }
    ]
  },
  {
    num: "02",
    title: "혼합",
    sections: [
      {
        title: "1. 수식",
        text: "→ Σⁿ (재료₁ + 재료₂ + ···) 시간' = (결과물)\n재료를 차례로 넣어 하나로 합치는 공정을 Σ 로 표기."
      },
      {
        title: "2. 혼합 세기",
        text: "Σ 위첨자로 혼합 세기를 표기.\nΣ¹ = 가장 약한 세기, Σ¹⁰ = 가장 강한 세기.\n숫자는 정확한 속도가 아닌 레시피 안의 상대적 세기\n(저속·중속·고속)를 표기."
      },
      {
        title: "3. 혼합 단계",
        text:
          "재료를 나눠 넣으면 혼합을 여러 줄로 나누고, 앞 단계 결과물을\n다음 수식의 첫 항으로 사용.\n재료 추가가 끝난 반죽은 (d)로 표기.\n예시:\n→ Σ¹ (F₃₀₀·g + W₁₈₀·ml + Y₄·g + S₆·g) 3' = (m¹)\n→ Σ⁵ ((m¹) + B₅₀·g) 7' = (d)"
      },
      {
        title: "4. 반죽 외 혼합",
        text:
          "크림·충전물 등 반죽이 아닌 혼합물도 같은 수식으로 표기.\n휘핑크림은 별도 기호 없이 생크림(C)에 높은 세기의 Σ를 가한 결과로 표기.\n예시:\n→ Σ⁸ (C₂₀₀·g + Sg₂₀·g) 4' = (c)"
      }
    ]
  },
  {
    num: "03",
    title: "발효",
    sections: [
      {
        title: "1. 수식",
        text: "→ (반죽) × Y^(온도×시간') = Δ(결과물)\n반죽에 이스트(Y)를 밑으로, 온도와 시간을 지수로 표기.\n발효를 거쳐 부풀어 오른 반죽은 Δ 를 붙여 표기."
      },
      {
        title: "2. 온도와 시간",
        text: "지수 안에 온도(°C)와 시간을 × 로 묶어 표기.\n온도는 숫자만, 시간은 ' (분) 로 표기.\n예시: Y^(27×60') = 27°C에서 60분 발효"
      },
      {
        title: "3. Δ (변화)",
        text: "Δ 는 발효로 상태가 변한 반죽을 표기.\n재료가 더해지지 않아도 부피와 성질이 바뀌었음을 구분하기 위해 사용."
      },
      {
        title: "4. 반죽 단계 번호",
        text:
          "반죽의 위첨자는 반죽이 거쳐 온 공정 순번을 표기.\n발효뿐 아니라 분할·둥글리기·성형 등을 거칠 때마다 숫자가 하나씩 증가.\n\n(d) × Y^(27×60') = Δ(d¹) 1차 발효 (27°C, 60분)\n(d²) × Y^(20×20') = Δ(d³) 벤치타임 (20°C, 20분)\n(d⁴) × Y^(37×50') = Δ(d⁵) 2차 발효 (37°C, 50분)"
      },
      {
        title: "5. 발효 조건",
        text: "습도 등 수식에 넣지 않는 조건은 { } 로 표기.\n예시:\n→ (d⁴) × Y^(37×50') = Δ(d⁵)\n　　　{Δ(d⁵) = 85%}"
      }
    ]
  },
  {
    num: "04",
    title: "성형",
    sections: [
      {
        title: "1. 수식",
        text: "",
        table: {
          rows: [
            ["분할", "a ÷ b", "d ÷ n(무게)·g = n(d⁺¹)"],
            ["둥글리기", "C = 2πr", "2πr mm(d) = d¹"],
            ["밀기", "P = F/A", "d × P = d¹ / P = FN/Amm"],
            ["말기", "r = a + bθ", "d × R = d¹ / R = amm + bmm × nθ"]
          ]
        }
      },
      {
        title: "2. 분할 — ÷",
        text:
          "반죽을 같은 무게로 나누는 공정을 ÷ 로 표기.\n÷ 뒤에 개수를 쓰고, 아래첨자로 개당 무게를 표기.\n결과물 앞에 개수를 붙여 나뉜 반죽임을 표기.\n예시: → (d¹) ÷ 34₄₅·g = 34(d²) — 45g씩 34개로 분할"
      },
      {
        title: "3. 둥글리기 — 2πr",
        text:
          "반죽을 공 모양으로 만드는 공정을 원의 둘레 2πr 로 표기.\nr 자리에 만들어질 반죽의 반지름(mm)을 표기.\n예시: → 2π50mm(d²) = (d³) — 반지름 50mm로 둥글리기\n둥글리기의 r 값은 튀기기 공정의 표면적 계산에 그대로 사용."
      },
      {
        title: "4. 밀기 — P",
        text:
          "반죽을 눌러 펴는 공정을 P 로 표기.\nP = 세기N / 목표 두께mm.\n세기는 1~10 단계로, 숫자가 클수록 강하게 밀기.\n예시: → (d³) × P = (d⁴), P = 5N/3mm — 세기 5로 두께 3mm까지 밀기"
      },
      {
        title: "5. 말기 — R",
        text:
          "반죽을 감아 마는 공정을 R 로 표기.\nR = 초기 두께mm + 한 바퀴당 늘어나는 두께mm × 바퀴 수θ.\nθ 는 회전 단위로, 1θ = 1바퀴.\n예시: → (d⁴) × R = (d⁵), R = 5mm + 3mm × 3θ — 5mm에서 시작해 3바퀴 말기"
      }
    ]
  },
  {
    num: "05",
    title: "굽기",
    sections: [
      {
        title: "1. 수식",
        text: "→ (반죽) × q = (b), q = k(ΔT / dx) 시간'\n반죽에 굽기 조건 q 를 곱해 구워진 빵 (b) 를 표기.\nq 는 온도 차이, 반죽 두께, 시간으로 구성."
      },
      {
        title: "2. k",
        text: "k 는 오븐 조건을 나타내는 표기용 상수.\n값을 대입하지 않고 모든 레시피에 같은 기호로 표기."
      },
      {
        title: "3. ΔT — 온도 차이",
        text: "ΔT = 오븐 온도° − 직전 공정의 반죽 온도°.\n직전 공정은 대개 2차 발효이며, 그 발효 온도를 그대로 사용.\n예시: 37°C 2차 발효 후 190°C 오븐 → ΔT = 190° − 37°"
      },
      {
        title: "4. dx — 반죽 두께",
        text: "dx 는 열이 이동하는 거리로, 반죽 두께(mm)를 표기."
      },
      {
        title: "5. 시간",
        text: "굽는 시간은 q 뒤에 ' (분) 로 표기."
      },
      {
        title: "6. 예시",
        text: "→ Δ(d⁵) × q = (b), q = k((190° − 37°) / 30mm) 35'\n37°C 2차 발효 반죽을 190°C에서 35분, 두께 30mm 기준으로 굽기."
      }
    ]
  },
  {
    num: "06",
    title: "튀기기",
    sections: [
      {
        title: "1. 수식",
        text: "→ (반죽) × q = (f), q = h × 4πr² × ΔT 시간'\n반죽에 튀기기 조건 q 를 곱해 튀겨진 빵 (f) 를 표기.\nq 는 기름 조건, 표면적, 온도 차이, 시간으로 구성."
      },
      {
        title: "2. h",
        text: "h 는 기름 조건을 나타내는 표기용 상수.\n굽기의 k 와 같이 값을 대입하지 않고 모든 레시피에 같은 기호로 표기."
      },
      {
        title: "3. 표면적 — 4πr²",
        text: "기름에 닿는 반죽의 표면적을 구의 표면적 4πr² 로 표기.\nr 은 둥글리기에서 정한 반지름(mm)을 그대로 사용.\n예시: → 2π30mm(d²) = (d³) 이면 튀기기에서 4π(30mm)²"
      },
      {
        title: "4. 온도 차이 — ΔT",
        text: "ΔT = 기름 온도° − 직전 공정의 반죽 온도°."
      },
      {
        title: "5. 시간",
        text: "튀기는 시간은 q 뒤에 ' (분), \" (초) 로 표기."
      },
      {
        title: "6. 예시",
        text: "→ Δ(d⁵) × q = (f), q = h × 4π(30mm)² × (175° − 35°) 1'30\"\n35°C 2차 발효 반죽을 175°C 기름에서 1분 30초 튀기기."
      }
    ]
  },
  {
    num: "07",
    title: "추가",
    sections: [
      {
        title: "1. 수식",
        text: "→ (반죽 또는 빵) + ∪(재료) = (결과물)\n→ (반죽 또는 빵) + ⊂(재료) = (결과물)\n∪ ⊂ 뒤에 오는 재료는 ( ) 로 감싸서 표기."
      },
      {
        title: "2. 위에 올리기 · 바르기 — ∪",
        text: "예시: → (b) + ∪(C₃₀·g) = (p) — 구워진 빵 위에 생크림 30g 바르기\n예시: → Δ(d⁵) + ∪(E₁) = (d⁶) — 굽기 전 반죽에 달걀 1개 에그워시"
      },
      {
        title: "3. 안에 넣기 — ⊂",
        text: "예시: → (d²) + ⊂(An₅₀·g) = (d³) — 반죽 안에 팥앙금 50g 넣기"
      },
      {
        title: "4. 혼합물 추가",
        text:
          "여러 재료를 섞어 넣을 때는 Σ 로 먼저 혼합한 뒤, 그 결과물을 ∪ ⊂ 로 추가.\n예시:\n→ Σ¹ (Po₂₀₀·g + My₃₀·ml) 2' = (m¹)\n→ (d²) + ⊂(m¹) = (d³) — 감자 혼합물을 반죽 안에 넣기"
      }
    ]
  }
];
