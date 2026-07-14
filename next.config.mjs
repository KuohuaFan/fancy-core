/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",   // 供 Docker 產生 .next/standalone/server.js
  // ⚠ 不設 serverActions.allowedOrigins:["*"] —— 那會關閉 Server Action 的
  //   來源檢查（CSRF 防護）。若部署於反向代理之後，請改用環境變數指定實際網域：
  //   experimental: { serverActions: { allowedOrigins: [process.env.APP_ORIGIN] } }
};
export default nextConfig;
