"""Normalization helpers for the Sectors company-report ``peers`` section.

The Sectors ``peers`` block is NOT a flat list of peers. It is a 1-element
wrapper whose payload lives at ``peers[].peers_data.companies``::

    "peers": [
        {
            "peers_data": {
                "group_name": {"sector": "Financials", ...},
                "companies": [
                    {"symbol": "BBCA.JK", "company_name": "...", "market_cap": ...,
                     "pe_ttm": ..., "pb_mrq": ..., "yearly_mcap_chg": ..., "group": [...]},
                    ...
                ],
            }
        }
    ]

Consumers (market context, impact, analysis, agent tools) need the flat list of
companies. These helpers flatten that payload and never fabricate rows.
"""

from typing import Any

_NUMERIC_FIELDS = ("market_cap", "pe_ttm", "pb_mrq", "yearly_mcap_chg")


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_peers(raw_peers: Any) -> list[dict[str, Any]]:
    """Flatten Sectors ``peers[].peers_data.companies`` into clean peer rows.

    Returns an empty list when the payload is missing or malformed. Each row
    contains ``symbol`` (required), ``company_name``, the numeric valuation
    fields, and ``is_self`` (True when the company's group includes "self").
    Rows without a ``symbol`` are skipped.
    """
    if not isinstance(raw_peers, list):
        return []

    normalized: list[dict[str, Any]] = []
    for wrapper in raw_peers:
        if not isinstance(wrapper, dict):
            continue
        peers_data = wrapper.get("peers_data")
        if not isinstance(peers_data, dict):
            continue
        companies = peers_data.get("companies")
        if not isinstance(companies, list):
            continue
        for company in companies:
            if not isinstance(company, dict):
                continue
            symbol = company.get("symbol")
            if not isinstance(symbol, str) or not symbol.strip():
                continue
            group = company.get("group")
            row: dict[str, Any] = {
                "symbol": symbol.strip(),
                "company_name": company.get("company_name"),
                "is_self": isinstance(group, list) and "self" in group,
            }
            for field in _NUMERIC_FIELDS:
                row[field] = _coerce_float(company.get(field))
            normalized.append(row)
    return normalized
