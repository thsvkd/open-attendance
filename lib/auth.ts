import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "user@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          return null;
        }

        // Return user object with all necessary fields for JWT
        return {
          id: String(user.id),
          name: user.name || "",
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 상대 경로면 현재 baseUrl과 결합
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // 같은 origin이면 url 사용
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // 그 외는 baseUrl로 리다이렉트
      return baseUrl;
    },
    async session({ token, session }) {
      // Add JWT token data to session
      if (token && typeof token === "object") {
        if (session.user) {
          session.user.id = (token.id as string) || "";
          session.user.name = (token.name as string) || undefined;
          session.user.email = (token.email as string) || "";
          (session.user as Record<string, unknown>).role =
            (token.role as string) || "USER";
        }
      }

      return session;
    },
    async jwt({ token, user }) {
      // On initial sign-in, user object is available
      if (user && typeof user === "object") {
        const userRecord = user as unknown as Record<string, unknown>;
        const userId = (userRecord.id || userRecord.id) as string;
        if (!userId) {
          console.error(
            "User object missing id field during JWT creation",
            user,
          );
          return token;
        }

        token.id = userId;
        token.name = (userRecord.name as string) || "";
        token.email = (userRecord.email as string) || "";
        token.role = (userRecord.role as string) || "USER";

        return token;
      }

      // On subsequent requests, refresh user data from database using ID
      // This ensures email changes are properly reflected
      if (token && token.id && typeof token.id === "string") {
        const dbUser = await db.user.findUnique({
          where: {
            id: token.id,
          },
        });

        if (dbUser) {
          return {
            id: String(dbUser.id),
            name: dbUser.name || "",
            email: dbUser.email,
            role: dbUser.role,
          };
        }
      }

      // If user not found, return existing token
      return token;
    },
  },
};
