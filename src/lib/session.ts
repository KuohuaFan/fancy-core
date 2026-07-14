// 從 Auth.js session 取得目前使用者。
//
// ⚠ 安全要點：身分一律由「伺服器端驗證過的 session（JWT，經 AUTH_SECRET 簽章）」解出，
//   不再信任任何請求標頭。先前的 x-user-id 模式可被任意偽造，已完全移除。
//   角色與 firmId 每次都回資料庫覆核，確保停權／改權即時生效。
import { auth } from "./auth";
import { prisma } from "./prisma";
import type { Role } from "./rbac";

export interface Ctx { userId: string; firmId: string; role: Role; }

export async function getCtx(_req?: Request): Promise<Ctx> {
  const session = await auth();
  const su = session?.user as unknown as { id?: string } | undefined;
  if (!su?.id) throw Object.assign(new Error("未登入"), { status: 401 });

  // 以資料庫為準（token 可能過期／使用者可能已停權或改角色）
  const u = await prisma.user.findUnique({ where: { id: su.id } });
  if (!u) throw Object.assign(new Error("使用者不存在"), { status: 401 });

  return { userId: u.id, firmId: u.firmId, role: u.role as Role };
}

export async function loadPerms(firmId: string) {
  const rows = await prisma.permission.findMany({ where: { firmId } });
  const m: Record<string, Record<string, boolean>> = {};
  for (const r of rows) (m[r.feature] ??= {})[r.role] = r.allowed;
  return m;
}
