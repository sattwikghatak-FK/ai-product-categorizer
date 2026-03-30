import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const BATCH  = 60;
const CONCUR = 4;
const SAMPLE = 250;
const PAL = ["#60a5fa","#34d399","#fbbf24","#f87171","#a78bfa","#22d3ee","#fb923c","#f472b6","#4ade80","#818cf8","#2dd4bf","#facc15","#c084fc","#67e8f9","#fdba74"];

// ── Proxy call (key lives server-side) ──────────────────────────────────────
async function ai(prompt, sys, maxTok) {
  const r = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTok || 2000,
      system: sys || "Return only valid JSON. No markdown, no explanation.",
      messages: [{ role: "user", content: prompt }]
    })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || "API error " + r.status);
  return (d.content || []).find(b => b.type === "text")?.text || "";
}

function parseJSON(raw) {
  const s = raw.replace(/```json|```/g, "").trim();
  for (const p of [s, s.match(/\[[\s\S]*\]/s)?.[0], s.match(/\{[\s\S]*\}/s)?.[0]]) {
    if (!p) continue;
    try { return JSON.parse(p); } catch {}
  }
  throw new Error("Cannot parse JSON from AI response");
}

// ── Taxonomy builder ─────────────────────────────────────────────────────────
async function buildTaxonomy(samples) {
  const list = samples.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const raw = await ai(
    `You are a product catalog expert. Analyze these product titles and build a keyword-aware taxonomy.

RULES:
- Read the actual keywords in each title
- Group by what the product IS, not the brand (e.g. all diaper brands → "Diapers")
- Create 8–20 top-level CATEGORIES (broad product types)
- Each category must have 3–8 SUBCATEGORIES (specific variants/types/formats)

PRODUCT TITLES:
${list}

Return ONLY a JSON array:
[{"category":"Diapers & Nappy Care","subcategories":["Pant Style Diapers","Tape Style Diapers","Diaper Rash Cream","Wet Wipes"]}]`,
    "Return only a valid JSON array. No markdown, no explanation.",
    2500
  );
  const arr = parseJSON(raw);
  if (!Array.isArray(arr)) throw new Error("Taxonomy must be an array");
  return arr.filter(x => x.category && Array.isArray(x.subcategories));
}

// ── Batch classifier ─────────────────────────────────────────────────────────
async function classifyBatch(titles, taxonomy, tries = 3) {
  const taxStr = taxonomy.map(t => `${t.category}: ${t.subcategories.join(", ")}`).join("\n");
  for (let a = 0; a < tries; a++) {
    try {
      const raw = await ai(
        `TAXONOMY:\n${taxStr}\n\nClassify each product title — extract its keywords, pick the best category + subcategory.\n\nTITLES:\n${titles.map((t, i) => `${i}: ${t}`).join("\n")}\n\nReturn ONLY JSON: {"0":{"category":"...","subcategory":"..."},...}`,
        "Return only a valid JSON object. No markdown.",
        4096
      );
      const obj = parseJSON(raw);
      const catNames = taxonomy.map(t => t.category);
      return titles.map((_, i) => {
        const res = obj[String(i)];
        const cat = catNames.includes(res?.category) ? res.category : "Uncategorized";
        const taxEntry = taxonomy.find(t => t.category === cat);
        const sub = taxEntry?.subcategories.includes(res?.subcategory) ? res.subcategory : (taxEntry?.subcategories[0] || "General");
        return { category: cat, subcategory: sub };
      });
    } catch {
      if (a === 2) return titles.map(() => ({ category: "Uncategorized", subcategory: "General" }));
      await new Promise(r => setTimeout(r, 1200 * (a + 1)));
    }
  }
}

async function parallel(fns, limit) {
  const out = new Array(fns.length);
  let idx = 0;
  async function w() { while (idx < fns.length) { const i = idx++; out[i] = await fns[i](); } }
  await Promise.all(Array.from({ length: Math.min(limit, fns.length) }, w));
  return out;
}

