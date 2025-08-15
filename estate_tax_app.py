# estate_tax_app.py
# Streamlit：AI 秒算遺產／贈與；稅率與免稅額來自 Google Sheet（tax_data.py）
import math
from dataclasses import dataclass
from typing import Dict, List, Tuple

import plotly.graph_objects as go
import streamlit as st

from tax_data import load_estate_tax, load_gift_tax, ttl_bucket

# -----------------------------
# 登入／授權（沿用 st.secrets 設定）
# -----------------------------
def check_auth() -> bool:
    users = st.secrets.get("authorized_users", {})
    if not users:
        return True  # 若未設定，預設不啟用登入
    st.sidebar.header("會員登入")
    u = st.sidebar.text_input("帳號")
    p = st.sidebar.text_input("密碼", type="password")
    if st.sidebar.button("登入"):
        if u in users and users[u].get("password") == p:
            st.session_state["auth_user"] = u
            return True
        st.sidebar.error("帳號或密碼錯誤")
    return bool(st.session_state.get("auth_user"))

# -----------------------------
# 稅務計算模型
# -----------------------------
@dataclass
class TaxTable:
    currency: str
    brackets: List[Dict]
    allowances: Dict[str, float]
    effective_from: str
    effective_to: str
    sources: List[Dict[str, str]]

def _fmt(n: float) -> str:
    return f"{n:,.0f}"

def _apply_brackets(taxable: float, brackets: List[Dict]) -> float:
    if taxable <= 0:
        return 0.0
    tax = 0.0
    prev_cap = 0.0
    for b in brackets:
        cap = b["up_to"]
        rate = float(b["rate"])
        if cap is None:
            # 最後一級
            gap = max(0.0, taxable - prev_cap)
            tax += gap * rate
            break
        if taxable > cap:
            gap = cap - prev_cap
            if gap > 0:
                tax += gap * rate
            prev_cap = cap
        else:
            gap = max(0.0, taxable - prev_cap)
            tax += gap * rate
            break
    return max(0.0, tax)

def build_tax_table(kind: str) -> TaxTable:
    # kind: "estate" 或 "gift"
    bucket = ttl_bucket(600)  # 10 分鐘
    if kind == "estate":
        raw = load_estate_tax(bucket)
    else:
        raw = load_gift_tax(bucket)
    return TaxTable(
        currency=raw["currency"],
        brackets=raw["brackets"],
        allowances=raw["allowances"],
        effective_from=raw.get("effective_from") or "",
        effective_to=raw.get("effective_to") or "",
        sources=raw.get("sources") or [],
    )

def compute_estate_tax(
    gross_estate: float,
    spouse_cnt: int,
    ascendant_cnt: int,
    descendant_cnt: int,
    disabled_dependents: int,
    funeral_cost: float,
    debts: float,
    table: TaxTable
) -> Dict:
    a = table.allowances
    # 允許 key 缺漏 → 預設 0
    basic = float(a.get("basic_exemption", 0))
    spouse_ded = float(a.get("spouse_deduction", 0)) * spouse_cnt
    asc_ded = float(a.get("lineal_ascendant_deduction_per_person", 0)) * ascendant_cnt
    desc_ded = float(a.get("lineal_descendant_deduction_per_person", 0)) * descendant_cnt
    dis_ded = float(a.get("disabled_dependent_deduction_per_person", 0)) * disabled_dependents
    funeral_ded_cap = float(a.get("funeral_expense_deduction", 0))
    funeral_ded = min(funeral_cost, funeral_ded_cap)

    deductions = basic + spouse_ded + asc_ded + desc_ded + dis_ded + funeral_ded + max(0.0, debts)
    taxable = max(0.0, gross_estate - deductions)
    tax = _apply_brackets(taxable, table.brackets)

    return {
        "currency": table.currency,
        "gross_estate": gross_estate,
        "deductions": deductions,
        "taxable": taxable,
        "tax": tax,
        "effective_from": table.effective_from,
        "effective_to": table.effective_to,
        "sources": table.sources,
        "breakdown": {
            "basic_exemption": basic,
            "spouse": spouse_ded,
            "ascendant": asc_ded,
            "descendant": desc_ded,
            "disabled": dis_ded,
            "funeral": funeral_ded,
            "debts": max(0.0, debts),
        }
    }

def compute_gift_tax(
    annual_gift_amount: float,
    donee_cnt: int,
    table: TaxTable
) -> Dict:
    a = table.allowances
    # 年度免稅額（每贈與人）＋直/尊親屬免稅（若適用）
    annual_ex = float(a.get("annual_exclusion_per_donor", 0))
    # 這裡依你資料設計調整：若每受贈人有額外免稅，請改成每人乘上 donee_cnt
    base_exemption = annual_ex
    taxable = max(0.0, annual_gift_amount - base_exemption)
    tax = _apply_brackets(taxable, table.brackets)
    return {
        "currency": table.currency,
        "gift_amount": annual_gift_amount,
        "exemption": base_exemption,
        "taxable": taxable,
        "tax": tax,
        "effective_from": table.effective_from,
        "effective_to": table.effective_to,
        "sources": table.sources,
    }

