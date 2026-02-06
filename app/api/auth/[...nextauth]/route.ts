import { authOptions } from "@/lib/auth";
import NextAuth, { type NextAuthOptions } from "next-auth";
import { type NextRequest } from "next/server";

// 현재 요청의 호스트를 기반으로 baseURL을 동적으로 계산
function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  // 폴백 (환경 변수가 설정된 경우)
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

// 런타임에 baseURL을 주입하여 authOptions를 생성
function getAuthOptionsWithBaseUrl(req: NextRequest): NextAuthOptions {
  const baseUrl = getBaseUrl(req);

  return {
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      redirect: async ({ url }) => {
        // 항상 현재 요청의 호스트를 사용
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          return url;
        }
        return baseUrl;
      },
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = async (req: NextRequest, ctx: any) => {
  const options = getAuthOptionsWithBaseUrl(req);
  return NextAuth(options)(req, ctx);
};

export { handler as GET, handler as POST };
