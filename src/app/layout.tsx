export const metadata = { title: "Fancy AI™", description: "專為律所打造的 AI 智慧管理系統" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="zh-TW"><body style={{ margin: 0 }}>{children}</body></html>);
}
