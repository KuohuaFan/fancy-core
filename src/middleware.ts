// 路由保護：未登入導向 /login。
// 真正的權限強制在各 API route 內（getCtx → requirePermission），此處僅為 UX 導向。
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|standalone).*)"],
};
