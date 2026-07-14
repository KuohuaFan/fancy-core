// 一鍵灌入示範資料：npm run db:seed
// 可重複執行（先清空 demo 事務所資料再重建）。
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { ROLES, FEATURES } from "../src/lib/rbac";

const prisma = new PrismaClient();
const FIRM_ID = "demo-firm";
const d = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };

// 與 rbac.ts 同一組預設矩陣
const PRESET: Record<string, string[]> = {
  所長: [...FEATURES],
  管理員: [...FEATURES],
  律師: ["存案件", "查卷證", "PDF標註", "查法律", "寫書狀", "存證信函", "範本庫", "工作流", "行事曆", "計費"],
  法助: ["存案件", "查卷證", "PDF標註", "範本庫", "工作流", "行事曆"],
  會計: ["收發文", "報稅", "行事曆", "計費"],
  顧問: ["查卷證", "查法律"],
};

async function main() {
  // 事務所
  await prisma.firm.upsert({
    where: { id: FIRM_ID },
    update: { name: "示範法律事務所" },
    create: { id: FIRM_ID, name: "示範法律事務所" },
  });

  // 清空舊資料（依外鍵順序）
  await prisma.draft.deleteMany({ where: { case: { firmId: FIRM_ID } } });
  await prisma.notice.deleteMany({ where: { case: { firmId: FIRM_ID } } });
  await prisma.task.deleteMany({ where: { case: { firmId: FIRM_ID } } });
  await prisma.ledgerEntry.deleteMany({ where: { firmId: FIRM_ID } });
  await prisma.calendarEvent.deleteMany({ where: { firmId: FIRM_ID } });
  await prisma.document.deleteMany({ where: { case: { firmId: FIRM_ID } } });
  await prisma.case.deleteMany({ where: { firmId: FIRM_ID } });
  await prisma.permission.deleteMany({ where: { firmId: FIRM_ID } });
  await prisma.user.deleteMany({ where: { firmId: FIRM_ID } });

  // 使用者
  const people = [
    { name: "范國華", role: "所長" },
    { name: "陳律師", role: "律師" },
    { name: "林法助", role: "法助" },
    { name: "王會計", role: "會計" },
    { name: "周顧問", role: "顧問" },
    { name: "李管理", role: "管理員" },
  ];
  const users: Record<string, string> = {};
  // 示範密碼：由環境變數 SEED_PASSWORD 指定；未指定則用 demo1234（僅供本機示範）
  const seedPw = process.env.SEED_PASSWORD ?? "demo1234";
  const pwHash = await hashPassword(seedPw);
  for (let i = 0; i < people.length; i++) {
    const u = await prisma.user.create({
      data: {
        firmId: FIRM_ID,
        name: people[i].name,
        role: people[i].role,
        email: `user${i + 1}@demo.example`,
        passwordHash: pwHash,        // ⚠ 正式部署請改為各自的強密碼
      },
    });
    users[people[i].name] = u.id;
  }

  // 權限矩陣
  const perms = FEATURES.flatMap((f) =>
    ROLES.map((r) => ({ firmId: FIRM_ID, feature: f, role: r, allowed: PRESET[r].includes(f) })),
  );
  await prisma.permission.createMany({ data: perms });

  // 案件（含事實）
  const cases = [
    { key: "c1", title: "李嘉恆 訴 方宜文 離婚事件", type: "家事", status: "進行中", client: "李嘉恆", opponent: "方宜文", court: "臺灣新竹地方法院", caseNo: "114年度婚字第58號",
      facts: "兩造於民國105年結婚，育有一女（現9歲）。近三年被告長期夜歸、對原告言語羞辱並拒絕同居，兩造已分居逾一年。原告主張婚姻難以維持，請求判准離婚並酌定未成年子女權利義務由原告單獨行使。" },
    { key: "c2", title: "宏達科技 承攬報酬給付事件", type: "契約", status: "進行中", client: "宏達精密", opponent: "崇越工程", court: "臺灣新竹地方法院", caseNo: "114年度訴字第412號",
      facts: "原告依承攬契約完成廠務配管工程，被告以驗收瑕疵為由拒付尾款新臺幣380萬元。原告主張已依約完工並補正，被告受領遲延。" },
    { key: "c3", title: "顏○○ 侵害著作權事件", type: "智財", status: "進行中", client: "翊碩文創", opponent: "顏○○", court: "智慧財產及商業法院", caseNo: "114年度民著訴字第31號",
      facts: "被告未經授權重製並公開傳輸原告享有著作權之攝影著作共42幅於其商業網站，原告請求損害賠償及排除侵害。" },
    { key: "c4", title: "綠源生技 常年法律顧問", type: "顧問", status: "顧問", client: "綠源生技", opponent: null, court: null, caseNo: "NDA/勞動/股權審閱", facts: "常年顧問：合約審閱、勞動法遵、股權架構諮詢。" },
    { key: "c5", title: "吳先生 遺產分割諮詢", type: "諮詢", status: "諮詢", client: "吳先生", opponent: null, court: null, caseNo: "初次諮詢", facts: "諮詢遺產分割與特留分計算，尚未委任。" },
  ];
  const caseIds: Record<string, string> = {};
  for (const c of cases) {
    const { key, ...data } = c;
    const created = await prisma.case.create({ data: { firmId: FIRM_ID, ...data } });
    caseIds[key] = created.id;
  }

  // 卷證
  await prisma.document.createMany({ data: [
    { caseId: caseIds.c1, name: "起訴狀.pdf", size: 1_260_000, storeKey: "demo/c1/complaint.pdf" },
    { caseId: caseIds.c1, name: "戶籍謄本.pdf", size: 340_000, storeKey: "demo/c1/household.pdf" },
    { caseId: caseIds.c2, name: "承攬契約書.pdf", size: 860_000, storeKey: "demo/c2/contract.pdf" },
    { caseId: caseIds.c3, name: "侵權網頁存證.pdf", size: 3_400_000, storeKey: "demo/c3/evidence.pdf" },
  ]});

  // 任務
  await prisma.task.createMany({ data: [
    { caseId: caseIds.c1, title: "完成家事準備書狀初稿", assigneeId: users["陳律師"], dueDate: d(-2), done: false },
    { caseId: caseIds.c1, title: "整理對話紀錄時序表", assigneeId: users["林法助"], dueDate: d(1), done: false },
    { caseId: caseIds.c2, title: "聲請調閱驗收會議紀錄", assigneeId: users["陳律師"], dueDate: d(3), done: false },
    { caseId: caseIds.c3, title: "公證侵權網頁存證", assigneeId: users["林法助"], dueDate: d(-5), done: true },
    { caseId: caseIds.c2, title: "計算遲延利息", assigneeId: users["王會計"], dueDate: d(5), done: false },
  ]});

  // 收發文雜費
  await prisma.ledgerEntry.createMany({ data: [
    { firmId: FIRM_ID, caseId: caseIds.c1, date: d(-9), kind: "收文", desc: "新竹地院 開庭通知（婚字58號）", amount: 0 },
    { firmId: FIRM_ID, caseId: caseIds.c1, date: d(-7), kind: "代墊", desc: "裁判費", amount: 3300 },
    { firmId: FIRM_ID, caseId: caseIds.c3, date: d(-6), kind: "代墊", desc: "公證費（侵權存證）", amount: 2500 },
    { firmId: FIRM_ID, caseId: caseIds.c2, date: d(-4), kind: "發文", desc: "民事準備書狀 遞狀", amount: 0 },
    { firmId: FIRM_ID, caseId: caseIds.c2, date: d(-3), kind: "雜費", desc: "影印裝訂", amount: 680 },
    { firmId: FIRM_ID, caseId: caseIds.c3, date: d(-1), kind: "代墊", desc: "郵寄存證信函", amount: 260 },
  ]});

  // 行事曆
  await prisma.calendarEvent.createMany({ data: [
    { firmId: FIRM_ID, caseId: caseIds.c1, title: "婚字58號 言詞辯論庭", type: "開庭", startsAt: d(4) },
    { firmId: FIRM_ID, caseId: caseIds.c2, title: "承攬案 準備程序", type: "開庭", startsAt: d(9) },
    { firmId: FIRM_ID, caseId: caseIds.c3, title: "著作權案 上訴期間屆滿", type: "期限", startsAt: d(12) },
    { firmId: FIRM_ID, caseId: caseIds.c4, title: "綠源生技 月度顧問會議", type: "會議", startsAt: d(6) },
  ]});

  console.log("✓ 示範資料已灌入：1 事務所、6 使用者、", perms.length, "筆權限、", cases.length, "件案件。");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
