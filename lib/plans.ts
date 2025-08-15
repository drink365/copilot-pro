// lib/plans.ts
export type PlanId = "free" | "pro" | "pro_plus"

export const PLANS: Record<PlanId, {
  name: string
  monthly?: number
  yearly?: number
  dailyFreeChats: number
  allowExport: boolean
  allowRAG: boolean
}> = {
  free: { name: "Free", monthly: 0, dailyFreeChats: 3, allowExport: false, allowRAG: false },
  pro: { name: "Pro", monthly: 490, yearly: 4900, dailyFreeChats: 999, allowExport: true, allowRAG: false },
  pro_plus: { name: "Pro+", monthly: 890, yearly: 8900, dailyFreeChats: 999, allowExport: true, allowRAG: true }
}
