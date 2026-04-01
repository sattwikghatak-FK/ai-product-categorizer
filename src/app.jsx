import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const CHUNK   = 50000;
const PAL = ["#60a5fa","#34d399","#fbbf24","#f87171","#a78bfa","#22d3ee","#fb923c","#f472b6","#4ade80","#818cf8","#2dd4bf","#facc15","#c084fc","#67e8f9","#fdba74"];

// ── TAXONOMY ──────────────────────────────────────────────────────────────────
// Add / edit keywords here freely. Multi-word keywords score higher automatically.
const TAXONOMY = {
  "Clothing & Apparel": {
    "T-Shirts & Tops":        ["t-shirt","tshirt","tee","polo","tank top","vest top","cami","halter","crop top","blouse","tunic","henley"],
    "Shirts":                 ["shirt","formal shirt","casual shirt","oxford shirt","flannel shirt","dress shirt","check shirt"],
    "Trousers & Jeans":       ["trouser","jeans","denim","chinos","cargo pant","jogger","palazzo","legging","jegging","pant","slacks"],
    "Dresses & Skirts":       ["dress","gown","maxi","midi","mini dress","skirt","frock","sundress","wrap dress"],
    "Ethnic Wear":            ["saree","sari","kurta","kurti","salwar","churidar","dupatta","lehenga","anarkali","sherwani","dhoti","lungi","ethnic"],
    "Jackets & Coats":        ["jacket","coat","blazer","windbreaker","parka","trench coat","bomber","hoodie","sweatshirt","pullover"],
    "Innerwear & Lingerie":   ["innerwear","underwear","bra","panty","brief","boxers","lingerie","shapewear","thermal inner"],
    "Activewear":             ["track pant","tracksuit","gym wear","sports bra","compression","yoga wear","activewear"],
    "Nightwear":              ["pyjama","pajama","nightgown","nightsuit","sleepwear","loungewear","robe"],
    "Baby & Kids Clothing":   ["baby onesie","romper","infant wear","kids dress","school uniform","kidswear"],
  },
  "Footwear": {
    "Sneakers & Sports Shoes":["sneaker","sports shoe","running shoe","training shoe","canvas shoe","athletic shoe"],
    "Formal Shoes":           ["formal shoe","oxford shoe","derby","brogue","loafer","monk strap","dress shoe"],
    "Sandals & Slippers":     ["sandal","slipper","flip flop","chappal","slide","mule"],
    "Boots":                  ["boot","ankle boot","chelsea boot","combat boot","hiking boot","rain boot"],
    "Heels":                  ["heel","stiletto","wedge shoe","block heel","platform shoe","kitten heel","pump"],
    "Kids Footwear":          ["kids shoe","baby shoe","school shoe","children shoe","toddler shoe"],
  },
  "Electronics & Gadgets": {
    "Mobile Phones":          ["mobile","smartphone","iphone","android phone","cellphone"],
    "Laptops & Computers":    ["laptop","notebook","macbook","desktop","computer","chromebook","ultrabook"],
    "Tablets":                ["tablet","ipad","android tablet","e-reader","kindle"],
    "Headphones & Earphones": ["headphone","earphone","earbuds","tws","neckband","headset","airpods","in-ear"],
    "Cameras":                ["camera","dslr","mirrorless","action camera","webcam","gopro","camcorder"],
    "TV & Displays":          ["television"," tv ","smart tv","led tv","oled","qled","monitor"],
    "Accessories & Cables":   ["cable","charger","adapter","power bank","usb hub","memory card","screen guard","phone case"],
    "Smart Home":             ["smart speaker","alexa","google home","smart bulb","smart plug","smart watch","wearable"],
    "Audio & Speakers":       ["speaker","soundbar","bluetooth speaker","home theatre","subwoofer"],
  },
  "Baby Products": {
    "Diapers":                ["diaper","nappy","pant style diaper","tape diaper","pull up diaper","huggies","pampers","mamy poko"],
    "Baby Food & Formula":    ["baby food","infant formula","baby cereal","stage 1","stage 2","baby formula","nan","aptamil","similac"],
    "Baby Skincare":          ["baby lotion","baby cream","baby oil","baby powder","baby wash","diaper rash cream","baby shampoo","baby soap"],
    "Baby Feeding":           ["feeding bottle","sippy cup","breast pump","baby bottle","bottle warmer","sterilizer"],
    "Baby Gear":              ["stroller","pram","baby carrier","baby seat","bouncer","baby swing","baby monitor","crib","bassinet"],
    "Baby Toys":              ["baby toy","rattle","teether","play mat","baby gym","soft toy"],
    "Wet Wipes":              ["wet wipe","baby wipe","moist wipe","cleansing wipe"],
  },
  "Home & Kitchen": {
    "Cookware":               ["kadai","wok","pressure cooker","frying pan","tawa","skillet","saucepan","casserole"],
    "Kitchen Appliances":     ["mixer","grinder","blender","juicer","toaster","microwave","air fryer","induction","food processor"],
    "Storage & Containers":   ["container","storage box","lunch box","canister","tiffin","airtight","organizer"],
    "Bedding":                ["bedsheet","pillow","comforter","duvet","blanket","quilt","mattress","pillow cover"],
    "Furniture":              ["sofa","chair","wardrobe","cabinet","shelf","rack","bed frame","dining table","bookcase"],
    "Home Decor":             ["vase","photo frame","candle","wall art","curtain","rug","carpet","lamp","cushion","mirror"],
    "Cleaning Supplies":      ["broom","mop","dustbin","cleaning brush","detergent","dishwash","floor cleaner","scrubber"],
  },
  "Beauty & Personal Care": {
    "Skincare":               ["moisturizer","sunscreen","serum","face wash","toner","face cream","exfoliator","face mask","cleanser"],
    "Haircare":               ["shampoo","conditioner","hair oil","hair mask","hair serum","hair color","hair dye","dry shampoo"],
    "Makeup":                 ["lipstick","foundation","concealer","mascara","eyeliner","eyeshadow","blush","primer","highlighter","kajal"],
    "Fragrances":             ["perfume","cologne","deodorant","body spray","attar","eau de toilette"],
    "Body Care":              ["body lotion","body wash","shower gel","scrub","talc","body butter","foot cream"],
    "Men's Grooming":         ["shaving cream","razor","aftershave","beard oil","trimmer","shaving gel"],
  },
  "Sports & Fitness": {
    "Exercise Equipment":     ["dumbbell","barbell","kettlebell","resistance band","pull up bar","treadmill","skipping rope"],
    "Yoga & Pilates":         ["yoga mat","yoga block","yoga strap","pilates","foam roller"],
    "Sports Nutrition":       ["protein powder","whey","creatine","bcaa","pre workout","mass gainer","protein bar"],
    "Outdoor Sports":         ["cricket bat","football","basketball","badminton","tennis racket","hockey stick","volleyball"],
    "Swimming":               ["swimwear","swimming costume","swim goggles","swim cap","swimming trunk"],
    "Cycling":                ["bicycle","cycle helmet","cycling jersey","bike pump","bike lock"],
  },
  "Books & Stationery": {
    "Books":                  ["novel","textbook","comic book","autobiography","encyclopedia","guide book"],
    "Stationery":             ["pen","pencil","notebook","diary","stapler","eraser","ruler","highlighter","marker"],
    "Office Supplies":        ["file folder","binder","calculator","whiteboard","paper clip","rubber band"],
  },
  "Toys & Games": {
    "Educational Toys":       ["lego","building blocks","puzzle","flashcard","abacus","science kit","stem toy"],
    "Action Figures & Dolls": ["action figure","doll","barbie","hot wheels","superhero toy","figurine"],
    "Board Games":            ["board game","chess","carrom","ludo","monopoly","playing cards","dice"],
    "Electronic Toys":        ["remote control car","rc car","drone toy","video game","gaming console"],
  },
  "Food & Grocery": {
    "Snacks":                 ["chips","biscuit","cookie","cracker","popcorn","namkeen","wafer"],
    "Beverages":              ["juice","cold drink","soda","energy drink","smoothie","iced tea","lemonade"],
    "Rice & Grains":          ["rice","wheat flour","atta","oats","quinoa","millet","dal","lentil"],
    "Spices & Condiments":    ["masala","turmeric","cumin","pepper","ketchup","pickle","chutney","vinegar"],
    "Dairy & Eggs":           ["curd","yogurt","cheese","butter","ghee","paneer","egg carton"],
    "Dry Fruits & Nuts":      ["almond","cashew","walnut","raisin","pista","dry fruit","trail mix"],
  },
  "Health & Wellness": {
    "Vitamins & Supplements": ["vitamin","omega 3","calcium tablet","multivitamin","zinc tablet","probiotic"],
    "Medical Devices":        ["thermometer","bp monitor","glucometer","oximeter","nebulizer","heating pad"],
    "Ayurvedic & Herbal":     ["ayurvedic","herbal","chyawanprash","ashwagandha","triphala","tulsi","neem","giloy"],
    "Feminine Care":          ["sanitary pad","tampon","menstrual cup","feminine wash","pantyliner"],
  },
  "Bags & Luggage": {
    "Backpacks":              ["backpack","school bag","laptop bag","rucksack","daypack"],
    "Handbags & Purses":      ["handbag","purse","tote bag","sling bag","clutch","shoulder bag"],
    "Luggage & Trolleys":     ["suitcase","trolley bag","duffel","luggage","cabin bag"],
    "Wallets":                ["wallet","card holder","money clip","billfold"],
  },
  "Accessories & Jewellery": {
    "Watches":                ["watch","smartwatch","analog watch","digital watch","wristwatch","chronograph"],
    "Jewellery":              ["necklace","earring","bracelet","ring","bangle","anklet","pendant","chain"],
    "Sunglasses & Eyewear":   ["sunglasses","spectacle","eyeglasses","contact lens","reading glasses"],
    "Belts":                  ["belt","leather belt","buckle strap"],
    "Hair Accessories":       ["hair clip","hair band","scrunchie","hairpin","headband","hair tie"],
  },
  "Pet Supplies": {
    "Dog Products":           ["dog food","dog treat","puppy food","dog biscuit","pedigree","dog collar","dog leash"],
    "Cat Products":           ["cat food","cat treat","kitten food","whiskas","cat litter","cat collar"],
    "Pet Accessories":        ["pet bed","pet toy","pet carrier","aquarium","bird cage","pet bowl"],
  },
  "Automotive": {
    "Car Accessories":        ["car cover","car mat","car charger","car mount","seat cover","steering cover"],
    "Bike Accessories":       ["bike cover","bike lock","cycle helmet","saddle cover","handlebar"],
    "Tyres & Oils":           ["tyre","tire","engine oil","gear oil","brake fluid","coolant"],
  },
};

