# 고등어 회사: 오늘도 두 마리 출근

**Mackerel Company: Another Shift**는 작업복을 입은 고등어 직원이 심해 산업시설에서 유물을 회수하고, 할당량과 생존 사이에서 욕심을 조절하는 1~2인 모바일 웹 생존 게임입니다.

## 구현된 핵심 기능

- 오프라인 가능한 1인 캠페인과 자동 냉각 카트
- 6자리 코드 기반 온라인 2인 협동, 준비 상태, 서버 권한형 20Hz 시뮬레이션
- 양 플레이어를 잇는 냉기 호스, 협동형 유물, 연결 해제 후 20초 재접속
- 왼손·오른손·인벤토리 슬롯과 한 손/양손/협동형 아이템 규칙
- Day, 할당량, 초과 보상, 위험 단계, 감정, 급여 정산, 상점, 연속 생환
- 8개 시설 테마와 14종 데이터 기반 몬스터
- IndexedDB 1인 저장·JSON 내보내기/가져오기, SQLite 2인 캠페인 저장
- 가로/세로 모바일 터치 조작, 키보드 조작, 햅틱, 오디오·접근성 설정
- 설치형 PWA, 서비스 워커, 업데이트 알림, 오프라인 안내
- 외부 파일이 없어도 동작하는 Phaser/Canvas 절차적 그래픽과 Web Audio 사운드

## 화면 구조

`로딩 → 메인 메뉴 → 모드 선택 → 브리핑/로비 → 현장 → 유물 감정 → 급여 정산 → 상점 → 다음 Day`

설정, 도감, 크레딧, 연결 끊김 상태와 PWA 업데이트 안내도 포함합니다.

## 기술 스택

- 클라이언트: TypeScript, React, Vite, Phaser 3, Colyseus SDK, Zustand, Zod, Howler.js, Tone.js, vite-plugin-pwa
- 서버: Node.js 22.5+, Express 5, Colyseus, Zod, Pino, 내장 `node:sqlite`
- 테스트: Vitest, Playwright
- 구조: npm workspaces 모노레포

## 프로젝트 구조

```text
apps/client          React 메뉴/HUD, Phaser 월드, PWA, IndexedDB
apps/server          Express, Colyseus, SQLite, 정적 클라이언트 제공
packages/shared      공통 Zod 스키마와 네트워크 타입
packages/simulation  결정론적 게임 규칙과 서버/로컬 시뮬레이션
packages/content     맵, 몬스터, 장비, 유물, 계약, 진행 데이터
scripts              부하 테스트
 tests                Vitest 및 Playwright 테스트
```

## 로컬 실행

Node.js 22.5 이상이 필요합니다.

```bash
npm install
npm run dev
```

- 클라이언트: `http://localhost:4173`
- 서버 상태: `http://localhost:3000/health`

## 같은 와이파이의 휴대폰에서 테스트

1. 개발 PC와 휴대폰을 같은 네트워크에 연결합니다.
2. PC의 사설 IP를 확인합니다. 예: `192.168.0.20`.
3. `npm run dev`를 실행합니다.
4. 휴대폰 브라우저에서 `http://192.168.0.20:4173`에 접속합니다.
5. 방화벽에서 4173과 3000 포트를 허용합니다.

개발 클라이언트의 WebSocket 주소는 현재 브라우저 호스트의 3000번 포트를 사용합니다.

## 환경 변수

`.env.example`을 참고하십시오.

```env
NODE_ENV=development
PORT=3000
PUBLIC_ORIGIN=http://localhost:3000
DATABASE_PATH=./data/mackerel-company.sqlite
LOG_LEVEL=info
ROOM_TTL_MINUTES=30
RECONNECT_GRACE_SECONDS=20
```

프로덕션에서는 `PUBLIC_ORIGIN`을 실제 HTTPS 주소로 설정합니다.

## 검사와 테스트

```bash
npm run typecheck
npm run lint
npm test
npm run test:multiplayer
npm run test:e2e
npm run loadtest
```

Playwright 최초 실행 전 브라우저가 없다면 다음 명령이 필요합니다.

```bash
npx playwright install chromium
```

멀티플레이 스모크 테스트는 서버를 임시 기동해 방 생성·2인 참가·이동 동기화·연결 해제·재접속·복구 코드·일일 시드를 확인합니다.

부하 테스트는 별도로 실행 중인 서버를 대상으로 합니다. 기본 대상은 `http://127.0.0.1:3000`이며 다음처럼 조절합니다.

```bash
ROOMS=20 SERVER_URL=http://127.0.0.1:3000 npm run loadtest
```

## 빌드와 실행

```bash
npm run build
npm start
```

프로덕션 서버 하나가 정적 클라이언트, `/health`, REST 방 API, Colyseus WebSocket, SQLite 저장을 모두 제공합니다. 기본 주소는 `http://localhost:3000`입니다.

## Docker

```bash
docker build -t mackerel-company .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PUBLIC_ORIGIN=http://localhost:3000 \
  -v mackerel-data:/app/data \
  mackerel-company
```

## 서버 배포와 WebSocket 프록시

