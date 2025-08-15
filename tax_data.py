# tax_data.py
# 讀取 Google Sheet 的遺產／贈與稅資料，轉為程式可用的結構，並做快取。
# 需要在 .streamlit/secrets.toml 設定：
# [gcp_service_account] ...（服務帳號 JSON 權杖）
# [sheets]
# spreadsheet_url = "https://docs.google.com/spreadsheets/d/XXXX/edit#gid=0"
# estate_version = "2025"
# gift_version = "2025"
# estate_brackets_sheet = "tw_estate_brackets"
# estate_allowances_sheet = "tw_estate_allowances"
# estate_meta_sheet = "tw_estate_meta"
# gift_brackets_sheet = "tw_gift_brackets"
# gift_allowances_sheet = "tw_gift_allowances"
# gift_meta_sheet = "tw_gift_meta"

import time
from functools import lru_cache
from typing import Dict, Any, List, Optional

import gspread
from google.oauth2.service_account import Credentials
import streamlit as st

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

def _get_client() -> gspread.Client:
    info = st.secrets["gcp_service_account"]
    creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    return gspread.authorize(creds)

def _open_sheet_by_url(url: str):
    client = _get_client()
    return client.open_by_url(url)

def _sheet_to_rows(sh, sheet_name: str) -> List[Dict[str, Any]]:
    ws = sh.worksheet(sheet_name)
    rows = ws.get_all_records()  # 第一列為欄名
    # 轉換簡單型別
    def _coerce(v: Any):
        if isinstance(v, str) and v.strip() == "":
            return None
        if isinstance(v, str):
            s = v.strip()
            # 數字轉型
            try:
                if "." in s:
                    return float(s)
                return int(s)
            except Exception:
                return v
        return v
    return [{k: _coerce(v) for k, v in r.items()} for r in rows]

def _build_tax_payload(
    brackets_rows: List[Dict[str, Any]],
    allowances_rows: List[Dict[str, Any]],
    meta_rows: List[Dict[str, Any]],
    version: str
) -> Dict[str, Any]:
    # 期別（version）用來選用同一年度／同一版本
    meta = next((m for m in meta_rows if str(m.get("version")) == str(version)), None)
    if not meta:
        raise ValueError(f"找不到 meta version={version}")

    currency = meta.get("currency", "TWD")
    effective_from = meta.get("effective_from")
    effective_to = meta.get("effective_to")
    sources = []
    for i in range(1, 6):
        t = meta.get(f"source_title_{i}")
        u = meta.get(f"source_url_{i}")
        if t and u:
            sources.append({"title": t, "url": u})

    # brackets：依 version 過濾，依 up_to 排序（最後一級 up_to 可為空/None）
    br = [b for b in brackets_rows if str(b.get("version")) == str(version)]
    br_sorted = sorted(
        br,
        key=lambda x: (x.get("up_to") is None, x.get("up_to") if x.get("up_to") is not None else float("inf"))
    )
    brackets = [{"up_to": b.get("up_to", None), "rate": float(b.get("rate", 0))} for b in br_sorted]

    # allowances：key/amount
    al = [a for a in allowances_rows if str(a.get("version")) == str(version)]
    allowances = {}
    for a in al:
        k = str(a.get("key")).strip()
        v = float(a.get("amount") or 0)
        allowances[k] = v

    return {
        "currency": currency,
        "effective_from": effective_from,
        "effective_to": effective_to,
        "brackets": brackets,
        "allowances": allowances,
        "sources": sources,
    }

@lru_cache(maxsize=8)
def load_estate_tax(now_ts_bucket: Optional[int] = None) -> Dict[str, Any]:
    """
    載入『遺產稅』設定。now_ts_bucket 用於 TTL 快取，例如 int(time.time()//600) 表示 10 分鐘更新。
    """
    url = st.secrets["sheets"]["spreadsheet_url"]
    version = st.secrets["sheets"].get("estate_version", "2025")
    b_sheet = st.secrets["sheets"].get("estate_brackets_sheet", "tw_estate_brackets")
    a_sheet = st.secrets["sheets"].get("estate_allowances_sheet", "tw_estate_allowances")
    m_sheet = st.secrets["sheets"].get("estate_meta_sheet", "tw_estate_meta")

    sh = _open_sheet_by_url(url)
    br = _sheet_to_rows(sh, b_sheet)
    al = _sheet_to_rows(sh, a_sheet)
    meta = _sheet_to_rows(sh, m_sheet)

    return _build_tax_payload(br, al, meta, version)

@lru_cache(maxsize=8)
def load_gift_tax(now_ts_bucket: Optional[int] = None) -> Dict[str, Any]:
    """
    載入『贈與稅』設定。
    """
    url = st.secrets["sheets"]["spreadsheet_url"]
    version = st.secrets["sheets"].get("gift_version", "2025")
    b_sheet = st.secrets["sheets"].get("gift_brackets_sheet", "tw_gift_brackets")
    a_sheet = st.secrets["sheets"].get("gift_allowances_sheet", "tw_gift_allowances")
    m_sheet = st.secrets["sheets"].get("gift_meta_sheet", "tw_gift_meta")

    sh = _open_sheet_by_url(url)
    br = _sheet_to_rows(sh, b_sheet)
    al = _sheet_to_rows(sh, a_sheet)
    meta = _sheet_to_rows(sh, m_sheet)

    return _build_tax_payload(br, al, meta, version)

def ttl_bucket(seconds: int = 600) -> int:
    """
    回傳一個每 N 秒變化一次的整數，配合 lru_cache 做 TTL。
    """
    return int(time.time() // seconds)
