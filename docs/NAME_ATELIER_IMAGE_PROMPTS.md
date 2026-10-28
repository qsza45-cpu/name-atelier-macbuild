# NAME ATELIER — 이미지개미 제작 프롬프트 v1

작성 2026-10-28 (KST) · 대상: 이미지개미 · 규격의 정본은 `NAME_ATELIER_DESIGN_SPEC.md` (크기·inset·파일명이 이 문서와 다르면 규격서가 우선)

> 이 문서는 그대로 전달하면 바로 작업을 시작할 수 있도록 썼습니다. 각 항목의 **한국어 설명**은 의도, **English prompt**는 이미지 생성용입니다.
> 화면 배치는 `design/NAME_ATELIER_UI_WIREFRAME.svg`를 꼭 같이 보세요. **이름 카드 3장 + 큰 「다시 뽑기 ✨」 버튼** 구조입니다.
> 캐릭터 이름 전용 프로그램입니다. 이름 스타일은 한국식·로판식·선협식·무협식·영미권·유럽·일본·창작 판타지까지 폭넓으므로, 이미지는 특정 문화권(동양풍만, 서양풍만)에 치우치지 않는 **"작가의 작명 공방"** 자체를 표현합니다.

---

## 1. 전체 콘셉트

**"밤의 작명 공방 — 와인 잉크와 샴페인 금박"**

작가가 촛불 아래에서 인물 이름을 한 장씩 카드로 뽑아 보는 작은 공방(atelier). 오래된 양피지, 와인빛 잉크, 금박 테두리, 봉랍, 펜촉, 별빛 먼지가 모티프입니다. 로맨스판타지 표지처럼 우아하지만 **화면은 비어 있고 조용해야** 합니다. 주인공은 카드에 올라갈 **이름 글자**이고, 이미지는 그 무대를 꾸미는 역할입니다.

PLOTIVE(아이보리·네이비 편집실, PL 모노그램)와는 다른 제품으로 보여야 합니다. 같은 회사의 문학적 감성은 유지하되 색(와인·골드)과 상징(이름 카드·펜촉·봉랍)으로 구별합니다.

### 디자인 키워드
`literary atelier` · `wine ink` · `champagne gold foil` · `parchment` · `wax seal` · `nib pen` · `stardust` · `art nouveau line` · `quiet luxury` · `romance fantasy book cover` · `calm center`

### 색상 팔레트
| 이름 | 라이트 | 다크 | 사용 |
|---|---|---|---|
| 양피지 | `#F4EDE2` / `#E9DCC6` | — | 라이트 바탕 |
| 밤 자두 | — | `#16111A` / `#2B2132` | 다크 바탕 |
| 와인 잉크 | `#7B2D4A` | `#5A1F37` | 주 액센트 |
| 로즈 | — | `#E59BB5` (아주 조금) | 다크 액센트 |
| 샴페인 골드 | `#B48A42` → `#D9BE84` | `#D6B46E` | 금박·장식선 |
| 잉크 검정 | `#2A2026` | — | 로고 글자 |

---

## 2. 모든 이미지 공통 규칙 (필수)

- 이미지 속에 **글자·숫자·문장·가짜 UI·버튼 모양·실존 로고·서명·워터마크를 넣지 않습니다.** (워드마크 로고만 예외)
- 인물·캐릭터·얼굴·손을 넣지 않습니다.
- 가운데(안전 영역)는 비워 둡니다. 장식은 가장자리에만.
- 진짜 알파 투명 PNG로 저장합니다. 체커보드 무늬를 그린 가짜 투명은 불합격입니다.
- 모든 비트맵은 규격서의 @3x 크기 그대로 저장합니다.
- sRGB, 8bit.

### 금지 요소 (Negative)
글자, 알파벳 낙서, 한자 낙서, 숫자, 가짜 캘리그래피 문장, 사람·캐릭터·동물 얼굴, 해골·피·무기, 네온·사이버펑크, 과한 렌즈 플레어, 무지개 그라데이션, 3D 플라스틱 질감, 체커보드 배경, 워터마크, PLOTIVE의 PL 모노그램, 실존 브랜드 문양, 왼쪽 세로줄만 있는 장식(사용자 금지 규칙: "AI 스타일" 세로 막대).

