// Auth.js（NextAuth v5）—— 真正的身分驗證。
// 取代先前的 x-user-id 標頭示範模式（該模式可被偽造，已移除）。
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "事務所帳號",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const u = await prisma.user.findUnique({ where: { email } });
        if (!u || !u.passwordHash) return null;              // 無此人或未設密碼 → 拒絕

        const ok = await verifyPassword(password, u.passwordHash);
        if (!ok) return null;                                 // 密碼錯 → 拒絕

        return { id: u.id, name: u.name, email: u.email, firmId: u.firmId, role: u.role };
      },
    }),
  ],
});
