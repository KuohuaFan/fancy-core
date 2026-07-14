// 伺服器端強制 RBAC —— 前端只藏 UI，真正的授權以此為準。
// 每個 API route 與 middleware 都必須呼叫 requirePermission()。

export const ROLES = ["所長", "管理員", "律師", "法助", "會計", "顧問"] as const;
export type Role = (typeof ROLES)[number];

export const FEATURES = [
  "存案件", "查卷證", "PDF標註", "查法律", "寫書狀", "存證信函",
  "範本庫", "工作流", "分層權限", "行事曆", "收發文", "報稅", "計費",
] as const;
export type Feature = (typeof FEATURES)[number];

// 預設矩陣（可被 DB 中的 Permission 覆寫）
const DEFAULTS: Record<Role, Feature[]> = {
  所長: [...FEATURES],
  管理員: [...FEATURES],
  律師: ["存案件", "查卷證", "PDF標註", "查法律", "寫書狀", "存證信函", "範本庫", "工作流", "行事曆"],
  法助: ["存案件", "查卷證", "PDF標註", "範本庫", "工作流", "行事曆"],
  會計: ["收發文", "報稅", "行事曆"],
  顧問: ["查卷證", "查法律"],
};

// 不可移除的鎖定角色（治理：所長/管理員永遠具全權）
export const LOCKED_ROLES: Role[] = ["所長", "管理員"];

/** 純函式判斷；overrides 為該所自 DB 讀出的 {feature: {role: allowed}} */
export function hasPermission(
  role: Role,
  feature: Feature,
  overrides?: Record<string, Record<string, boolean>>,
): boolean {
  if (LOCKED_ROLES.includes(role)) return true;
  const o = overrides?.[feature]?.[role];
  if (typeof o === "boolean") return o;
  return DEFAULTS[role]?.includes(feature) ?? false;
}

/** route handler 內使用；無權則丟出 403 */
export class ForbiddenError extends Error {
  status = 403;
  constructor(feature: Feature) {
    super(`缺少「${feature}」權限`);
  }
}

export function requirePermission(
  role: Role,
  feature: Feature,
  overrides?: Record<string, Record<string, boolean>>,
): void {
  if (!hasPermission(role, feature, overrides)) throw new ForbiddenError(feature);
}