// ── Excel export ─────────────────────────────────────────────────────────────
function exportExcel(rows, taxonomy, fname) {
  const wb = XLSX.utils.book_new();

  // Sheet 1 – All rows
  const ws1 = XLSX.utils.json_to_sheet(rows.map(r => ({
    "Product Title": r.title, "Category": r.category, "Sub-Category": r.subcategory
  })));
  ws1["!cols"] = [{ wch: 60 }, { wch: 32 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Categorized Products");

  // Sheet 2 – Summary
  const sumMap = {};
  rows.forEach(r => {
    const k = `${r.category}||${r.subcategory}`;
    sumMap[k] = (sumMap[k] || 0) + 1;
  });
  const ws2 = XLSX.utils.json_to_sheet(
    Object.entries(sumMap).sort((a, b) => b[1] - a[1])
      .map(([k, n]) => { const [cat, sub] = k.split("||"); return { "Category": cat, "Sub-Category": sub, "Count": n }; })
  );
  ws2["!cols"] = [{ wch: 32 }, { wch: 32 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  // Sheet 3 – Taxonomy
  const taxRows = [];
  taxonomy.forEach(t => t.subcategories.forEach(s => taxRows.push({ "Category": t.category, "Sub-Category": s })));
  const ws3 = XLSX.utils.json_to_sheet(taxRows);
  ws3["!cols"] = [{ wch: 32 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Taxonomy");

  XLSX.writeFile(wb, fname);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:  { background: "#080f1e", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui,sans-serif", padding: "24px 16px" },
  wrap:  { maxWidth: 900, margin: "0 auto" },
  card:  { background: "#0d1829", border: "1px solid #1e2d45", borderRadius: 16, padding: "22px 24px", marginBottom: 14 },
  h2:    { margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#475569", marginBottom: 6 },
  sel:   { background: "#111f33", border: "1px solid #1e3a5f", borderRadius: 9, padding: "9px 13px", fontSize: 13, color: "#e2e8f0", outline: "none" },
  btn:   (bg, fg) => ({ background: bg || "#2563eb", color: fg || "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  tag:   (col) => ({ display: "inline-block", background: col + "22", color: col, border: `1px solid ${col}44`, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 }),
  stat:  { background: "#111f33", border: "1px solid #1e2d45", borderRadius: 12, padding: "12px 14px", flex: 1 },
};

function Spin() {
  return <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}
function Bar({ pct, a, b }) {
  return (
    <div style={{ height: 8, background: "#111f33", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(pct, 1)}%`, height: "100%", background: `linear-gradient(90deg,${a},${b})`, transition: "width 0.4s", borderRadius: 999 }} />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase,   setPhase]   = useState("upload");
  const [file,    setFile]    = useState(null);
  const [cols,    setCols]    = useState([]);
  const [col,     setCol]     = useState("");
  const [tax,     setTax]     = useState([]);
  const [msg,     setMsg]     = useState("");
  const [err,     setErr]     = useState("");
  const [prog,    setProg]    = useState({ total: 0, uniq: 0, done: 0 });
  const [rows,    setRows]    = useState([]);
  const [live,    setLive]    = useState([]);
  const [drag,    setDrag]    = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const fileRef  = useRef();
  const taxRef   = useRef([]);
  const rowsRef  = useRef([]);
  const timerRef = useRef(null);
  const t0Ref    = useRef(0);

  const tick    = () => { timerRef.current = setInterval(() => setElapsed(((Date.now() - t0Ref.current) / 1000) | 0), 800); };
  const noTick  = () => clearInterval(timerRef.current);

  function loadFile(f) {
    if (!f?.name?.endsWith(".csv")) { alert("Please upload a .csv file"); return; }
    setFile(f);
    Papa.parse(f.slice(0, 80000), {
      header: true, preview: 4,
      complete: r => {
        const h = r.meta.fields || [];
        setCols(h);
        setCol(h.find(x => /product.?title/i.test(x)) || h[0] || "");
        setPhase("setup");
      }
    });
  }

  async function doSample() {
    setPhase("sampling"); setMsg("Reading sample titles…");
    try {
      const samples = await new Promise((res, rej) => {
        const acc = [];
        Papa.parse(file, {
          header: true, skipEmptyLines: true,
          step: (row, p) => { const v = String(row.data[col] || "").trim(); if (v) acc.push(v); if (acc.length >= SAMPLE) p.abort(); },
          complete: () => res(acc), error: rej
        });
      });
      if (samples.length < 3) throw new Error(`Column "${col}" appears empty.`);
      setMsg(`AI building taxonomy from ${samples.length} sample titles…`);
      const taxonomy = await buildTaxonomy(samples);
      setTax(taxonomy); taxRef.current = taxonomy;
      setPhase("review");
    } catch (e) { setErr(e.message); setPhase("error"); }
  }

  async function doProcess() {
    taxRef.current = tax; rowsRef.current = []; setRows([]); setLive([]);
    setPhase("running"); t0Ref.current = Date.now(); tick();
    try {
      setMsg("Streaming file…");
      const all = await new Promise((res, rej) => {
        const acc = [];
        Papa.parse(file, {
          header: true, skipEmptyLines: true, chunkSize: 3 * 1024 * 1024,
          chunk: results => { results.data.forEach(row => { const v = String(row[col] || "").trim(); if (v) acc.push(v); }); setProg(p => ({ ...p, total: acc.length })); },
          complete: () => res(acc), error: rej
        });
      });
      if (!all.length) throw new Error("No data found.");

      const uniqArr = [...new Set(all)];
      setProg({ total: all.length, uniq: uniqArr.length, done: 0 });
      setMsg(`Classifying ${uniqArr.length.toLocaleString()} unique titles (${Math.round((1 - uniqArr.length / all.length) * 100)}% dedupe savings)…`);

      const catMap = {};
      const batches = [];
      for (let i = 0; i < uniqArr.length; i += BATCH) batches.push(uniqArr.slice(i, i + BATCH));

      let done = 0;
      const tasks = batches.map(batch => async () => {
        const res = await classifyBatch(batch, taxRef.current);
        batch.forEach((t, i) => { catMap[t] = res[i]; });
        done += batch.length;
        setProg(p => ({ ...p, done }));
        setLive(batch.slice(-6).map((t, i) => ({ title: t, ...res[Math.max(0, res.length - 6 + i)] })));
      });
      await parallel(tasks, CONCUR);

      const finalRows = all.map(t => ({ title: t, ...(catMap[t] || { category: "Uncategorized", subcategory: "General" }) }));
      rowsRef.current = finalRows; setRows(finalRows);
      noTick(); setPhase("done");
    } catch (e) { noTick(); setErr(e.message); setPhase("error"); }
  }

  function doExport() {
    exportExcel(rowsRef.current, taxRef.current, `categorized_${file?.name?.replace(".csv", "") || "products"}.xlsx`);
  }

  const uniqPct = prog.uniq > 0 ? Math.min(100, (prog.done / prog.uniq) * 100) : 0;
  const speed   = elapsed > 1 ? (prog.done / elapsed) | 0 : 0;
  const eta     = speed > 0 && prog.done < prog.uniq ? Math.round((prog.uniq - prog.done) / speed) : null;
  const fmtSec  = s => s > 3600 ? `${(s / 3600) | 0}h ${((s % 3600) / 60) | 0}m` : s > 60 ? `${(s / 60) | 0}m ${s % 60}s` : `${s}s`;
  const fmt     = n => (n || 0).toLocaleString();

  const catSummary = {};
  rows.forEach(r => { if (!catSummary[r.category]) catSummary[r.category] = { total: 0, subs: {} }; catSummary[r.category].total++; catSummary[r.category].subs[r.subcategory] = (catSummary[r.category].subs[r.subcategory] || 0) + 1; });
  const sortedCats = Object.entries(catSummary).sort((a, b) => b[1].total - a[1].total);

  const STEPS   = ["Upload", "Column", "Taxonomy", "Process", "Done"];
  const STEP_I  = { upload: 0, setup: 1, sampling: 2, review: 2, running: 3, done: 4, error: 0 };
  const curStep = STEP_I[phase] || 0;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
      <div style={S.wrap}>

        {/* Header */}
        <div style={{ textAlign: "center", paddingBottom: 22 }}>
          <div style={{ display: "inline-flex", gap: 6, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 999, padding: "4px 14px", fontSize: 11, color: "#60a5fa", marginBottom: 10 }}>
            ⚡ Streaming · Deduplicated · Category + Sub-Category · Excel Export
          </div>
          <h1 style={{ margin: "0 0 5px", fontSize: 27, fontWeight: 900, background: "linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AI Product Categorizer
          </h1>
          <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>Keyword-aware · Category → Sub-Category · 3 GB+ CSV → Excel</p>
        </div>

        {/* Step bar */}
        <div style={{ ...S.card, display: "flex", alignItems: "center", padding: "12px 20px", marginBottom: 14 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: i < curStep ? "#22c55e" : i === curStep ? "#3b82f6" : "#111f33", color: i <= curStep ? "#fff" : "#475569", border: i > curStep ? "1px solid #1e2d45" : "none", boxShadow: i === curStep ? "0 0 0 4px rgba(59,130,246,0.2)" : "none" }}>
                  {i < curStep ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: i < curStep ? "#4ade80" : i === curStep ? "#93c5fd" : "#334155", whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "#1e2d45", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        {/* UPLOAD */}
        {phase === "upload" && (
          <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); loadFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
            style={{ ...S.card, textAlign: "center", padding: "60px 24px", cursor: "pointer", border: `2px dashed ${drag ? "#3b82f6" : "#1e2d45"}`, background: drag ? "rgba(59,130,246,0.04)" : "#0d1829" }}>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => loadFile(e.target.files[0])} />
            <div style={{ fontSize: 52, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>Drop your product CSV here</div>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>Handles 3 GB+ · Streaming parse · <code style={{ background: "#111f33", padding: "2px 7px", borderRadius: 6, color: "#60a5fa" }}>product_title</code> auto-detected</div>
            <div style={S.btn()}>Browse File</div>
          </div>
        )}

        {/* SETUP */}
        {phase === "setup" && (
          <div style={S.card}>
            <h2 style={S.h2}>🗂 Select Product Title Column</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={S.label}>Column to Categorize</label>
                <select value={col} onChange={e => setCol(e.target.value)} style={{ ...S.sel, width: "100%" }}>
                  {cols.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div style={{ background: "#111f33", border: "1px solid #1e2d45", borderRadius: 11, padding: "13px 15px", fontSize: 12, color: "#64748b" }}>
                <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>📄 File Info</div>
                <div>Name: <span style={{ color: "#cbd5e1" }}>{file?.name}</span></div>
                <div style={{ marginTop: 3 }}>Size: <span style={{ color: "#cbd5e1" }}>{((file?.size || 0) / 1024 / 1024).toFixed(1)} MB</span></div>
                <div style={{ marginTop: 3 }}>Columns: <span style={{ color: "#cbd5e1" }}>{cols.length}</span></div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={doSample} style={S.btn()}>Sample & Build Taxonomy →</button>
              <span style={{ fontSize: 11, color: "#475569" }}>Reads first {SAMPLE} rows · builds categories + sub-categories</span>
            </div>
          </div>
        )}

        {/* SAMPLING */}
        {phase === "sampling" && (
          <div style={{ ...S.card, textAlign: "center", padding: "60px 24px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Spin /></div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>Discovering Taxonomy</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{msg}</div>
          </div>
        )}

        {/* REVIEW */}
        {phase === "review" && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h2 style={{ ...S.h2, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                  🏷️ AI-Discovered Taxonomy
                  <span style={S.tag("#60a5fa")}>{tax.length} categories</span>
                  <span style={S.tag("#a78bfa")}>{tax.reduce((s, t) => s + t.subcategories.length, 0)} sub-categories</span>
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>Based on keyword analysis. Edit if needed.</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto", marginBottom: 18 }}>
              {tax.map((t, i) => (
                <div key={i} style={{ background: "#111f33", border: "1px solid #1e2d45", borderRadius: 11, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: PAL[i % PAL.length], flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{t.category}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingLeft: 18 }}>
                    {t.subcategories.map((s, j) => (
                      <span key={j} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1e2d45", borderRadius: 999, padding: "3px 10px", fontSize: 11, color: "#94a3b8" }}>{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid #1e2d45", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#334155" }}>💡 Similar products (e.g. all diaper brands) auto-grouped by keyword</span>
              <button onClick={doProcess} style={{ ...S.btn(), background: "linear-gradient(90deg,#2563eb,#7c3aed)", padding: "12px 28px", fontSize: 14 }}>
                🚀 Start Categorizing
              </button>
            </div>
          </div>
        )}

        {/* RUNNING / DONE */}
        {(phase === "running" || phase === "done") && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ ...S.h2, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                {phase === "running" ? <><Spin /> Processing…</> : "✅ Categorization Complete!"}
              </h2>
              {phase === "done" && (
                <button onClick={doExport} style={{ ...S.btn("#16a34a"), display: "flex", alignItems: "center", gap: 8 }}>
                  📊 Download Excel
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Total Rows</div><div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(prog.total)}</div><div style={{ fontSize: 11, color: "#374151" }}>{((file?.size || 0) / 1024 / 1024).toFixed(1)} MB</div></div>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Unique Titles</div><div style={{ fontSize: 20, fontWeight: 800, color: "#93c5fd" }}>{fmt(prog.uniq)}</div><div style={{ fontSize: 11, color: "#374151" }}>{prog.total > 0 ? `${Math.round((1 - prog.uniq / prog.total) * 100)}% deduped` : ""}</div></div>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Classified</div><div style={{ fontSize: 20, fontWeight: 800, color: "#c4b5fd" }}>{fmt(prog.done)}</div><div style={{ fontSize: 11, color: "#374151" }}>of {fmt(prog.uniq)}</div></div>
              <div style={S.stat}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{phase === "done" ? "Time Taken" : "ETA"}</div><div style={{ fontSize: 20, fontWeight: 800, color: phase === "done" ? "#86efac" : "#fde68a" }}>{phase === "done" ? fmtSec(elapsed) : eta ? fmtSec(eta) : "…"}</div><div style={{ fontSize: 11, color: "#374151" }}>{phase === "running" ? `~${speed}/s` : `${tax.length} cats · ${tax.reduce((s, t) => s + t.subcategories.length, 0)} subcats`}</div></div>
            </div>

            {phase === "running" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 4 }}><span>Categorization Progress</span><span>{Math.round(uniqPct)}%</span></div>
                <Bar pct={uniqPct} a="#3b82f6" b="#8b5cf6" />
                <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>{msg}</div>
              </div>
            )}

            {phase === "running" && live.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Live Classification Feed</div>
                {live.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#111f33", borderRadius: 8, padding: "7px 12px", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ flex: 1, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                    <span style={{ color: "#60a5fa", fontWeight: 600, flexShrink: 0 }}>{item.category}</span>
                    <span style={{ color: "#a78bfa", flexShrink: 0 }}>→ {item.subcategory}</span>
                  </div>
                ))}
              </div>
            )}

            {phase === "done" && sortedCats.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Results by Category</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                  {sortedCats.map(([cat, data], i) => {
                    const pct = Math.round((data.total / rows.length) * 100);
                    return (
                      <div key={cat} style={{ background: "#111f33", border: "1px solid #1e2d45", borderRadius: 11, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 9, height: 9, borderRadius: "50%", background: PAL[i % PAL.length], flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", flex: 1 }}>{cat}</span>
                          <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700 }}>{fmt(data.total)}</span>
                          <span style={{ fontSize: 11, color: "#475569" }}>({pct}%)</span>
                        </div>
                        <div style={{ height: 5, background: "#1e2d45", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: PAL[i % PAL.length] + "bb", borderRadius: 999 }} />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingLeft: 16 }}>
                          {Object.entries(data.subs).sort((a, b) => b[1] - a[1]).map(([sub, cnt]) => (
                            <span key={sub} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1e2d45", borderRadius: 999, padding: "2px 9px", fontSize: 11, color: "#94a3b8" }}>
                              {sub} <span style={{ color: "#60a5fa", fontWeight: 700 }}>{fmt(cnt)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 11, padding: "13px 16px", fontSize: 12, color: "#4ade80", display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📊</span>
                  <div><b>Excel contains 3 sheets:</b> Categorized Products · Summary · Taxonomy<div style={{ color: "#16a34a", marginTop: 3, fontSize: 11 }}>All {fmt(prog.total)} rows with Category + Sub-Category columns.</div></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div style={{ background: "rgba(127,29,29,0.12)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f87171", marginBottom: 10 }}>❌ Error</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(127,29,29,0.18)", color: "#fca5a5", borderRadius: 9, padding: "10px 13px", marginBottom: 12 }}>{err}</div>
            <button onClick={() => { setPhase("upload"); setFile(null); setErr(""); setRows([]); setProg({ total: 0, uniq: 0, done: 0 }); }}
              style={{ ...S.btn("#1e293b"), border: "1px solid #334155", color: "#cbd5e1" }}>↩ Start Over</button>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: "#1e2d45", paddingTop: 8 }}>
          Batch {BATCH} · {CONCUR}× parallel · keyword-aware · streaming CSV · Excel export
        </div>
      </div>
    </div>
  );
}
