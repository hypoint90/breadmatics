/* =========================================================
   menu.js — 2안 메뉴 (영수증 한 장)
   - 평소: 왼쪽 위 작은 탭(≡ MENU)
   - 마우스를 올리면: 탭은 화면 위로 올라가고, 긴 영수증이 위에서 쭉 내려옴
   - 마우스가 나가도 0.5초 동안은 펼친 채로 두고, 바깥 클릭·×·Esc 는 바로 닫힘
   - 항목을 누르면 동그라미가 채워진 뒤 접힘
   ========================================================= */

(() => {
  const OPEN_DELAY = 60; // 마우스를 올리고 열리기까지(ms) — 스쳐 지나갈 때 안 열리게
  const CLOSE_DELAY = 500; // 마우스가 나가고 닫히기까지(ms)
  const PICK_DELAY = 260; // 항목 클릭 → 접히기까지(ms)

  const menu = document.querySelector(".menu");
  const tab = menu.querySelector(".menu__tab");
  const receipt = menu.querySelector(".menu__receipt");
  let timer = null;
  let held = false; // 항목을 누른 뒤에는 마우스가 위에 있어도 접어 둠 (나갔다 다시 들어오면 해제)

  const isOpen = () => menu.classList.contains("is-open");
  const setOpen = (open) => {
    clearTimeout(timer);
    menu.classList.toggle("is-open", open);
    tab.setAttribute("aria-expanded", open);
    receipt.inert = !open;
  };
  const later = (open, ms) => {
    clearTimeout(timer);
    timer = setTimeout(() => setOpen(open), ms);
  };
  setOpen(false);

  menu.addEventListener("mouseenter", () => !held && later(true, OPEN_DELAY));
  menu.addEventListener("mouseleave", () => {
    held = false;
    later(false, CLOSE_DELAY);
  });

  tab.addEventListener("click", () => {
    setOpen(true);
    menu.querySelector(".nav__item.is-active, .nav__item")?.focus({ preventScroll: true });
  });
  menu.querySelector(".menu__close").addEventListener("click", () => {
    held = true;
    setOpen(false);
  });

  // 항목 클릭: 바로 이동(페이지 전환 시작)하고, 영수증은 잠깐 뒤 올라감
  receipt.addEventListener("click", (e) => {
    if (!e.target.closest("a")) return;
    held = true;
    later(false, PICK_DELAY);
  });

  // 바깥을 클릭하면 기다리지 않고 바로 닫힘
  document.addEventListener("pointerdown", (e) => {
    if (isOpen() && !menu.contains(e.target)) setOpen(false);
  });

  // 키보드: 영수증 밖으로 나가면 닫힘 / Esc
  menu.addEventListener("focusout", (e) => {
    if (!menu.contains(e.relatedTarget) && !menu.matches(":hover")) later(false, 0);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      tab.focus();
    }
  });
})();
