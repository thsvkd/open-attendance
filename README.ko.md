<div align="center">

# 🕐 Open Attendance

### 오픈소스 근태 및 연차 관리 시스템

*직원의 출근, 퇴근, 휴가 등을 체계적으로 관리하고 분석하는 종합 솔루션*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[English](README.md) | [한국어](README.ko.md)

</div>

---

## 📋 목차

- [개요](#-개요)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [빠른 시작](#-빠른-시작)
- [설치 방법](#-설치-방법)
- [환경 설정](#-환경-설정)
- [개발 가이드](#-개발-가이드)
- [배포](#-배포)
- [문서](#-문서)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

---

## 🎯 개요

**Open Attendance**는 중소규모 팀(특히 스타트업)을 위해 설계된 오픈소스 근태 및 연차 관리 시스템입니다. 직원의 출근, 연차 관리, 병가 처리 및 인사이트 리포트 생성을 위한 통합 플랫폼을 제공합니다.

### 왜 Open Attendance인가?

- ✅ **무료 & 오픈소스** - 라이선스 비용 없음, 완전한 투명성
- 🚀 **쉬운 배포** - 자동화 스크립트로 간단한 설정
- 🌏 **다국어 지원** - 한국어와 영어를 기본 지원
- 📊 **종합 리포팅** - 출근 및 휴가 패턴 추적
- 🔒 **보안** - NextAuth.js를 활용한 강력한 인증
- 🎨 **모던 UI** - Tailwind CSS와 Radix UI로 구현한 아름다운 인터페이스

---

## ✨ 주요 기능

### 📅 근태 관리
- **자동 근태 기록** - 모든 근무일(휴일 제외)에 자동 출근 처리
- **결근 기록** - 결근 사유 기록 및 추적
- **유연한 근무 시간** - 다양한 근무 일정 지원

### 🏖️ 연차 관리
- **연차 추적** - 총 연차, 사용 연차, 잔여 연차 모니터링
- **휴가 신청 워크플로우** - 휴가 신청, 승인 및 추적
- **다양한 휴가 유형**:
  - 연차
  - 병가
  - 공가
  - 조퇴
  - 기타 휴가 유형
- **한국 근로기준법 준수** - 한국 연차 규정 적용
- **연차 잔액 대시보드** - 실시간 연차 현황 확인

### 👥 사용자 관리
- **역할 기반 접근 제어**:
  - **관리자** - 전체 시스템 접근 및 관리 권한
  - **일반 사용자** - 개인 근태/연차 데이터 조회 및 관리
- **안전한 인증** - NextAuth.js 기반
- **사용자 프로필** - 개인 정보 및 설정 관리

### 🌐 다국어 지원
- **한국어** - 완전한 한국어 지원
- **영어** - 완전한 영어 번역
- **간편한 언어 전환** - 원활한 언어 전환 기능

---

## 🛠 기술 스택

### 프론트엔드
- **프레임워크**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI 라이브러리**: [React 19](https://reactjs.org/)
- **언어**: [TypeScript 5](https://www.typescriptlang.org/)
- **스타일링**: [Tailwind CSS](https://tailwindcss.com/)
- **컴포넌트**: [Radix UI](https://www.radix-ui.com/)
- **폼**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **다국어**: [next-intl](https://next-intl-docs.vercel.app/)

### 백엔드
- **인증**: [NextAuth.js](https://next-auth.js.org/)
- **데이터베이스**: SQLite (개발) / PostgreSQL (프로덕션)
- **ORM**: [Prisma](https://www.prisma.io/)
- **API**: Next.js API Routes

### DevOps
- **패키지 매니저**: npm
- **코드 품질**: ESLint
- **버전 관리**: Git

---

## 🚀 빠른 시작

몇 분 안에 Open Attendance를 실행하세요!

### 사전 요구사항

- **Node.js** 20.x 이상
- **npm** 10.x 이상
- **Git**

---

## 📦 설치 방법

### 1단계: 저장소 클론

```bash
git clone https://github.com/thsvkd/open-attendance.git
cd open-attendance
```

### 2단계: 자동 설정 스크립트 실행

```bash
./scripts/setup.sh
```

이 스크립트는 다음 작업을 자동으로 수행합니다:
- `.env` 파일 생성 및 `NEXTAUTH_SECRET` 자동 생성
- 의존성 패키지 설치
- Prisma 클라이언트 생성
- 데이터베이스 마이그레이션 실행

### 3단계: 개발 서버 시작

```bash
./scripts/run.sh
```

또는 프로덕션 모드로 실행:

```bash
./scripts/run.sh --prod
```

🎉 브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어보세요!

---

## ⚙️ 환경 설정

### 환경 변수

| 변수 | 설명 | 필수 | 기본값 |
|------|------|------|--------|
| `DATABASE_URL` | 데이터베이스 연결 문자열 | 예 | `file:./prisma/dev.db` |
| `NEXTAUTH_URL` | 애플리케이션 URL | 예 | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth 비밀 키 | 예 | - |

### 데이터베이스 설정

**개발 환경**: SQLite (기본값)
```env
DATABASE_URL="file:./prisma/dev.db"
```

**프로덕션 환경**: PostgreSQL (권장)
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

---

## 💻 개발 가이드

### 개발 서버 실행

```bash
npm run dev
# 또는
./scripts/run.sh
```

### 프로덕션 빌드

```bash
npm run build
npm start
# 또는
./scripts/run.sh --prod
```

### 데이터베이스 관리

**Prisma Studio 실행** (데이터베이스 GUI):
```bash
npx prisma studio
```

**마이그레이션 생성**:
```bash
npx prisma migrate dev --name your_migration_name
```

**데이터베이스 초기화**:
```bash
npx prisma migrate reset
```

### 프로젝트 구조

```
open-attendance/
├── app/                    # Next.js 앱 디렉토리 (페이지 & API 라우트)
│   ├── api/               # API 엔드포인트
│   ├── dashboard/         # 대시보드 페이지
│   └── auth/              # 인증 페이지
├── components/            # React 컴포넌트
│   ├── dashboard/        # 대시보드 전용 컴포넌트
│   └── ui/               # 재사용 가능한 UI 컴포넌트
├── lib/                   # 유틸리티 함수 & 설정
├── messages/             # 다국어 번역 파일
│   ├── en.json           # 영어 번역
│   └── ko.json           # 한국어 번역
├── prisma/               # 데이터베이스 스키마 & 마이그레이션
├── public/               # 정적 에셋
└── scripts/              # 유틸리티 스크립트
```

---

## 🌐 배포

### Vercel에 배포하기 (권장)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thsvkd/open-attendance)

1. 위의 "Deploy" 버튼 클릭
2. 환경 변수 설정
3. 배포!

### 수동 배포

```bash
# 애플리케이션 빌드
npm run build

# 프로덕션 서버 시작
npm start
```

### 프로덕션 환경 설정

1. PostgreSQL 데이터베이스 설정
2. 호스팅 플랫폼에서 환경 변수 구성
3. 데이터베이스 마이그레이션 실행:
   ```bash
   npx prisma migrate deploy
   ```

---

## 📚 문서

- **[기능 상세](FEATURES.md)** - 자세한 기능 문서
- **[API 문서](docs/API.md)** - API 엔드포인트 참조 *(준비 중)*
- **[배포 가이드](docs/DEPLOYMENT.md)** - 배포 지침 *(준비 중)*
- **[기여 가이드](CONTRIBUTING.md)** - 기여 방법 *(준비 중)*

### 유용한 리소스

- [Next.js 문서](https://nextjs.org/docs)
- [Prisma 문서](https://www.prisma.io/docs)
- [NextAuth.js 문서](https://next-auth.js.org/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

---

## 🤝 기여하기

커뮤니티의 기여를 환영합니다!

- 🐛 버그 리포트
- 💡 기능 요청
- 📝 문서 개선
- 🔧 코드 기여

이슈를 열거나 풀 리퀘스트를 자유롭게 제출해주세요.

### 개발 환경 설정

1. 저장소 포크
2. 기능 브랜치 생성: `git checkout -b feature/amazing-feature`
3. 변경사항 커밋: `git commit -m 'Add amazing feature'`
4. 브랜치에 푸시: `git push origin feature/amazing-feature`
5. 풀 리퀘스트 열기

---

## 🐛 문제 해결

### NextAuth 설정 오류

**오류**:
```
[next-auth][warn][NEXTAUTH_URL]
[next-auth][warn][NO_SECRET]
GET /api/auth/error?error=Configuration 500
```

**해결 방법**: 설정 스크립트를 실행하여 환경 변수 구성:
```bash
./scripts/setup.sh
```

### 데이터베이스 연결 문제

**오류**: `Can't reach database server`

**해결 방법**: `.env` 파일의 `DATABASE_URL`을 확인하고 데이터베이스 서버가 실행 중인지 확인하세요.

### 포트가 이미 사용 중

**오류**: `Port 3000 is already in use`

**해결 방법**: 3000번 포트를 사용하는 프로세스를 종료하거나 다른 포트 지정:
```bash
PORT=3001 npm run dev
```

---

## 📄 라이선스

이 프로젝트는 **MIT 라이선스**에 따라 라이선스가 부여됩니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🙏 감사의 말

다음을 사용하여 ❤️로 제작되었습니다:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

---

## 📞 지원

- 🌟 이 저장소가 도움이 되셨다면 스타를 눌러주세요!
- 🐛 [이슈 보고](https://github.com/thsvkd/open-attendance/issues)
- 💬 [토론](https://github.com/thsvkd/open-attendance/discussions)

---

<div align="center">

**[⬆ 맨 위로](#-open-attendance)**

Open Attendance 팀이 ❤️로 만들었습니다

</div>
