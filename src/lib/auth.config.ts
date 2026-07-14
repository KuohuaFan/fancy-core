// Auth.js 邊緣安全設定（middleware 用）—— 此檔不得引入 Prisma（Edge Runtime 不支援）
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    // middleware 的授權判斷
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname.startsWith("/login") ||
        // API 由各 route 的 getCtx／RBAC 回傳 401/403；middleware 只負責頁面 UX 導向。
        pathname.startsWith("/api/") ||
        pathname.startsWith("/standalone") ||   // 前端靜態頁自行處理登入
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";
      if (isPublic) return true;
      return !!auth?.user;
    },
    // 把 firmId / role 寫進 JWT
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; firmId: string; role: string };
        token.uid = u.id;
        token.firmId = u.firmId;
        token.role = u.role;
      }
      return token;
    },
    // 把 JWT 內容放回 session
    session({ session, token }) {
      if (session.user) {
        const su = session.user as unknown as Record<string, unknown>;
        su.id = token.uid;
        su.firmId = token.firmId;
        su.role = token.role;
      }
      return session;
    },
  },
  providers: [], // 於 auth.ts 補上（Credentials 需要 Prisma，不能放在 Edge）
} satisfies NextAuthConfig;
