import React, { useState } from "react";
import axios from "axios";

export default function DCFCalculator() {
  const [symbol, setSymbol] = useState("AAPL"); 
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

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    boxSizing: "border-box",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px"
  };

  // Fetch financials from backend
  const fetchCompanyData = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/financials?symbol=${symbol}`);
      const data = res.data;

      setFcf(data.fcf);
      setShares(data.shares);
      setCash(data.cash);
      setDebt(data.debt);
    } catch (err) {
      console.error("Failed to fetch financials:", err);
      alert("Failed to fetch financials. Make sure your backend is running and symbol is correct.");
    }
  };

  // Call DCF endpoint
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
      
     

      const response = await fetch("https://dcf-calc.onrender.com/dcf", {
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
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "'Segoe UI', sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 30 }}>DCF Calculator</h2>

      

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: 20
        }}
      >
        <div>
          <label>Latest Free Cash Flow (FCF)</label>
          <input type="number" value={fcf} onChange={(e) => setFcf(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label>Growth Rate (e.g., 0.08 for 8%)</label>
          <input type="number" step="0.01" value={growth} onChange={(e) => setGrowth(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label>Discount Rate (e.g., 0.10 for 10%)</label>
          <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label>Terminal Growth Rate (e.g., 0.025 for 2.5%)</label>
          <input type="number" step="0.001" value={terminal} onChange={(e) => setTerminal(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label>Projection Years</label>
          <input type="number" value={years} onChange={(e) => setYears(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label>Shares Outstanding</label>
          <input type="number" value={shares} onChange={(e) => setShares(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label>Cash & Cash Equivalent</label>
          <input type="number" value={cash} onChange={(e) => setCash(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label>Total Debt</label>
          <input type="number" value={debt} onChange={(e) => setDebt(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        style={{
          padding: "12px 20px",
          width: "100%",
          fontSize: 16,
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 5,
          cursor: "pointer"
        }}
      >
        Calculate
      </button>

      {error && <div style={{ marginTop: 20, color: "red" }}>Error: {error}</div>}

      {result && (
        <div
          style={{
            marginTop: 20,
            fontWeight: "bold",
            backgroundColor: "#f5f5f5",
            padding: 15,
            borderRadius: 5
          }}
        >
          Enterprise Value: ${result.enterprise_value} <br />
          Intrinsic Value / Share: ${result.intrinsic_value_per_share}
        </div>
      )}
    </div>
  );
}
