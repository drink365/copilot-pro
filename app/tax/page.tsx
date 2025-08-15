// app/tax/page.tsx
"use client";

import { useState } from "react";

type EstimateResponse = {
  ok: boolean;
  result?: {
    version: {
      effective_from?: string;
      effective_to?: string;
      is_demo?: boolean;
      sources?: { title: string; url: string }[];
    };
    inputs: any;
    currency: string;
    computed: {
      basic_exemptions_total?: number;
      funeral_expense_allowed?: number;
      life_insurance_exempted?: number;
      debts_allowed?: number;
      taxable_base: number;
      rate_applied: number;
      bracket_index: number;
      tax_due: number;
      // gift:
      annual_exclusion_applied?: number;
      minor_children_exclusion_total?: number;
    };
  };
  error?: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "0",
  min = 0,
  step = 1,
}: {
  label: string;
  value: number | string;
  onChange: (v: number) => void;
  placeholder?: string;
  min?: number;
  step?: number;
}) {
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        className="w-48 rounded-xl border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={value}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value || 0))}
      />
    </label>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

export default function TaxPage() {
  const [tab, setTab] = useState<"estate" | "gift">("estate");

  // 遺產稅 inputs
  const [grossEstate, setGrossEstate] = useState<number>(0);
  const [debts, setDebts] = useState<number>(0);
  const [funeral, setFuneral] = useState<number>(0);
  const [lifeIns, setLifeIns] = useState<number>(0);
  const [spouse, setSpouse] = useState<number>(0); // 0/1
  const [desc, setDesc] = useState<number>(0);
  const [asc, setAsc] = useState<number>(0); // 尊親屬人數（程式會自動以版本上限2人計）
  const [disabled, setDisabled] = useState<number>(0);
  const [others, setOthers] = useState<number>(0);

  // 贈與稅 inputs
  const [giftsAmount, setGiftsAmount] = useState<number>(0);
  const [spouseSplit, setSpouseSplit] = useState<boolean>(false);
  const [minorChildren, setMinorChildren] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [resp, setResp] = useState<EstimateResponse | null>(null);
  const [err, setErr] = useState<string>("");

  async function submit() {
    try {
      setLoading(true);
      setErr("");
      setResp(null);

      const payload =
        tab === "estate"
          ? {
              type: "estate",
              gross_estate: grossEstate,
              debts,
              funeral_expense: funeral,
              life_insurance_payout: lifeIns,
              spouse_count: spouse,
              lineal_descendants: desc,
              lineal_ascendants: asc,
              disabled_count: disabled,
              other_dependents: others,
            }
          : {
              type: "gift",
              gifts_amount: giftsAmount,
              spouse_split: spouseSplit,
              minor_children: minorChildren,
            };

      const r = await fetch("/api/tax/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: EstimateResponse = await r.json();
      if (!data.ok) {
        setErr(data.error || "試算失敗");
      }
      setResp(data);
    } catch (e: any) {
      setErr(e?.message || "發生未知錯誤");
    } finally {
      setLoading(false);
    }
  }

  const result = resp?.result;
  const fmt = (n?: number) =>
    typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString() : "-";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">台灣｜遺產／贈與 稅務試算</h1>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-full text-sm ${
              tab === "estate"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setTab("estate")}
          >
            遺產稅
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm ${
              tab === "gift"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setTab("gift")}
          >
            贈與稅
          </button>
        </div>
      </div>

      {tab === "estate" ? (
        <Section title="輸入條件（遺產稅）">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Field label="遺產總額（TWD）" value={grossEstate} onChange={setGrossEstate} />
              <Field label="債務（TWD）" value={debts} onChange={setDebts} />
              <Field label="喪葬費（TWD）" value={funeral} onChange={setFuneral} />
              <Field label="壽險給付（TWD）" value={lifeIns} onChange={setLifeIns} />
            </div>
            <div>
              <Field label="配偶人數（0或1）" value={spouse} onChange={setSpouse} />
              <Field label="直系卑親屬人數" value={desc} onChange={setDesc} />
              <Field label="直系尊親屬人數（最多2人）" value={asc} onChange={setAsc} />
              <Field label="身心障礙人數" value={disabled} onChange={setDisabled} />
              <Field label="其他撫養人數" value={others} onChange={setOthers} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={submit}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
            >
              {loading ? "計算中…" : "開始試算"}
            </button>
            <Pill>免稅與級距以資料庫版本為準</Pill>
          </div>
        </Section>
      ) : (
        <Section title="輸入條件（贈與稅）">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Field label="本年度贈與總額（TWD）" value={giftsAmount} onChange={setGiftsAmount} />
            </div>
            <div>
              <label className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  checked={spouseSplit}
                  onChange={(e) => setSpouseSplit(e.target.checked)}
                />
                <span className="text-sm text-gray-700">夫妻合贈（目前版本不加倍免稅）</span>
              </label>
              <Field label="未成年子女人數（若有額外免稅）" value={minorChildren} onChange={setMinorChildren} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={submit}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
            >
              {loading ? "計算中…" : "開始試算"}
            </button>
            <Pill>年度免稅與級距以資料庫版本為準</Pill>
          </div>
        </Section>
      )}

      {err && (
        <div className="text-red-600 text-sm">
          ⚠️ {err}
        </div>
      )}

      {result && (
        <Section title="試算結果">
          <div className="flex flex-wrap gap-2 mb-4">
            <Pill>適用期間：{result.version.effective_from || "未標註"} — {result.version.effective_to || "未標註"}</Pill>
            {result.version.is_demo && <Pill>示例版本（請覆核）</Pill>}
            <Pill>幣別：{result.currency}</Pill>
            <Pill>適用稅率：{(result.computed.rate_applied * 100).toFixed(0)}%</Pill>
            <Pill>適用級距：{result.computed.bracket_index >= 0 ? `第 ${result.computed.bracket_index + 1} 級` : "—"}</Pill>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {"basic_exemptions_total" in result.computed && (
                  <tr>
                    <td className="py-2 pr-4 text-gray-600">基本免稅/扣除合計</td>
                    <td className="py-2 text-right">{fmt(result.computed.basic_exemptions_total)}</td>
                  </tr>
                )}
                {"funeral_expense_allowed" in result.computed && (
                  <tr>
                    <td className="py-2 pr-4 text-gray-600">喪葬費（核准額）</td>
                    <td className="py-2 text-right">{fmt(result.computed.funeral_expense_allowed)}</td>
                  </tr>
                )}
                {"life_insurance_exempted" in result.computed && (
                  <tr>
                    <td className="py-2 pr-4 text-gray-600">壽險給付（免稅額）</td>
                    <td className="py-2 text-right">{fmt(result.computed.life_insurance_exempted)}</td>
                  </tr>
                )}
                {"debts_allowed" in result.computed && (
                  <tr>
                    <td className="py-2 pr-4 text-gray-600">債務（核準扣除）</td>
                    <td className="py-2 text-right">{fmt(result.computed.debts_allowed)}</td>
                  </tr>
                )}

                {"annual_exclusion_applied" in result.computed && (
                  <tr>
                    <td className="py-2 pr-4 text-gray-600">年度免稅（贈與）</td>
                    <td className="py-2 text-right">{fmt(result.computed.annual_exclusion_applied)}</td>
                  </tr>
                )}
                {"minor_children_exclusion_total" in result.computed && (
                  <tr>
                    <td className="py-2 pr-4 text-gray-600">未成年子女額外免稅（贈與）</td>
                    <td className="py-2 text-right">{fmt(result.computed.minor_children_exclusion_total)}</td>
                  </tr>
                )}

                <tr>
                  <td className="py-2 pr-4 text-gray-600">應稅基</td>
                  <td className="py-2 text-right font-medium">{fmt(result.computed.taxable_base)}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-600">試算稅額</td>
                  <td className="py-2 text-right text-indigo-700 font-semibold text-base">
                    {fmt(result.computed.tax_due)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {result.version.sources && result.version.sources.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">來源</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {result.version.sources.map((s, i) => (
                  <li key={i}>
                    <a className="text-indigo-600 underline" href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      <div className="text-xs text-gray-500">
        ※ 本試算工具以你專案 <code>/data/tax/</code> 的版本設定為準，實務申報仍以主管機關最新公告為依據。
      </div>
    </div>
  );
}
