// lib/plans.ts
export type PlanId = "free" | "pro" | "pro_plus";

export const PLANS: Record<PlanId, {
  name: string;
  monthly?: number;   // 單位：TWD
  yearly?: number;    // 單位：TWD
  dailyFreeChats: number;
  allowExport: boolean;     // 是否允許 PDF/PPT 匯出
  allowRAG: boolean;        // 是否允許私有知識庫上傳與問答
}> = {
  free: {
    name: "Free",
    dailyFreeChats: 3,
    monthly: 0,
    allowExport: false,
    allowRAG: false
  },
  pro: {
    name: "Pro",
    dailyFreeChats: 999,
    monthly: 490,
    yearly: 4900,
    allowExport: true,
    allowRAG: false
  },
  pro_plus: {
    name: "Pro+",
    dailyFreeChats: 999,
    monthly: 890,
    yearly: 8900,
    allowExport: true,
    allowRAG: true
  }
};