- HTTPS 환경에서는 WebSocket도 `wss://`로 전달해야 합니다.
- 프록시는 연결 업그레이드 헤더와 긴 유휴 타임아웃을 허용해야 합니다.
- `/colyseus` 이하 WebSocket 경로, `/api`, `/health`, 정적 파일을 같은 Node 서비스로 전달합니다.
- SQLite 파일이 유지되는 영구 디스크를 `DATABASE_PATH`에 연결합니다.
- 다중 서버 인스턴스 확장은 현재 로컬 Colyseus presence와 단일 SQLite 파일을 사용하므로 별도 Redis/공유 DB 전환이 필요합니다.

## PWA 설치와 오프라인

지원 브라우저의 “홈 화면에 추가” 또는 설치 아이콘을 사용합니다. 1인 모드는 이미 캐시된 번들 범위에서 오프라인 실행할 수 있습니다. 2인 모드는 인터넷 연결이 필요합니다. 새 서비스 워커가 준비되면 게임 안에 업데이트 배너가 표시됩니다.

## 저장 데이터

- 1인: 브라우저 IndexedDB에 캠페인·설정·도감·일일 기록 저장
- 2인: Day 완료 시 SQLite 트랜잭션 저장
- 진행 중 Day: 재시작 시 마지막 완료 Day부터 안전하게 다시 시작
- 설정 화면: 1인 저장 JSON 내보내기/가져오기, Zod 검증

## 콘텐츠 추가

`packages/content/src/index.ts`의 Zod 검증 데이터 배열을 확장합니다. 수치와 ID가 유효하지 않으면 개발/테스트 단계에서 오류가 납니다.

### 몬스터 추가

1. 몬스터 콘텐츠 데이터에 ID, 실루엣 색, 해금 Day, 탐지·대응·행동 코드를 추가합니다.
2. `packages/simulation`의 행동 코드 처리에 고유 상태 전환을 연결합니다.
3. 감지와 상태 전환 단위 테스트를 추가합니다.
4. Phaser 장면에서 실루엣 또는 전조 표현을 확인합니다.

### 맵 추가

1. 맵 ID, 크기, 기본 할당량, 위험과 테마를 콘텐츠 데이터에 추가합니다.
2. 도달 가능 출구와 카드키 배치 검증을 통과시킵니다.
3. 절차적 룸/장애물 렌더 규칙을 장면에 추가합니다.
4. 모바일에서 시야와 터치 조작을 확인합니다.

## 에셋과 라이선스

기본 빌드는 외부 그래픽·음원 파일을 사용하지 않습니다. 세부 내용은 다음 문서를 확인하십시오.

- `ASSET_CREDITS.md`
- `AUDIO_CREDITS.md`
- `LICENSES_THIRD_PARTY.md`

## 알려진 제한 사항

- 맵은 8개 테마의 플레이 가능한 절차적 변형이지만 Tiled/Blender로 제작된 대규모 수제 배경은 포함하지 않습니다. 서버 충돌은 월드 경계와 핵심 상호작용 위주이며 모든 장식 장애물을 정밀 충돌 지형으로 사용하지는 않습니다.
- 14종 몬스터는 서로 다른 데이터와 행동 분기를 가지지만, 기획서에 적힌 모든 개별 대응법·상호작용·엘리트 변형을 각각 전용 애니메이션과 퍼즐로 구현한 것은 아닙니다.
- Day 5 단위의 보스 강화와 진행 데이터는 있으나 Day 15·20·25·30의 장문 다단계 보스 연출은 단순화되어 있습니다.
- 물리 호스는 서버 장력 판정과 시각 보간 중심이며, 벽과 기둥을 따라 감기는 완전한 다중 세그먼트 로프 시뮬레이션은 아닙니다.
- 튜토리얼은 짧은 단계형 안내 오버레이이며 모든 행동을 강제로 검증하는 60~90초 전용 튜토리얼 맵은 아닙니다.
- 계약·출근 전 장비 선택, 영구 메타 성장, 도감과 상점은 핵심 루프를 지원하는 간소화 버전입니다. 서버 전체 일일 랭킹과 완전한 개발자 디버그 패널은 포함하지 않습니다.
- 키 재지정과 접근성 옵션 일부는 데이터 구조와 기본 설정을 제공하지만 모든 입력·렌더 요소에 대한 완전한 사용자 지정 UI까지 구현되지는 않았습니다.
- Playwright 검증은 모바일 뷰포트 브라우저 에뮬레이션이며 실제 iOS·Android 여러 기종의 실기기 테스트는 수행하지 않았습니다.
- 로컬 개발용 단일 프로세스 서버 구성입니다. 수평 확장에는 Redis presence와 외부 데이터베이스가 필요합니다.
- 브라우저 진동, WebGL 조명, 오디오 기능은 기기 지원 수준에 따라 폴백됩니다. Node.js 22의 `node:sqlite`는 현재 실행 환경에서 실험 기능 경고를 출력합니다.
- 기본 그래픽은 독자적인 절차적 2.5D 스타일이며 상용 3D 렌더 에셋 수준의 디테일은 아닙니다.
