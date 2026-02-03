# 메이플운동회 길드 홈페이지

메이플스토리 월드 길드 "메이플운동회" 공식 홈페이지

**라이브 URL**: https://maplestar.app

---

## 배포 규칙 (중요!)

### 프론트엔드 배포 시 반드시 `--branch=main` 사용!

```bash
# 올바른 배포 명령어 (Production)
npm run build
npx wrangler pages deploy dist --project-name=maplestar-guild --branch=main
```

| 옵션 | 환경 | 결과 |
|------|------|------|
| `--branch=main` | **Production** | maplestar.app에 반영됨 |
| `--branch=master` 또는 없음 | Preview | 테스트용 URL만 생성, 메인에 반영 안됨 |

### 백엔드 배포
```bash
cd worker && npx wrangler deploy
```

---

## Cloudflare 배포 정보

### 리소스 요약

| 리소스 | 이름 | ID/URL |
|--------|------|--------|
| **Pages** | maplestar-guild | https://maplestar.app |
| **Workers** | maplestar-guild-api | https://maplestar-guild-api.harmonyweb01.workers.dev |
| **D1 Database** | guild-db | `` |
| **R2 Bucket** | maplestar-guild-images | - |

### 프론트엔드 배포 (Pages)

```bash
# 빌드 후 프로덕션 배포 (main 브랜치 = 프로덕션)
npm run build
npx wrangler pages deploy dist --project-name=maplestar-guild --branch=main
```

> **참고**: `--branch=main`을 사용해야 maplestar.app 커스텀 도메인에 배포됨

### 백엔드 배포 (Workers)

```bash
cd worker
npm run deploy
```

### 데이터베이스 (D1)

```bash
# 원격 DB 쿼리 실행
npx wrangler d1 execute guild-db --remote --command "SELECT * FROM users"

# 로컬 DB 쿼리 실행
npx wrangler d1 execute guild-db --local --command "SELECT * FROM users"

# 스키마 적용
npx wrangler d1 execute guild-db --remote --file=worker/schema.sql
```

### 이미지 스토리지 (R2)

- 버킷명: `maplestar-guild-images`
- 이미지 경로 패턴:
  - 프로필: `profile/{uuid}.{ext}`
  - 갤러리: `gallery/original/{uuid}.{ext}`
  - 게시글: `posts/{uuid}.{ext}`
- 이미지 URL: `/api/images/{path}`

---

## 프로젝트 구조

```
GUILDHOMEPAGE/
├── src/                    # 프론트엔드 (React)
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── MainPage.jsx
│   │   ├── GalleryPage.jsx
│   │   ├── ShowoffPage.jsx
│   │   ├── SchedulePage.jsx
│   │   ├── MembersPage.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── AlliancePage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── SignupPage.jsx
│   ├── components/         # 공통 컴포넌트
│   │   ├── Header.jsx
│   │   ├── Modal.jsx
│   │   └── UserAvatar.jsx
│   ├── context/
│   │   └── AuthContext.jsx # 인증 상태 관리
│   ├── services/
│   │   └── api.js          # API 클라이언트
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── worker/                 # 백엔드 (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts        # 메인 엔트리
│   │   ├── routes/
│   │   │   ├── auth.ts     # 인증 API
│   │   │   ├── posts.ts    # 게시판 API
│   │   │   ├── gallery.ts  # 갤러리 API
│   │   │   ├── members.ts  # 길드원 API
│   │   │   ├── attendance.ts # 출석체크 API
│   │   │   └── events.ts   # 일정 API
│   │   ├── middleware/
│   │   │   └── auth.ts     # JWT 인증 미들웨어
│   │   └── utils/
│   │       └── response.ts # 응답 헬퍼
│   ├── schema.sql          # D1 스키마
│   ├── wrangler.toml       # Workers 설정
│   └── package.json
├── dist/                   # 빌드 결과물
├── package.json
├── vite.config.js
└── README.md
```

---

## 로컬 개발

### 프론트엔드

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:5173)
npm run dev

# 빌드
npm run build
```

### 백엔드

```bash
cd worker

# 의존성 설치
npm install

# 로컬 개발 서버 (http://localhost:8787)
npm run dev

