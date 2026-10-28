# 빌드와 배포

## Windows
- `npm run dist:win` → `release/`
  - `NAME-ATELIER-Setup-<버전>.exe` (NSIS 설치판, 설치 위치 선택 가능, 사용자 단위 설치)
  - `NAME ATELIER-<버전>-win.zip` (휴대용)
  - `win-unpacked/NAME ATELIER.exe`
- 코드 서명 없음. 서명 인증서는 사용자 승인 후 구매 예정(PLOTIVE와 같은 결정: 출시 직전 결제).

## macOS
- macOS 컴퓨터에서 `npm install && npm run dist:mac` → `release/*.dmg`, `*-mac.zip`.
- electron-builder가 `assets/icon/app_icon_1024.png`로 `.icns`를 만듭니다.
- Intel(x64)·Apple Silicon(arm64)용을 각각 만듭니다. `identity: "-"`로 임시(ad-hoc) 서명만 합니다 — 서명이 아예 없으면 Apple Silicon에서 "손상된 앱" 오류가 나기 때문입니다.
- Windows에서는 macOS 앱을 만들 수 없습니다(electron-builder 제약). 정식 서명·공증(Apple Developer 계정, 연 $99)은 사용자 승인 필요 항목입니다.
- 공증 전 첫 실행 안내: 앱을 한 번 열어 경고가 뜨면 **시스템 설정 → 개인정보 보호 및 보안 → "그래도 열기"**. (macOS 15부터 오른쪽 클릭 → 열기 우회가 없어졌습니다.) 그래도 안 되면 터미널에서 `xattr -cr "/Applications/NAME ATELIER.app"`.
- 패키지된 `.app`에서 `Contents/Resources/en.lproj`·`ko.lproj`가 남아 있는지 확인하세요(electronLanguages).

## 앱 아이콘 교체
이미지개미의 `app_icon_1024.png`를 받으면:

```bash
npx electron scripts/make-icon.cjs "C:/Users/User/Downloads/홍보용 이미지/NAME_ATELIER_디자인/03_앱적용/app_icon_1024.png"
```

16·32·48px 전용 PNG가 따로 오면 `assets/icon/`의 같은 이름 파일을 덮어쓰고 위 명령 대신 ICO만 다시 만드세요(스크립트가 1024에서 축소해 덮어쓰므로 순서 주의: 스크립트 실행 → 전용 PNG 복사 → 다시 빌드. ICO 안의 작은 크기는 축소본이 들어갑니다).

## 디자인 자산 적용
`assets/design/README.md` 참고. 파일 복사 → `npm run build` → `npm start`로 확인.

## 테스트
- `npm test` — 이름 엔진(조합·중복·성별·문화권 섞임·금칙어·내보내기)
- `npm run check:data` — 데이터 검수(개수·중복·빈 칸·표기 문자·금칙어)
- `npm run typecheck`
