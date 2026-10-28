# NAME ATELIER — 작명 아틀리에

PLOTIVE 텀블벅 펀딩 SNS 이벤트 참여자에게 무료로 주는 **독립형 웹소설 캐릭터 이름 생성기**입니다.
PLOTIVE 없이 혼자 실행되고, 인터넷·로그인·서버·외부 API를 쓰지 않습니다.

- 캐릭터 이름 전용(지명·가문·문파·기술명은 다루지 않음).
- 장르(4) × 이름 스타일(10: 한국식·로판식·선협식·무협식·미국식·영국식·프랑스식·독일식·일본식·창작 판타지식) × 성별(3)을 골라 **한 번에 이름 3개**를 카드로 뽑습니다. 「다시 뽑기 ✨」로 새 3개.
- 카드 이미지 저장(SNS 공유용, NAME ATELIER × PLOTIVE), 성 고정 뽑기, 조건 뽑기(글자 수·첫 글자·받침), 이미 쓴 이름 피하기
- 선협·무협 한자 뜻 풀이, 서양 이름 애칭
- 즐겨찾기(로컬 저장, 다시 뽑아도 카드 유지, 메모·작품 분류·검색), TXT·CSV(UTF-8) 저장, 클립보드 복사
- 라이트·다크 테마, 카드 뒤집기 애니메이션(끄기 가능)

## 기술 구조

Electron 38 + React 19 + TypeScript, esbuild 번들, electron-builder 배포. PLOTIVE와 같은 스택이지만 코드·의존성은 공유하지 않습니다.

| 경로 | 내용 |
|---|---|
| `src/data/` | 이름 데이터(문화권별 검수 목록, 창작 판타지 음절, 금칙어) — 출처 `SOURCES.md` |
| `src/engine/` | 이름 생성 엔진(순수 함수), TXT/CSV 내보내기 |
| `src/main/` | 창, 로컬 저장(JSON, 원자적 쓰기), 클립보드, 파일 저장, 네트워크 차단 |
| `src/renderer/` | 화면(React). 디자인 토큰 `styles/theme.css`, 자산 감지 `assets.ts` |
| `assets/design/` | 이미지개미 자산을 넣는 곳(없으면 코드 디자인으로 작동) |
| `docs/` | 디자인 규격서·이미지 프롬프트·와이어프레임·사용 설명서·빌드 안내 |

## 명령

```bash
npm install
```

```bash
npm start
```

```bash
npm test
```

```bash
npm run check:data
```

```bash
npm run dist:win
```

자세한 내용은 `docs/BUILD.md`.
