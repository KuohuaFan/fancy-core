// 密碼雜湊 —— 使用 Node 內建 crypto.scrypt（零依賴，不需 bcrypt 原生編譯）
// scrypt 為 RFC 7914 之密碼衍生函式，具記憶體硬度，適合密碼儲存。
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt) as (
  password: string, salt: string, keylen: number
) => Promise<Buffer>;

const KEYLEN = 64;

/** 產生 "salt:hash"（皆為 hex） */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(plain, salt, KEYLEN);
  return `${salt}:${key.toString("hex")}`;
}

/** 以 timing-safe 方式比對 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored || !stored.includes(":")) return false;
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(plain, salt, KEYLEN);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
