import React, { useEffect, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [rank, setRank] = useState("");
  const [username, setUsername] = useState("");
  const [categories, setCategories] = useState([]);
  const [genders, setGenders] = useState([]);
  const [regions, setRegions] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetch("/JAC.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setCategories([...new Set(json.map((d) => d["Category"]))]);
        setGenders([...new Set(json.map((d) => d["Gender"]))]);
        setRegions([...new Set(json.map((d) => d["Region"]))]);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const results = data.filter((row) => {
      const closingRank = parseInt(row["Closing Rank"]);
      const validRank = !isNaN(closingRank) && parseInt(rank) <= closingRank;
      const validCategory = row["Category"] === category;
      const validGender = row["Gender"] === gender;
      const validRegion = row["Region"] === region;

      return validRank && validCategory && validGender && validRegion;
    });

    setFiltered(results);
    setSortDirection("asc");
  };

  const handleReset = () => {
    setCategory("");
    setGender("");
    setRegion("");
    setRank("");
    setUsername("");
    setFiltered([]);
  };

  const sortClosingRank = () => {
    const newDir = sortDirection === "asc" ? "desc" : "asc";
    const sorted = [...filtered].sort((a, b) => {
      const x = parseInt(a["Closing Rank"]);
      const y = parseInt(b["Closing Rank"]);
      return newDir === "asc" ? x - y : y - x;
    });
    setFiltered(sorted);
    setSortDirection(newDir);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`JAC Delhi Predicted Colleges for ${username}`, 10, 10);

    const userInfo = [
      `Name: ${username}`,
      `Rank: ${rank}`,
      `Category: ${category}`,
      `Gender: ${gender}`,
      `Region: ${region}`
    ].join(" | ");

    const wrappedUserInfo = doc.splitTextToSize(userInfo, 190);
    doc.text(wrappedUserInfo, 10, 18);

    const tableBody = filtered.map((row) => [
      row["Institute name"],
      row["Branch"],
      (row["Total B.Tech Fees (4 Years)"] || "-").replace(/₹/g, "Rs."),
      (row["Hostel Fees (per year)"] || "-").replace(/₹/g, "Rs."),
      (row["Avg. Yearly Fees"] || "-").replace(/₹/g, "Rs."),
      (row["Average Package"] || "-").replace(/₹/g, "Rs."),
      (row["Highest Package"] || "-").replace(/₹/g, "Rs."),
      row["Region"] || "-",
      row["Category"] || "-",
      row["Gender"] || "-",
      row["Closing Rank"] || "-"
    ]);

    autoTable(doc, {
      head: [[
        "Institute", "Branch", "Total Fees", "Hostel Fees", "Yearly Fees",
        "Avg Package", "Highest Package", "Region", "Category", "Gender", "Closing Rank"
      ]],
      body: tableBody,
      startY: 25 + wrappedUserInfo.length * 6,
      styles: { fontSize: 7 },
      tableWidth: "auto"
    });

    doc.save(`JAC_${username.replace(/\s+/g, "_")}_Predictions.pdf`);
  };

  return (
    <div className="container">
      <h1>JAC Delhi College Predictor 2025</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your Name"
          required
        />
        <input
          type="number"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          placeholder="Your JEE Rank"
          required
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)} required>
          <option value="">Select Region</option>
          {regions.map((r, i) => (
            <option key={i} value={r}>{r}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Select Category</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={gender} onChange={(e) => setGender(e.target.value)} required>
          <option value="">Select Gender</option>
          {genders.map((g, i) => (
            <option key={i} value={g}>{g}</option>
          ))}
        </select>

        <div className="form-buttons">
          <button type="submit">Predict Colleges</button>
          <button type="button" onClick={handleReset} className="reset-btn">Reset</button>
        </div>
      </form>

      {filtered.length > 0 && (
        <>
          <h2>Predicted Colleges for {username}</h2>
          <div className="table-controls">
            <button onClick={downloadPDF}>Download PDF</button>
            <button onClick={sortClosingRank}>
              Sort by Closing Rank {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Institute</th>
                <th>Branch</th>
                <th>Total Fees</th>
                <th>Hostel Fees</th>
                <th>Yearly Fees</th>
                <th>Avg Package</th>
                <th>Highest Package</th>
                <th>Region</th>
                <th>Category</th>
                <th>Gender</th>
                <th>Closing Rank</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i}>
                  <td>{row["Institute name"]}</td>
                  <td>{row["Branch"]}</td>
                  <td>{row["Total B.Tech Fees (4 Years)"] || "-"}</td>
                  <td>{row["Hostel Fees (per year)"] || "-"}</td>
                  <td>{row["Avg. Yearly Fees"] || "-"}</td>
                  <td>{row["Average Package"] || "-"}</td>
                  <td>{row["Highest Package"] || "-"}</td>
                  <td>{row["Region"]}</td>
                  <td>{row["Category"]}</td>
                  <td>{row["Gender"]}</td>
                  <td>{row["Closing Rank"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
