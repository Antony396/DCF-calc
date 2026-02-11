from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import requests

# -----------------------------
# Configuration
# -----------------------------
ALPHA_VANTAGE_KEY = "7ALNN7O2U3HZUX93"  # Your Alpha Vantage API key

# -----------------------------
# App setup
# -----------------------------
app = FastAPI(title="DCF Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Input model for DCF
# -----------------------------
class DCFInput(BaseModel):
    fcf: float
    growth_rate: float
    discount_rate: float
    terminal_growth: float
    years: int
    shares_outstanding: float
    cash_equivalent: float
    total_debt: float

# -----------------------------
# Helper functions
# -----------------------------
def project_cash_flows(fcf: float, growth_rate: float, years: int) -> List[float]:
    return [fcf * ((1 + growth_rate) ** year) for year in range(1, years + 1)]

def discount_cash_flows(cash_flows: List[float], discount_rate: float) -> List[float]:
    return [cf / ((1 + discount_rate) ** (i + 1)) for i, cf in enumerate(cash_flows)]

def terminal_value(last_fcf: float, discount_rate: float, terminal_growth: float) -> float:
    return (last_fcf * (1 + terminal_growth)) / (discount_rate - terminal_growth)

def parse_number(value):
    """Safely convert value to float, treat 'None' or missing as 0"""
    try:
        if value in (None, "", "None"):
            return 0
        return float(value)
    except:
        return 0

# -----------------------------
# DCF endpoint
# -----------------------------
@app.post("/dcf")
def calculate_dcf(data: DCFInput):
    projected = project_cash_flows(data.fcf, data.growth_rate, data.years)
    discounted = discount_cash_flows(projected, data.discount_rate)
    sum_pv_years = sum(discounted)
    
    tv = terminal_value(projected[-1], data.discount_rate, data.terminal_growth)
    discounted_tv = tv / ((1 + data.discount_rate) ** (data.years + 1))
    
    enterprise_value = sum_pv_years + discounted_tv
    equity_value = enterprise_value + data.cash_equivalent - data.total_debt
    intrinsic_value_per_share = equity_value / data.shares_outstanding

    return {
        "projected_cash_flows": [round(cf, 2) for cf in projected],
        "last_cash_flow": round(projected[-1], 2),
        "discounted_cash_flows": [round(cf, 2) for cf in discounted],
        "sum_pv_years": round(sum_pv_years, 2),
        "pv_terminal_value": round(discounted_tv, 2),
        "enterprise_value": round(enterprise_value, 2),
        "intrinsic_value_per_share": round(intrinsic_value_per_share, 2)
    }

# -----------------------------
# Financials endpoint
# -----------------------------
@app.get("/financials")
def get_financials(symbol: str):
    try:
        # 1️⃣ Fetch Cash Flow
        cf_url = f"https://www.alphavantage.co/query?function=CASH_FLOW&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
        cf_res = requests.get(cf_url, timeout=10).json()

        if "annualReports" not in cf_res or len(cf_res["annualReports"]) == 0:
            raise HTTPException(status_code=400, detail="No cash flow data found or API limit reached")

        latest_annual = cf_res.get("annualReports", [{}])[0]

        operating_cf = parse_number(latest_annual.get("operatingCashflow"))
        capex = parse_number(latest_annual.get("capitalExpenditures"))
        change_assets = parse_number(latest_annual.get("changeInOperatingAssets"))
        change_payables = parse_number(latest_annual.get("changeInOperatingLiabilities"))

        # 2️⃣ Calculate Free Cash Flow safely
        fcf = 0
        if operating_cf != 0:
            fcf = operating_cf - capex - change_assets + change_payables

        # 3️⃣ Fetch Overview
        overview_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
        overview_res = requests.get(overview_url, timeout=10).json()

        shares = parse_number(overview_res.get("SharesOutstanding"))
        cash_equiv = parse_number(overview_res.get("Cash"))
        debt = parse_number(overview_res.get("Debt"))

        return {
            "fcf": fcf,
            "shares": shares,
            "cash": cash_equiv,
            "debt": debt
        }

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