// ── NLP ENGINE ────────────────────────────────────────────────────────────────
let KW_INDEX = null;

function buildIndex() {
  if (KW_INDEX) return KW_INDEX;
  const idx = [];
  for (const [cat, subs] of Object.entries(TAXONOMY)) {
    for (const [sub, kws] of Object.entries(subs)) {
      for (const kw of kws) {
        idx.push({ kw: kw.toLowerCase(), cat, sub, w: kw.trim().split(/\s+/).length });
      }
    }
  }
  idx.sort((a, b) => b.w - a.w); // longer keywords first
  KW_INDEX = idx;
  return idx;
}

function classify(title) {
  const idx   = buildIndex();
  const clean = title.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").replace(/\s+/g, " ").trim();
  const scores = {};
  for (const { kw, cat, sub, w } of idx) {
    const re = new RegExp("\\b" + kw.replace(/[-]/g, "\\-") + "\\b");
    if (re.test(clean)) {
      const key = `${cat}||${sub}`;
      scores[key] = (scores[key] || 0) + w;
    }
  }
  if (!Object.keys(scores).length) return { category: "Uncategorized", subcategory: "General" };
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const [category, subcategory] = best.split("||");
  return { category, subcategory };
}

// ── Excel export ──────────────────────────────────────────────────────────────
function exportExcel(rows, fname) {
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(rows.map(r => ({
    "Product Title": r.title, "Category": r.category, "Sub-Category": r.subcategory
  })));
  ws1["!cols"] = [{ wch: 60 }, { wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Categorized Products");

  const sumMap = {};
  rows.forEach(r => { const k = `${r.category}||${r.subcategory}`; sumMap[k] = (sumMap[k] || 0) + 1; });
  const ws2 = XLSX.utils.json_to_sheet(
    Object.entries(sumMap).sort((a, b) => b[1] - a[1])
      .map(([k, n]) => { const [cat, sub] = k.split("||"); return { Category: cat, "Sub-Category": sub, Count: n }; })
  );
  ws2["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  const taxRows = [];
  for (const [cat, subs] of Object.entries(TAXONOMY))
    for (const [sub, kws] of Object.entries(subs))
      taxRows.push({ Category: cat, "Sub-Category": sub, Keywords: kws.join(", ") });
  const ws3 = XLSX.utils.json_to_sheet(taxRows);
  ws3["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Taxonomy & Keywords");

  XLSX.writeFile(wb, fname);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:  { background:"#080f1e", minHeight:"100vh", color:"#e2e8f0", fontFamily:"system-ui,sans-serif", padding:"24px 16px" },
  wrap:  { maxWidth:900, margin:"0 auto" },
  card:  { background:"#0d1829", border:"1px solid #1e2d45", borderRadius:16, padding:"22px 24px", marginBottom:14 },
  h2:    { margin:"0 0 14px", fontSize:16, fontWeight:700, color:"#f1f5f9" },
  label: { display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"#475569", marginBottom:6 },
  sel:   { background:"#111f33", border:"1px solid #1e3a5f", borderRadius:9, padding:"9px 13px", fontSize:13, color:"#e2e8f0", outline:"none" },
  btn:   (bg) => ({ background:bg||"#2563eb", color:"#fff", border:"none", borderRadius:10, padding:"10px 22px", fontWeight:700, fontSize:13, cursor:"pointer" }),
  stat:  { background:"#111f33", border:"1px solid #1e2d45", borderRadius:12, padding:"12px 14px", flex:1 },
};

function Bar({ pct, a, b }) {
  return (
    <div style={{ height:8, background:"#111f33", borderRadius:999, overflow:"hidden" }}>
      <div style={{ width:`${Math.max(pct,1)}%`, height:"100%", background:`linear-gradient(90deg,${a},${b})`, transition:"width 0.3s", borderRadius:999 }} />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase,   setPhase]   = useState("upload");
  const [file,    setFile]    = useState(null);
  const [cols,    setCols]    = useState([]);
  const [col,     setCol]     = useState("");
  const [prog,    setProg]    = useState({ total:0, done:0 });
  const [rows,    setRows]    = useState([]);
  const [live,    setLive]    = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [drag,    setDrag]    = useState(false);
  const [err,     setErr]     = useState("");

  const fileRef  = useRef();
  const rowsRef  = useRef([]);
  const timerRef = useRef(null);
  const t0Ref    = useRef(0);

  const tick   = () => { timerRef.current = setInterval(() => setElapsed(((Date.now() - t0Ref.current)/1000)|0), 600); };
  const noTick = () => clearInterval(timerRef.current);

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

  async function doProcess() {
    rowsRef.current = []; setRows([]); setLive([]);
    setPhase("running"); t0Ref.current = Date.now(); tick();

    // Pre-build keyword index
    buildIndex();

    try {
      const allRows = await new Promise((res, rej) => {
        const acc = [];
        Papa.parse(file, {
          header: true, skipEmptyLines: true,
          chunkSize: 3 * 1024 * 1024,
          chunk: results => {
            const batch = [];
            results.data.forEach(row => {
              const title = String(row[col] || "").trim();
              if (!title) return;
              const { category, subcategory } = classify(title);
              acc.push({ title, category, subcategory });
              batch.push({ title, category, subcategory });
            });
            setProg({ total: acc.length, done: acc.length });
            setLive(batch.slice(-6));
          },
          complete: () => res(acc), error: rej
        });
      });

      rowsRef.current = allRows;
      setRows(allRows);
      noTick();
      setPhase("done");
    } catch(e) { noTick(); setErr(e.message); setPhase("error"); }
  }

  function doExport() {
    exportExcel(rowsRef.current, `categorized_${file?.name?.replace(".csv","") || "products"}.xlsx`);
  }

  const fmtSec = s => s > 60 ? `${(s/60)|0}m ${s%60}s` : `${s}s`;
  const fmt    = n => (n||0).toLocaleString();

  const catSummary = {};
  rows.forEach(r => {
    if (!catSummary[r.category]) catSummary[r.category] = { total:0, subs:{} };
    catSummary[r.category].total++;
    catSummary[r.category].subs[r.subcategory] = (catSummary[r.category].subs[r.subcategory]||0)+1;
  });
  const sortedCats = Object.entries(catSummary).sort((a,b) => b[1].total - a[1].total);
  const pct = (n) => rows.length > 0 ? Math.round((n/rows.length)*100) : 0;

  const STEPS   = ["Upload","Column","Process","Done"];
  const STEP_I  = { upload:0, setup:1, running:2, done:3, error:0 };
  const curStep = STEP_I[phase]||0;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
      <div style={S.wrap}>

        {/* Header */}
        <div style={{ textAlign:"center", paddingBottom:22 }}>
          <div style={{ display:"inline-flex", gap:6, background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:999, padding:"4px 14px", fontSize:11, color:"#60a5fa", marginBottom:10 }}>
            ⚡ No API Key · Keyword NLP · Streaming · 3 GB+ · Excel Export
          </div>
          <h1 style={{ margin:"0 0 5px", fontSize:27, fontWeight:900, background:"linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            AI Product Categorizer
          </h1>
          <p style={{ margin:0, color:"#475569", fontSize:13 }}>Keyword NLP · Category → Sub-Category · 3 GB+ CSV → Excel</p>
        </div>

        {/* Step bar */}
        <div style={{ ...S.card, display:"flex", alignItems:"center", padding:"12px 20px", marginBottom:14 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, background: i<curStep?"#22c55e":i===curStep?"#3b82f6":"#111f33", color:i<=curStep?"#fff":"#475569", border:i>curStep?"1px solid #1e2d45":"none", boxShadow:i===curStep?"0 0 0 4px rgba(59,130,246,0.2)":"none" }}>
                  {i < curStep ? "✓" : i+1}
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:i<curStep?"#4ade80":i===curStep?"#93c5fd":"#334155", whiteSpace:"nowrap" }}>{label}</span>
              </div>
              {i < STEPS.length-1 && <div style={{ flex:1, height:1, background:"#1e2d45", margin:"0 8px" }} />}
            </div>
          ))}
        </div>

        {/* UPLOAD */}
        {phase === "upload" && (
          <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);loadFile(e.dataTransfer.files[0]);}}
            onClick={()=>fileRef.current.click()}
            style={{ ...S.card, textAlign:"center", padding:"60px 24px", cursor:"pointer", border:`2px dashed ${drag?"#3b82f6":"#1e2d45"}`, background:drag?"rgba(59,130,246,0.04)":"#0d1829" }}>
            <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])} />
            <div style={{ fontSize:52, marginBottom:12 }}>📦</div>
            <div style={{ fontSize:19, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>Drop your product CSV here</div>
            <div style={{ fontSize:12, color:"#475569", marginBottom:20 }}>Handles 3 GB+ · No API key needed · <code style={{ background:"#111f33", padding:"2px 7px", borderRadius:6, color:"#60a5fa" }}>product_title</code> auto-detected</div>
            <div style={S.btn()}>Browse File</div>
          </div>
        )}

        {/* SETUP */}
        {phase === "setup" && (
          <div style={S.card}>
            <h2 style={S.h2}>🗂 Select Product Title Column</h2>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
              <div>
                <label style={S.label}>Column to Categorize</label>
                <select value={col} onChange={e=>setCol(e.target.value)} style={{...S.sel, width:"100%"}}>
                  {cols.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div style={{ background:"#111f33", border:"1px solid #1e2d45", borderRadius:11, padding:"13px 15px", fontSize:12, color:"#64748b" }}>
                <div style={{ fontWeight:700, color:"#94a3b8", marginBottom:6 }}>📄 File Info</div>
                <div>Name: <span style={{color:"#cbd5e1"}}>{file?.name}</span></div>
                <div style={{marginTop:3}}>Size: <span style={{color:"#cbd5e1"}}>{((file?.size||0)/1024/1024).toFixed(1)} MB</span></div>
                <div style={{marginTop:3}}>Columns: <span style={{color:"#cbd5e1"}}>{cols.length}</span></div>
              </div>
            </div>

            {/* Taxonomy preview */}
            <div style={{ marginBottom:18 }}>
              <label style={S.label}>Taxonomy Preview ({Object.keys(TAXONOMY).length-1} Categories)</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(TAXONOMY).filter(([c])=>c!=="Uncategorized").map(([cat,subs],i) => (
                  <div key={cat} style={{ display:"flex", alignItems:"center", gap:6, background:"#111f33", border:"1px solid #1e2d45", borderRadius:9, padding:"6px 11px", fontSize:11 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:PAL[i%PAL.length], flexShrink:0 }} />
                    <span style={{ color:"#94a3b8" }}>{cat}</span>
                    <span style={{ color:"#334155" }}>· {Object.keys(subs).length} subcats</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={doProcess} style={S.btn()}>🚀 Start Categorizing →</button>
              <span style={{ fontSize:11, color:"#475569" }}>Pure keyword matching · No API · Instant results</span>
            </div>
          </div>
        )}

        {/* RUNNING */}
        {phase === "running" && (
          <div style={S.card}>
            <h2 style={{ ...S.h2, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ display:"inline-block", width:18, height:18, border:"2px solid #3b82f6", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
              Processing…
            </h2>
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Rows Processed</div><div style={{fontSize:20,fontWeight:800,color:"#93c5fd"}}>{fmt(prog.done)}</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Time Elapsed</div><div style={{fontSize:20,fontWeight:800,color:"#fde68a"}}>{fmtSec(elapsed)}</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Speed</div><div style={{fontSize:20,fontWeight:800,color:"#4ade80"}}>{elapsed>0?fmt((prog.done/elapsed)|0):0}/s</div></div>
            </div>
            <Bar pct={prog.total>0?100:5} a="#3b82f6" b="#8b5cf6" />
            {live.length > 0 && (
              <div style={{ marginTop:14 }}>
                <div style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Live Feed</div>
                {live.map((item,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#111f33",borderRadius:8,padding:"7px 12px",fontSize:11,marginBottom:4}}>
                    <span style={{flex:1,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</span>
                    <span style={{color:"#60a5fa",fontWeight:600,flexShrink:0}}>{item.category}</span>
                    <span style={{color:"#a78bfa",flexShrink:0}}>→ {item.subcategory}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DONE */}
        {phase === "done" && (
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{...S.h2,margin:0}}>✅ Categorization Complete!</h2>
              <button onClick={doExport} style={{...S.btn("#16a34a"),display:"flex",alignItems:"center",gap:8}}>
                📊 Download Excel
              </button>
            </div>

            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Total Rows</div><div style={{fontSize:20,fontWeight:800}}>{fmt(rows.length)}</div><div style={{fontSize:11,color:"#374151"}}>{((file?.size||0)/1024/1024).toFixed(1)} MB</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Categories Found</div><div style={{fontSize:20,fontWeight:800,color:"#93c5fd"}}>{sortedCats.length}</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Time Taken</div><div style={{fontSize:20,fontWeight:800,color:"#86efac"}}>{fmtSec(elapsed)}</div></div>
              <div style={S.stat}><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Uncategorized</div><div style={{fontSize:20,fontWeight:800,color:"#f87171"}}>{fmt((catSummary["Uncategorized"]||{total:0}).total)}</div><div style={{fontSize:11,color:"#374151"}}>{pct((catSummary["Uncategorized"]||{total:0}).total)}%</div></div>
            </div>

            <div style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Results by Category</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:400,overflowY:"auto"}}>
              {sortedCats.map(([cat, data], i) => (
                <div key={cat} style={{background:"#111f33",border:"1px solid #1e2d45",borderRadius:11,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:PAL[i%PAL.length],flexShrink:0}} />
                    <span style={{fontWeight:700,fontSize:13,color:"#e2e8f0",flex:1}}>{cat}</span>
                    <span style={{fontSize:12,color:"#60a5fa",fontWeight:700}}>{fmt(data.total)}</span>
                    <span style={{fontSize:11,color:"#475569"}}>({pct(data.total)}%)</span>
                  </div>
                  <div style={{height:5,background:"#1e2d45",borderRadius:999,overflow:"hidden",marginBottom:8}}>
                    <div style={{width:`${pct(data.total)}%`,height:"100%",background:PAL[i%PAL.length]+"bb",borderRadius:999}} />
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingLeft:16}}>
                    {Object.entries(data.subs).sort((a,b)=>b[1]-a[1]).map(([sub,cnt]) => (
                      <span key={sub} style={{background:"rgba(255,255,255,0.04)",border:"1px solid #1e2d45",borderRadius:999,padding:"2px 9px",fontSize:11,color:"#94a3b8"}}>
                        {sub} <span style={{color:"#60a5fa",fontWeight:700}}>{fmt(cnt)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:14,background:"rgba(22,163,74,0.07)",border:"1px solid rgba(22,163,74,0.2)",borderRadius:11,padding:"13px 16px",fontSize:12,color:"#4ade80",display:"flex",gap:10}}>
              <span style={{fontSize:18}}>📊</span>
              <div><b>Excel: 3 sheets</b> — Categorized Products · Summary · Taxonomy &amp; Keywords
                <div style={{color:"#16a34a",marginTop:3,fontSize:11}}>All {fmt(rows.length)} rows with Category + Sub-Category. Taxonomy sheet lists all keywords used.</div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div style={{background:"rgba(127,29,29,0.12)",border:"1px solid rgba(220,38,38,0.25)",borderRadius:16,padding:"22px 24px"}}>
            <div style={{fontSize:16,fontWeight:700,color:"#f87171",marginBottom:10}}>❌ Error</div>
            <div style={{fontFamily:"monospace",fontSize:12,background:"rgba(127,29,29,0.18)",color:"#fca5a5",borderRadius:9,padding:"10px 13px",marginBottom:12}}>{err}</div>
            <button onClick={()=>{setPhase("upload");setFile(null);setErr("");setRows([]);setProg({total:0,done:0});}}
              style={{...S.btn("#1e293b"),border:"1px solid #334155",color:"#cbd5e1"}}>↩ Start Over</button>
          </div>
        )}

        <div style={{textAlign:"center",fontSize:11,color:"#1e2d45",paddingTop:8}}>
          Keyword NLP · {Object.keys(TAXONOMY).length-1} categories · {Object.values(TAXONOMY).flatMap(s=>Object.values(s)).flat().length}+ keywords · No API key required
        </div>
      </div>
    </div>
  );
}