English negative prompt (모든 이미지 공통으로 붙이기):
```
no text, no letters, no words, no numbers, no calligraphy, no signature, no watermark, no logo, no UI elements, no buttons, no people, no faces, no hands, no animals, no skulls, no weapons, no neon, no cyberpunk, no lens flare, no rainbow gradient, no plastic 3D render, no checkerboard background, no single vertical bar ornament on the left edge
```

---

## 3. 로고 (A1–A3)

### A1·A2 워드마크 — `logo_wordmark_dark` / `logo_wordmark_light`
**설명:** "NAME ATELIER" 영문 대문자 워드마크. 고전적인 세리프(로맨스판타지 표지·향수 브랜드 느낌), 글자 사이 약간 넓게. 두 단어 사이에 작은 별(✦) 또는 펜촉 모양 구분 기호 하나. 장식은 최소한으로 — 머리에 220×36으로 작게 들어가므로 가는 장식선은 사라집니다.
- dark 버전: 잉크 검정 `#2A2026` 글자 + 구분 기호만 골드 `#B48A42`.
- light 버전: 크림 `#F2EADF` 글자 + 구분 기호 골드 `#D6B46E`.
- 규격: 1320×216 투명 PNG + 외곽선 SVG. 글꼴은 OFL(Cormorant Garamond SemiBold / Cinzel / Playfair Display SC 등) 중 선택해 매니페스트에 기록. 생성 이미지 대신 **실제 글꼴로 조판 후 다듬는 방식**을 권장합니다(글자 정확도).

English prompt (방향 탐색용 시안):
```
Elegant wordmark logo reading exactly "NAME ATELIER" in classic high-contrast serif capitals, wide letter spacing, a tiny four-point star separator between the two words in champagne gold, letters in deep ink #2A2026, refined romance-fantasy book cover typography, luxury perfume brand feel, flat vector, centered, transparent background, generous margins, wide horizontal format 1320x216
```

### A3 심볼 — `logo_symbol`
**설명:** 앱의 상징. **이름표(라벨 태그) + 펜촉**이 결합된 모노그램, 또는 **봉랍(wax seal) 속 펜촉과 작은 별**. 원형 또는 방패형 안에 들어가는 단순한 형태. 40×40으로도 알아볼 수 있어야 합니다. 와인 `#7B2D4A` 면 + 골드 `#B48A42` 선. 라이트·다크 둘 다 보이도록 와인 면이 바탕 역할을 합니다.
- 시안 3종을 요청합니다: ① 이름표+펜촉 ② 봉랍+펜촉+별 ③ 카드 3장 겹침+별.
- 480×480 투명 PNG + SVG. 바깥 여백 각 40px.

English prompt:
```
Minimal emblem symbol for a naming atelier app: a vintage name tag label combined with a fountain pen nib, enclosed in a circular wine-red wax seal shape, thin champagne gold outline and a tiny four-point star, flat vector, bold simple silhouette readable at 40 pixels, wine red #7B2D4A and gold #B48A42 only, centered, transparent background, 480x480
```
변형 ②:
```
Minimal emblem: wine-red wax seal with a fountain pen nib pressed in the center and a small four-point star above it, gold rim, flat vector, simple silhouette readable at small size, wine red #7B2D4A and champagne gold #B48A42, transparent background, 480x480
```
변형 ③:
```
Minimal emblem: three slightly fanned blank playing-card shapes with rounded corners, the front card wine red with a thin gold border and a small four-point star in the center, flat vector, readable at 40 pixels, wine red #7B2D4A and champagne gold #B48A42, transparent background, 480x480
```

---

## 4. 앱 아이콘 (A4·A5)

**설명:** 선택된 심볼을 둥근 사각 판 위에 올린 아이콘. 판 색은 밤 자두 `#221A27`→`#3A2340` 은은한 세로 그라데이션, 심볼은 골드+와인. 1024 캔버스 안에 824×824 판(모서리 반경 약 185), 바깥 100px 투명. 16·32·48px은 같은 그림을 줄이지 말고 **장식을 덜어낸 단순 버전**으로 따로 그립니다(16px은 펜촉 실루엣 + 판 색만).

English prompt:
```
App icon, rounded square tile in deep plum gradient #221A27 to #3A2340, centered gold and wine-red emblem of a fountain pen nib on a wax seal with a tiny star, subtle gold foil edge highlight, flat with soft depth, premium and literary, no text, 1024x1024 with 100px transparent margin around the tile
```

