# Open Attendance

근태 및 연차 관리를 위한 오픈소스 프로젝트입니다. 직원의 출석, 퇴근, 휴가 등을 체계적으로 관리하고 분석할 수 있는 통합 시스템을 제공합니다.

## 빠른 시작

### 1. 초기 설정

처음 프로젝트를 클론한 후 다음 명령어로 환경을 설정합니다:

```bash
./scripts/setup.sh
```

이 스크립트는 다음 작업을 수행합니다:
- `.env` 파일 생성 (환경 변수 설정)
- `NEXTAUTH_SECRET` 자동 생성
- 의존성 패키지 설치 (`npm install`)
- Prisma 클라이언트 생성
- 데이터베이스 마이그레이션 실행

### 2. 개발 서버 실행

```bash
./scripts/run.sh
```

또는 직접 npm 명령어 사용:

```bash
npm run dev
```

서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 접속할 수 있습니다.

### 3. 프로덕션 빌드 및 실행

```bash
./scripts/run.sh --prod
```

이 명령어는 프로덕션 빌드를 수행한 후 서버를 시작합니다.

## 주요 기능

### 직원의 출석/퇴근 기록 관리
- 기본적으로 법정 휴무일 및 회사 지정 휴무일 이외의 날짜에 출석한 것으로 간주
- 실제 출석을 하지 않은 경우 출석하지 않은 것으로 처리 및 이유를 기록할 수 있음

### 연차, 휴가, 병가 등 휴무 관리
- 연차 잔여일 관리
- 휴가 신청 및 승인 워크플로우
- 병가, 경조사휴가 등 특수 휴가 처리
- 휴가 사용 현황 추적
- 연도별 연차 초기화 및 이월 정책 관리
- 한국의 법정 공휴일 반영 및 한국의 연차법을 적용

### 근태 및 연차 사용 현황 분석 및 리포팅
- 월간/분기별/연간 근태 및 연차 사용 현황 리포트

### 사용자 계정 및 권한 관리
- 로그인 및 계정 생성
- 사용자별 역할 및 권한 관리
  - 관리자: 모든 기능 접근 가능
  - 일반 사용자: 자신의 근태 및 연차 정보만 접근 가능

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **인증**: NextAuth.js
- **데이터베이스**: SQLite (Prisma ORM)
- **UI**: React 19, Tailwind CSS, Radix UI
- **폼 관리**: React Hook Form + Zod

## 환경 변수

프로젝트 실행에 필요한 환경 변수는 `.env.example` 파일을 참고하세요.

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

## 문제 해결

### NextAuth 설정 오류

처음 실행 시 다음과 같은 오류가 발생할 수 있습니다:

```
[next-auth][warn][NEXTAUTH_URL]
[next-auth][warn][NO_SECRET]
GET /api/auth/error?error=Configuration 500
```

**해결 방법**: `./scripts/setup.sh` 스크립트를 실행하여 환경 변수를 설정하세요.

## 개발 가이드

### 데이터베이스 스키마 변경

Prisma 스키마를 변경한 후:

```bash
npx prisma migrate dev --name migration_name
npx prisma generate
```

### Prisma Studio (데이터베이스 GUI)

```bash
npx prisma studio
```

## Learn More

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