# 배포
npm run deploy
```

### 로컬 개발시 API 프록시

`vite.config.js`에서 API 프록시 설정:
```js
server: {
  proxy: {
    '/api': 'http://localhost:8787'
  }
}
```

---

## API 엔드포인트

### 인증 (`/api/auth`)
| Method | Path | 설명 |
|--------|------|------|
| POST | /signup | 회원가입 |
| POST | /login | 로그인 |
| GET | /me | 내 정보 조회 |
| PUT | /profile | 프로필 수정 |
| POST | /profile/image | 프로필 이미지 업로드 |

### 게시판 (`/api/posts`)
| Method | Path | 설명 |
|--------|------|------|
| GET | / | 목록 (category 쿼리) |
| POST | / | 작성 |
| GET | /:id | 상세 |
| PUT | /:id | 수정 |
| DELETE | /:id | 삭제 |
| POST | /:id/like | 좋아요 토글 |

### 갤러리 (`/api/gallery`)
| Method | Path | 설명 |
|--------|------|------|
| GET | / | 목록 |
| POST | / | 업로드 |
| PUT | /:id | 수정 |
| DELETE | /:id | 삭제 |
| POST | /:id/like | 좋아요 토글 |

### 일정 (`/api/events`)
| Method | Path | 설명 |
|--------|------|------|
| GET | / | 목록 |
| POST | / | 생성 (관리자) |
| PUT | /:id | 수정 (관리자) |
| DELETE | /:id | 삭제 (관리자) |
| POST | /:id/join | 참가 신청 |

### 출석 (`/api/attendance`)
| Method | Path | 설명 |
|--------|------|------|
| GET | / | 이번 달 출석 현황 |
| POST | /check | 출석체크 |
| GET | /stats | 통계 |

### 기타
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/members | 길드원 목록 |
| GET | /api/alliances | 연합 길드 목록 |
| GET | /api/notices | 공지사항 목록 |
| GET | /api/images/* | 이미지 서빙 (R2) |

---

## D1 데이터베이스 테이블

```sql
-- 사용자
users (id, username, password_hash, character_name, job, level,
       profile_image, default_icon, profile_zoom, role, alliance_id, ...)

-- 게시글
posts (id, user_id, category, title, content, image_urls,
       view_count, like_count, is_deleted, ...)

-- 갤러리
gallery (id, user_id, title, description, image_key, image_url,
         like_count, view_count, is_deleted, ...)

-- 출석
attendance (id, user_id, check_date, check_time, streak_days)

-- 일정
events (id, title, description, event_date, event_time,
        event_type, max_participants, created_by, ...)

-- 일정 참가자
event_participants (id, event_id, user_id, joined_at)

-- 연합 길드
alliances (id, name, emblem, description, is_main, member_count)

-- 공지사항
notices (id, title, content, is_important, is_hot, created_by, ...)
```

---

## wrangler.toml 설정

```toml
name = "maplestar-guild-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "guild-db"
database_id = "3742ee92-8693-4e3c-afd7-156b14a0c539"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "maplestar-guild-images"
```

---

## 권한 (역할)

| 역할 | 권한 |
|------|------|
| `master` | 모든 권한 (길드마스터) |
| `submaster` | 관리자 권한 (부마스터) |
| `member` | 일반 길드원 |
| `honorary` | 명예 길드원 |

---

## 주요 기능

- 회원가입/로그인 (JWT 인증)
- 프로필 설정 (이미지, 아이콘, 확대 설정)
- 갤러리 (업로드, 좋아요, 수정/삭제)
- 템자랑 게시판
- 운동회 일정 (참가 신청)
- 출석체크 (연속 출석 보너스)
- 길드원 목록 (역할별 필터)
- 연합 길드 정보

---

## 트러블슈팅

### CORS 에러
- `worker/src/index.ts`에서 origin 설정 확인
- 허용된 origin: `https://maplestar.app`, `https://www.maplestar.app`

### 이미지 안 보임
- `getImageUrl()` 함수로 API 도메인 prefix 추가 필요
- R2 버킷 권한 확인

### 배포 후 변경 안 됨
- 브라우저 캐시 삭제 (Ctrl+Shift+R)
- `--branch=main` 플래그 사용 (main = 프로덕션)
- production 브랜치 아님! main 브랜치가 maplestar.app에 연결됨

---

## 기술 스택

- **Frontend**: React 18, Vite
- **Backend**: Cloudflare Workers, Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Auth**: JWT
- **Hosting**: Cloudflare Pages

---

Made with by 메이플운동회
