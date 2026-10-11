/* =========================================================
   back.js — 2안 오른쪽 위 '뒤로가기' 버튼 (메인에서는 숨김 — v2/css/nav.css)
   - 이 사이트 안에서 이동해 온 페이지가 있으면 → 브라우저 뒤로가기와 같음
   - 주소로 바로 들어와 이전 페이지가 없으면 → 한 단계 위 페이지로
     (재료·메뉴얼 → 메뉴얼북, 메뉴얼북·레시피·나만의 빵 → 메인)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const back = document.querySelector(".back");
  if (!back) return;

  // 한 단계 위 페이지
  const PARENT = {
    ingredients: "manual-book",
    manual: "manual-book",
    "manual-book": "main",
    recipe: "main",
    detail: "recipe",
    make: "main"
  };

  // 사이트 안에서 지나온 주소 (브라우저 뒤로가기로 돌아가면 하나씩 빠짐)
  const trail = [location.hash || "#/main"];
  window.addEventListener("hashchange", () => {
    const now = location.hash || "#/main";
    if (trail.length > 1 && trail[trail.length - 2] === now) trail.pop();
    else trail.push(now);
  });

  // 지금 페이지 기준으로 갈 곳을 링크에도 적어 둠 (새 탭 열기 등 대비)
  const sync = () => {
    const page = BR.router.current() || "main";
    back.href = `#/${PARENT[page] || "main"}`;
  };
  window.addEventListener("hashchange", () => setTimeout(sync, 0));
  setTimeout(sync, 0);

  back.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (trail.length > 1) {
      e.preventDefault();
      history.back();
    }
  });
});
