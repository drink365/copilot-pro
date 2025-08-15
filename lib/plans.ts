// lib/plans.ts
export type PlanId = "free" | "pro" | "pro_plus";

export const PLANS: Record<PlanId, {
  name: string;
  monthly?: number;   // TWD
  yearly?: number;    // TWD
  dailyFreeChats: number;
  allowExport: boolean;     // PDF/PPT
  allowRAG: boolean;        // 私有知識庫
}> = {
  free:    { name: "Free",    dailyFreeChats: 3,  monthly: 0,    allowExport: false, allowRAG: false },
  pro:     { name: "Pro",     dailyFreeChats: 999, monthly: 490, yearly: 4900, allowExport: true, allowRAG: false },
  pro_plus:{ name: "Pro+",    dailyFreeChats: 999, monthly: 890, yearly: 8900, allowExport: true, allowRAG: true  },
}
