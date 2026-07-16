// 登入頁（Auth.js Credentials）。自建部署時由 middleware 導向此頁。
import { redirect } from "next/navigation";
import { signIn, auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/standalone/index.html");

  async function doLogin(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirectTo: "/standalone/index.html",
      });
    } catch (e) {
      // Auth.js 以拋出 redirect 完成導向；其餘為登入失敗
      if ((e as Error).message?.includes("NEXT_REDIRECT")) throw e;
      redirect("/login?error=1");
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#FBF8F1", fontFamily: "system-ui, sans-serif" }}>
      <form action={doLogin} style={{ width: 340, background: "#fff", padding: 28, borderRadius: 18, border: "1px solid #EDE4D3" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ background: "#C1272D", color: "#fff", borderRadius: 8, width: 30, height: 30, display: "grid", placeItems: "center", fontWeight: 900, fontFamily: "Georgia, serif" }}>F</span>
          <b style={{ fontSize: 20, fontFamily: "Georgia, serif" }}>Fancy AI™</b>
        </div>
        <p style={{ color: "#7E7263", fontSize: 13, margin: "0 0 18px" }}>專為律所打造的 AI 智慧管理系統</p>

        <label style={{ fontSize: 12.5, fontWeight: 700 }}>Email</label>
        <input name="email" type="email" required autoComplete="username"
          style={{ width: "100%", padding: "10px 12px", margin: "6px 0 14px", border: "1px solid #EDE4D3", borderRadius: 10 }} />

        <label style={{ fontSize: 12.5, fontWeight: 700 }}>密碼</label>
        <input name="password" type="password" required autoComplete="current-password"
          style={{ width: "100%", padding: "10px 12px", margin: "6px 0 18px", border: "1px solid #EDE4D3", borderRadius: 10 }} />

        <button type="submit"
          style={{ width: "100%", padding: "11px 0", background: "#C1272D", color: "#fff", border: 0, borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
          登入
        </button>

        <p style={{ fontSize: 11, color: "#9A8F7E", marginTop: 14, lineHeight: 1.6 }}>
          身分由伺服器端 session 驗證（JWT，經 AUTH_SECRET 簽章）。<br />
          <a href="https://www.lawplus.com.tw/" target="_blank" rel="noopener noreferrer" style={{ color: "#C1272D", fontWeight: 700, textDecoration: "none" }}>
            Powered by FancyAI | SuitAI
          </a>
        </p>
      </form>
    </main>
  );
}
