# nothingmatters-blog-studio

사진, 짧은 메모, 글 주제를 입력하면 nothingmatters 제품 2개를 자동 추천하고 네이버 블로그형 초안을 생성하는 내부용 웹앱입니다.

## 기능

- 대시보드, 새 글 만들기, 생성 결과 편집, 제품/브랜드 설정, 글 보관함
- 텍스트 기반 글 생성과 사진 관찰 기반 이미지 배치 가이드
- 제품 DB 점수 계산 후 제품 2개 추천
- 제품별 정보요약, 사장님 코멘트, 부족한 자료 질문 카드
- OpenAI Structured Outputs 기반 JSON 초안 생성
- 네이버 검색 API 참고 키워드 수집
- 섹션별 재생성, 모바일 미리보기, 네이버 붙여넣기용 일반 텍스트 복사
- 예제 글 원문을 저장하지 않는 참고 패턴 기반 글 풍성화/검수
- Supabase PostgreSQL/Storage와 Railway 배포

## 제품 운영표

추천제품 섹션이 AI처럼 늘어진 문장으로 보이지 않게 제품마다 `editorial_profile`을 저장합니다.

- 추천 상황
- 한줄 포인트
- 문구 포인트
- 포장 느낌
- 주문 전 확인
- 사장님 코멘트
- 사진 포인트
- FAQ 메모

제품 설정 화면에서 직접 입력할 수 있고, 비어 있는 항목은 새 글 만들기 화면의 자동 질문 카드에 표시됩니다. 자료가 없는 가격, 배송, 고객 반응, 판매량은 생성하지 않고 문의 때 확인할 항목으로 처리합니다.

블로그 본문에는 이 운영표 전체를 노출하지 않고 `사장님한마디 😎`와 선택 기준 중심의 짧은 문장으로 자연스럽게 풀어냅니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

환경변수가 비어 있으면 데모 모드로 실행됩니다. Supabase와 OpenAI 키를 넣으면 실제 저장/생성 파이프라인을 사용합니다.

## 필수 환경변수

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

## 선택 환경변수

- `OPENAI_MODEL` 기본값: `gpt-5.2-mini`
- `OPENAI_VISION_MODEL` 기본값: `gpt-5.2-mini`
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`

네이버 키가 없으면 `/api/naver-search`는 fallback 제목 패턴을 반환하고 나머지 생성 과정은 계속 동작합니다.

## Supabase 설정

1. Supabase SQL Editor에서 `db/schema.sql` 실행
2. `db/seed-brand.sql` 실행
3. `db/seed-products.sql` 실행
4. `db/seed-reference-patterns.sql` 실행
5. Storage bucket `blog-images` 생성
6. Railway 환경변수에 Supabase URL과 service role key 등록

RLS는 켜져 있고 서버의 service role key만 전체 테이블을 관리합니다.
참고 패턴 seed는 예제 글의 문장이 아니라 제목 구조, 도입 전개, 이미지 배치, 금지 규칙만 저장합니다.

## Railway 배포

Railway에서 GitHub repo를 연결한 뒤 환경변수를 등록하면 `railway.json`의 설정으로 빌드됩니다.

```bash
npm run build
npm run start
```

Railway는 `PORT`를 자동 주입하며 Next.js `next start`가 이를 사용합니다.

## 검증

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