# -----------------------------
# Streamlit UI
# -----------------------------
st.set_page_config(page_title="永傳｜遺產／贈與 稅務試算", page_icon="💼", layout="wide")

st.title("🧮 遺產／贈與 稅務試算（即時稅率 from Google Sheet）")
st.caption("稅率與免稅額由你在 Google Sheet 維護，更新立即生效。回答僅供教育用途，實務請以官方公告為準。")

if not check_auth():
    st.stop()

tab1, tab2 = st.tabs(["遺產試算", "贈與試算"])

with tab1:
    st.subheader("遺產稅試算")
    c1, c2, c3 = st.columns(3)
    with c1:
        gross_estate = st.number_input("遺產總額（TWD）", min_value=0.0, step=1e5, value=30_000_000.0, format="%.0f")
        spouse_cnt = st.number_input("配偶人數", min_value=0, max_value=1, value=1, step=1)
        debts = st.number_input("可扣除債務（TWD）", min_value=0.0, step=1e5, value=0.0, format="%.0f")
    with c2:
        ascendant_cnt = st.number_input("直系尊親屬（父母/祖父母）人數", min_value=0, value=0, step=1)
        descendant_cnt = st.number_input("直系卑親屬（子女/孫子女）人數", min_value=0, value=2, step=1)
        funeral_cost = st.number_input("喪葬費用（TWD）", min_value=0.0, step=1e4, value=300_000.0, format="%.0f")
    with c3:
        disabled_dependents = st.number_input("身心障礙被扶養人數", min_value=0, value=0, step=1)

    estate_table = build_tax_table("estate")
    r = compute_estate_tax(
        gross_estate=gross_estate,
        spouse_cnt=spouse_cnt,
        ascendant_cnt=ascendant_cnt,
        descendant_cnt=descendant_cnt,
        disabled_dependents=disabled_dependents,
        funeral_cost=funeral_cost,
        debts=debts,
        table=estate_table
    )

    st.markdown(f"**適用期間**：{r['effective_from']} ～ {r['effective_to']}")
    if estate_table.sources:
        st.markdown("**來源**：")
        for s in estate_table.sources:
            st.markdown(f"- [{s['title']}]({s['url']})")

    st.divider()
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("遺產總額", f"{_fmt(r['gross_estate'])} 元")
    c2.metric("扣除合計", f"{_fmt(r['deductions'])} 元")
    c3.metric("課稅金額", f"{_fmt(r['taxable'])} 元")
    c4.metric("應納稅額", f"{_fmt(r['tax'])} 元")

    with st.expander("查看扣除明細"):
        b = r["breakdown"]
        st.write({
            "基礎免稅額": _fmt(b["basic_exemption"]),
            "配偶扣除": _fmt(b["spouse"]),
            "直系尊親屬扣除": _fmt(b["ascendant"]),
            "直系卑親屬扣除": _fmt(b["descendant"]),
            "身心障礙被扶養扣除": _fmt(b["disabled"]),
            "喪葬費用扣除": _fmt(b["funeral"]),
            "債務扣除": _fmt(b["debts"]),
        })

with tab2:
    st.subheader("贈與稅試算")
    c1, c2 = st.columns(2)
    with c1:
        gift_amount = st.number_input("年度贈與總額（TWD）", min_value=0.0, step=1e5, value=3_000_000.0, format="%.0f")
    with c2:
        donee_cnt = st.number_input("受贈人數（參考）", min_value=1, value=1, step=1)

    gift_table = build_tax_table("gift")
    g = compute_gift_tax(gift_amount, donee_cnt, gift_table)

    st.markdown(f"**適用期間**：{g['effective_from']} ～ {g['effective_to']}")
    if gift_table.sources:
        st.markdown("**來源**：")
        for s in gift_table.sources:
            st.markdown(f"- [{s['title']}]({s['url']})")

    st.divider()
    c1, c2, c3 = st.columns(3)
    c1.metric("贈與總額", f"{_fmt(g['gift_amount'])} 元")
    c2.metric("免稅額（基礎）", f"{_fmt(g['exemption'])} 元")
    c3.metric("應納稅額", f"{_fmt(g['tax'])} 元")

    # 視覺化
    fig = go.Figure()
    fig.add_bar(name="贈與總額", x=["贈與"], y=[g["gift_amount"]])
    fig.add_bar(name="免稅額", x=["贈與"], y=[g["exemption"]])
    fig.add_bar(name="稅額", x=["贈與"], y=[g["tax"]])
    fig.update_layout(barmode="stack", title="贈與結構", height=360)
    st.plotly_chart(fig, use_container_width=True)

st.caption("© 永傳家族辦公室｜教育用途示範，請以最新官方公告與專業審閱為準。")
