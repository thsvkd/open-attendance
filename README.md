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
- HTTPS 설정 여부 선택 (선택 사항)
  - Let's Encrypt를 통한 SSL 인증서 자동 발급
  - Nginx 리버스 프록시 설정
  - 자동 인증서 갱신 설정
- 의존성 패키지 설치 (`npm install`)
- Prisma 클라이언트 생성
- 데이터베이스 마이그레이션 실행

#### HTTPS 설정 (프로덕션 환경 권장)

초기 설정 중 HTTPS를 활성화하려면:
1. 유효한 도메인 이름이 필요합니다 (예: attendance.example.com)
2. 해당 도메인이 서버 IP를 가리키도록 DNS를 설정해야 합니다
3. 포트 80과 443이 인터넷에서 접근 가능해야 합니다
4. setup.sh 실행 시 HTTPS 활성화를 선택하고 도메인과 이메일을 입력합니다

**나중에 HTTPS를 설정하려면:**
```bash
./scripts/setup-https.sh
```

### 2. 개발 서버 실행

```bash
./scripts/run.sh
```

또는 직접 npm 명령어 사용:

```bash
npm run dev
```

서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 접속할 수 있습니다.

**HTTPS가 활성화된 경우:** 설정한 도메인(예: https://attendance.example.com)으로 접속하세요.

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

# HTTPS 설정 (선택 사항)
USE_HTTPS="false"
DOMAIN=""
```

### HTTPS 설정

프로덕션 환경에서 HTTPS를 사용하려면:
- `USE_HTTPS="true"` 로 설정
- `DOMAIN`에 도메인 이름 지정 (예: "attendance.example.com")
- `NEXTAUTH_URL`을 HTTPS URL로 변경 (예: "https://attendance.example.com")

또는 `./scripts/setup.sh` 또는 `./scripts/setup-https.sh`를 실행하여 자동으로 설정할 수 있습니다.

## 보안 및 인증서

### SSL 인증서 자동 갱신

HTTPS를 활성화하면 Let's Encrypt 인증서가 자동으로 갱신되도록 cron job이 설정됩니다:
- 매일 오전 3시에 인증서 갱신 확인
- 갱신이 필요한 경우 자동으로 갱신
- 로그는 `/var/log/ssl-renewal.log`에 저장

수동으로 인증서를 갱신하려면:
```bash
./scripts/renew-ssl.sh
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

### HTTPS 인증서 발급 실패

Let's Encrypt 인증서 발급이 실패하는 경우:

**원인:**
- 도메인 DNS가 올바르게 설정되지 않음
- 포트 80/443이 방화벽에 의해 차단됨
- 도메인이 서버 IP를 정확히 가리키지 않음

**해결 방법:**
1. DNS 설정 확인: `nslookup your-domain.com`
2. 방화벽 설정 확인:
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   ```
3. Nginx 상태 확인: `sudo systemctl status nginx`
4. 인증서 재발급 시도: `./scripts/setup-https.sh`

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
