// app/tax/page.tsx
"use client"

import { useState } from "react"

type EstateReq = {
  type: "estate"
  gross_estate: number
  debts?: number
  funeral_expense?: number
  life_insurance_payout?: number
  spouse_count?: number
  lineal_descendants?: number
  lineal_ascendants?: number
  disabled_count?: number
  other_dependents?: number
}
type GiftReq = {
  type: "gift"
  gifts_amount: number
  spouse_split?: boolean
  minor_children?: number
}
type Resp = {
  ok: boolean
  result?: {
    version: any
    inputs: any
    currency: string
    computed: any
  }
  error?: string
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
      {children}
    </section>
  )
}

export default function TaxPage() {
  const [estate, setEstate] = useState<EstateReq>({
    type: "estate",
    gross_estate: 0, debts: 0, funeral_expense: 0, life_insurance_payout: 0,
    spouse_count: 0, lineal_descendants: 0, lineal_ascendants: 0, disabled_count: 0, other_dependents: 0
  })
  const [gift, setGift] = useState<GiftReq>({ type: "gift", gifts_amount: 0, spouse_split: false, minor_children: 0 })
  const [estateResp, setEstateResp] = useState<Resp | null>(null)
  const [giftResp, setGiftResp] = useState<Resp | null>(null)

  async function post<T>(body: any): Promise<T> {
    const r = await fetch("/api/tax/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    return r.json()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <Section title="遺產稅試算">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm">遺產總額（TWD）
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.gross_estate}
              onChange={e => setEstate({ ...estate, gross_estate: Number(e.target.value) })} />
          </label>
          <label className="text-sm">喪葬費
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.funeral_expense}
              onChange={e => setEstate({ ...estate, funeral_expense: Number(e.target.value) })} />
          </label>
          <label className="text-sm">債務
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.debts}
              onChange={e => setEstate({ ...estate, debts: Number(e.target.value) })} />
          </label>
          <label className="text-sm">壽險給付
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.life_insurance_payout}
              onChange={e => setEstate({ ...estate, life_insurance_payout: Number(e.target.value) })} />
          </label>
          <label className="text-sm">配偶人數
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.spouse_count}
              onChange={e => setEstate({ ...estate, spouse_count: Number(e.target.value) })} />
          </label>
          <label className="text-sm">直系卑親屬人數
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.lineal_descendants}
              onChange={e => setEstate({ ...estate, lineal_descendants: Number(e.target.value) })} />
          </label>
          <label className="text-sm">直系尊親屬人數
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.lineal_ascendants}
              onChange={e => setEstate({ ...estate, lineal_ascendants: Number(e.target.value) })} />
          </label>
          <label className="text-sm">身心障礙人數
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.disabled_count}
              onChange={e => setEstate({ ...estate, disabled_count: Number(e.target.value) })} />
          </label>
          <label className="text-sm">其他撫養人數
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={estate.other_dependents}
              onChange={e => setEstate({ ...estate, other_dependents: Number(e.target.value) })} />
          </label>
        </div>
        <div className="mt-3">
          <button
            className="rounded bg-sky-600 text-white px-4 py-2 text-sm hover:bg-sky-700"
            onClick={async () => setEstateResp(await post<Resp>(estate))}
          >計算</button>
        </div>
        {estateResp?.ok && estateResp.result && (
          <div className="mt-4 text-sm">
            <div className="font-medium">結果</div>
            <ul className="list-disc pl-6">
              <li>適用版本：{estateResp.result.version.effective_from} ～ {estateResp.result.version.effective_to}</li>
              <li>應稅基：{estateResp.result.computed.taxable_base.toLocaleString()} {estateResp.result.currency}</li>
              <li>稅率/級距：{(estateResp.result.computed.rate_applied * 100).toFixed(0)}%</li>
              <li>稅額：{estateResp.result.computed.tax_due.toLocaleString()} {estateResp.result.currency}</li>
            </ul>
          </div>
        )}
      </Section>

      <Section title="贈與稅試算">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm">贈與總額（TWD）
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={gift.gifts_amount}
              onChange={e => setGift({ ...gift, gifts_amount: Number(e.target.value) })} />
          </label>
          <label className="text-sm">夫妻合贈分攤
            <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={gift.spouse_split ? "Y" : "N"}
              onChange={e => setGift({ ...gift, spouse_split: e.target.value === "Y" })}>
              <option value="N">否</option>
              <option value="Y">可</option>
            </select>
          </label>
          <label className="text-sm">未成年子女人數
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              type="number" value={gift.minor_children}
              onChange={e => setGift({ ...gift, minor_children: Number(e.target.value) })} />
          </label>
        </div>
        <div className="mt-3">
          <button
            className="rounded bg-sky-600 text-white px-4 py-2 text-sm hover:bg-sky-700"
            onClick={async () => setGiftResp(await post<Resp>(gift))}
          >計算</button>
        </div>
        {giftResp?.ok && giftResp.result && (
          <div className="mt-4 text-sm">
            <div className="font-medium">結果</div>
            <ul className="list-disc pl-6">
              <li>適用版本：{giftResp.result.version.effective_from} ～ {giftResp.result.version.effective_to}</li>
              <li>應稅基：{giftResp.result.computed.taxable_base.toLocaleString()} {giftResp.result.currency}</li>
              <li>稅率/級距：{(giftResp.result.computed.rate_applied * 100).toFixed(0)}%</li>
              <li>稅額：{giftResp.result.computed.tax_due.toLocaleString()} {giftResp.result.currency}</li>
            </ul>
          </div>
        )}
      </Section>

      <div className="text-xs text-gray-500">
        ※ 本試算工具以你專案 <code>/data/tax/</code> 的版本設定為準，實務申報仍以主管機關最新公告為依據。
      </div>
    </div>
  )
}
