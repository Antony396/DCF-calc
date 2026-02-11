import React, { useState } from "react";

export default function DCFCalculator() {
  const [fcf, setFcf] = useState("");
  const [growth, setGrowth] = useState("");
  const [discount, setDiscount] = useState("");
  const [terminal, setTerminal] = useState("");
  const [years, setYears] = useState("");
  const [shares, setShares] = useState("");
  const [cash, setCash] = useState("");
  const [debt, setDebt] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCalculate = async () => {
    try {
      setError(null);
      const data = {
        fcf: parseFloat(fcf),
        growth_rate: parseFloat(growth),
        discount_rate: parseFloat(discount),
        terminal_growth: parseFloat(terminal),
        years: parseInt(years),
        shares_outstanding: parseFloat(shares),
        cash_equivalent: parseFloat(cash),
        total_debt: parseFloat(debt)
      };

      // Example: If you have a backend server
      const response = await fetch("http://127.0.0.1:8000/dcf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const res = await response.json();
      setResult(res);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "20px auto", fontFamily: "Arial" }}>
      <h2>DCF Calculator</h2>

      <div style={{ marginBottom: 15 }}>
        <label>Latest Free Cash Flow (FCF)</label>
        <input type="number" value={fcf} onChange={(e) => setFcf(e.target.value)} />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Growth Rate (e.g., 0.08 for 8%)</label>
        <input type="number" step="0.01" value={growth} onChange={(e) => setGrowth(e.target.value)} />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Discount Rate (e.g., 0.10 for 10%)</label>
        <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Terminal Growth Rate (e.g., 0.025 for 2.5%)</label>
        <input type="number" step="0.001" value={terminal} onChange={(e) => setTerminal(e.target.value)} />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Projection Years</label>
        <input type="number" value={years} onChange={(e) => setYears(e.target.value)} />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Shares Outstanding</label>
        <input type="number" value={shares} onChange={(e) => setShares(e.target.value)} />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Cash & Cash Equivalent</label>
        <input type="number" value={cash} onChange={(e) => setCash(e.target.value)} />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Total Debt</label>
        <input type="number" value={debt} onChange={(e) => setDebt(e.target.value)} />
      </div>

      <button onClick={handleCalculate} style={{ padding: 10, width: "100%", fontSize: 16 }}>
        Calculate
      </button>

      {error && <div style={{ marginTop: 20, color: "red" }}>Error: {error}</div>}

      {result && (
        <div style={{ marginTop: 20, fontWeight: "bold" }}>
          Enterprise Value: ${result.enterprise_value} <br />
          Intrinsic Value / Share: ${result.intrinsic_value_per_share}
        </div>
      )}
    </div>
  );
}