---

## 5. 배경 (B1·B2)

규격: 3200×2000 JPG. **가운데 2240×1400은 거의 비어 있는 종이결/어둠만.** 장식은 네 모서리와 가장자리에, 모서리에서 안쪽 12% 이상 들어오지 않게.

### B1 `bg_main_light.jpg` — 라이트
**설명:** 따뜻한 양피지 책상 위. 네 모서리에 아주 옅은 금박 아르누보 덩굴선, 왼쪽 위 구석에 흐릿한 와인빛 잉크 번짐, 오른쪽 아래 구석에 펜촉과 봉랍 한 개가 초점 밖으로 흐릿하게. 가운데는 밝은 양피지 결만. 전체적으로 밝고 대비가 낮아 그 위의 카드가 돋보이게.

English prompt:
```
Wide desktop wallpaper, warm parchment paper surface #F4EDE2 with very subtle fiber texture, faint champagne gold art nouveau vine line ornaments only in the four corners, a soft out-of-focus wine-red ink bloom in the top-left corner, a blurred fountain pen nib and a small wine-red wax seal in the bottom-right corner far from center, large calm empty center area with only paper texture, soft diffused candle-warm light, low contrast, elegant literary atelier mood, 16:10, 3200x2000
```

### B2 `bg_main_dark.jpg` — 다크
**설명:** 밤의 공방. 깊은 자두빛 어둠, 가장자리에 금빛 별먼지(작은 입자)가 아주 조금, 위쪽 모서리에 촛불의 따뜻한 빛 번짐, 아래 모서리에 금박 선 장식. 가운데는 거의 단색 어둠(`#16111A`–`#1E1724`). 과한 별·성운 금지.

English prompt:
```
Wide desktop wallpaper, deep plum night background #16111A with subtle velvet texture, sparse tiny champagne gold stardust particles only near the edges, a soft warm candle glow bleeding in from the top-right corner, thin gold art nouveau line ornaments in the bottom corners, large calm nearly solid dark center, quiet luxury literary atelier at night, low contrast, no nebula, no bright stars in the center, 16:10, 3200x2000
```

---

## 6. 이름 카드 장식 (C1–C4)

카드는 화면의 주인공입니다. 실제 화면에 **3장 나란히** 놓이고, 각 카드 가운데에 한글 이름(나눔명조 30px)이 들어갑니다. 장식은 테두리 띠 안에만.

### C1·C2 카드 테두리 9-slice — `card_frame_light` / `card_frame_dark`
규격: 792×960 투명 PNG, 사방 inset **54px** 안에만 장식, inset 안쪽 중앙 **완전 투명**.
**설명:** 고급 초대장 카드의 금박 테두리. 네 모서리(각 54×54 칸 안)에 작은 아르누보 모서리 장식, 변은 늘려도 되는 **가는 이중선**만. 변 가운데 단독 장식 금지. 바탕(종이색)은 그리지 않습니다 — 코드가 칠합니다.
- light: 골드 `#B48A42` 선 + 모서리에 와인 `#7B2D4A` 작은 점.
- dark: 골드 `#D6B46E` 선 + 모서리에 로즈 `#E59BB5` 아주 작은 점.

English prompt (light; dark는 색만 교체):
```
Ornamental card border frame only, thin double gold foil line #B48A42 running along all four edges, small symmetric art nouveau corner flourishes with a tiny wine-red #7B2D4A dot in each corner, all ornament kept within a 54-pixel band from the edge, the entire inner area fully transparent, no background fill, no ornament at the middle of the edges, flat vector, crisp, transparent PNG, 792x960
```
※ 생성 결과는 반드시 벡터로 다시 그리거나 정리해 모서리 칸 54px·직선 변을 지키세요. 9-slice로 늘렸을 때 변이 깨지면 불합격입니다.

### C3 카드 상단 문장 — `card_crest`
규격: 360×84 투명 PNG (화면 120×28), 라이트·다크 공용.
**설명:** 카드 맨 위 가운데의 작은 장식. 가운데 별(✦) 또는 작은 봉랍, 양옆으로 짧게 뻗는 금박 덩굴선. 좌우 대칭.

English prompt:
```
Small symmetric header ornament, a tiny four-point star in the center with short elegant champagne gold art nouveau flourishes extending left and right, thin lines, flat vector, gold #C9A35E with subtle foil sheen, transparent background, wide format 360x84
```

