# Breadmatics Recipe

빵을 방정식으로 기록하는 인터랙티브 레시피 웹 (데스크톱 전용, 순수 HTML/CSS/JS)

## 실행

- VS Code: **Live Server** 확장으로 `index.html` 열기
- 또는 PowerShell: `powershell -ExecutionPolicy Bypass -File tools/serve.ps1` → http://localhost:5500

> `index.html` 을 더블클릭해서 열어도 동작합니다.

## 폴더 구조

```
index.html            모든 화면의 뼈대 (섹션별 주석)
css/
  base.css            폰트·색·모션 변수, 크기 단위(--px) 설명
  nav.css             상단 메뉴바
  main.css            메인
  ingredients.css     재료 (컬럼 보기 / 주기율표 보기)
  manual.css          메뉴얼 아코디언
  recipe.css          레시피 목록·상세·Make my recipe
js/
  data.js             ★ 텍스트·이미지 데이터 (재료, 빵, 메뉴얼) — 내용 수정은 여기서
  app.js              페이지 전환(#/주소) · 공통 함수
  main.js / ingredients.js / manual.js / recipe.js   화면별 동작
assets/img/
  photo/  bread/  halftone/  ingredient/   WebP 변환 이미지
  _image-map.txt      변환 파일 ↔ 원본 파일 대응표
B_recipe_img/         원본 PNG (사이트에서는 사용하지 않음)
```

## 크기 규칙

피그마 1440×920 기준 수치를 `calc(숫자 * var(--px))` 로 그대로 씁니다.
화면이 커지거나 작아지면 비율대로 자동 조정됩니다.

## 모션 조정

`css/base.css` 의 `--ease-*`, `--dur-*` 변수에서 전체 속도/가속을 한 번에 바꿀 수 있습니다.

## 남은 작업 (TODO)

- 메뉴얼 02~07 본문 (피그마에서 아직 가져오지 못함)
- 빵 10종 중 이름 미확정 5종, 빵별 수식·재료·무게·칼로리 (현재 샘플값)
- Make my recipe (나만의 빵 만들기)