### C4 카드 뒷면 — `card_back`
규격: 792×960 PNG, 모서리 반경 54px 바깥은 투명. 라이트·다크 공용.
**설명:** 타로·플레잉카드 뒷면처럼 대칭 무늬. 와인 바탕 `#5A1F37`–`#7B2D4A` 위에 가는 골드 기하·덩굴 무늬, 가운데 심볼(봉랍+펜촉) 자리를 작게. 뽑기 애니메이션에서 0.2초 정도 보이고, 처음 실행 때 빈 카드로 보입니다. 위에 코드가 "이름을 뽑아 보세요" 글자를 올리므로 **가운데 280×160 영역은 무늬를 옅게**.

English prompt:
```
Ornate card back design, rich wine red background #6A2440 with fine symmetrical champagne gold line pattern of art nouveau vines and small stars, a thin gold inner border, a small wax-seal-and-nib emblem at the center, the central area softly calmer and less detailed, vertically and horizontally symmetric, flat illustration with subtle foil sheen, rounded corners, 792x960
```

---

## 7. 라이트·다크 대응 요약

| 자산 | 라이트 | 다크 | 공용 |
|---|---|---|---|
| 워드마크 | `logo_wordmark_dark` | `logo_wordmark_light` | |
| 심볼 | | | `logo_symbol` |
| 배경 | `bg_main_light` | `bg_main_dark` | |
| 카드 테두리 | `card_frame_light` | `card_frame_dark` | |
| 카드 상단 문장 | | | `card_crest` |
| 카드 뒷면 | | | `card_back` |
| 앱 아이콘 | | | `app_icon_*` |

---

## 8. 이미지별 제작 규격 (요약표)

| ID | 파일명 | 규격 | 형식 | 투명 | 우선 |
|---|---|---|---|---|---|
| A1 | `logo_wordmark_dark.png` + `.svg` | 1320×216 | PNG+SVG | 예 | P1 |
| A2 | `logo_wordmark_light.png` + `.svg` | 1320×216 | PNG+SVG | 예 | P1 |
| A3 | `logo_symbol.png` + `.svg` | 480×480 | PNG+SVG | 예 | P1 |
| A4 | `app_icon_1024.png` | 1024×1024 | PNG | 예 | P1 |
| A5 | `app_icon_16/32/48.png` | 16·32·48 | PNG | 예 | P1 |
| B1 | `bg_main_light.jpg` | 3200×2000 | JPG ≤900KB | 아니오 | P1 |
| B2 | `bg_main_dark.jpg` | 3200×2000 | JPG ≤900KB | 아니오 | P1 |
| C1 | `card_frame_light.png` | 792×960, inset 54 | PNG ≤400KB | 예 | P1 |
| C2 | `card_frame_dark.png` | 792×960, inset 54 | PNG ≤400KB | 예 | P1 |
| C3 | `card_crest.png` | 360×84 | PNG | 예 | P2 |
| C4 | `card_back.png` | 792×960, r54 | PNG | 모서리만 | P2 |

제작 순서 권장: **A3 심볼 시안 3종 → 사용자 선택 → A1·A2·A4·A5 → C1·C2 → B1·B2 → C3·C4**

---

## 9. 파일 저장 위치

```
C:\Users\User\Downloads\홍보용 이미지\NAME_ATELIER_디자인\
  00_규격서\  01_시안\Round01\  02_원본\  03_앱적용\  04_검수\  05_최종승인본\  ASSET_MANIFEST.md
```
- `03_앱적용`에는 위 표의 파일명 그대로, 앱에 바로 넣을 파일만.
- 개발 적용: `C:\Users\User\Downloads\name-atelier\assets\design\` (앱 아이콘은 `assets\icon\`)로 복사. **사용자 승인 전에는 `05_최종승인본`을 비워 둡니다.**
- `04_검수`에는 실제 화면 합성 확인본을 넣어 주세요: 카드 3장 + 「다시 뽑기 ✨」 버튼이 있는 960×680 화면을 라이트·다크로 각 1장, 카드에 `샬럿 펨버턴` / `프리드리히 폰 아이헨도르프` / `백연화 (白蓮花)` 이름을 나눔명조로 합성.
- `ASSET_MANIFEST.md`: 파일별 크기·용도·사용 도구·글꼴 라이선스·검수 결과.
