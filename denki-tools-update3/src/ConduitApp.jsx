import { useState, useMemo } from "react";

/* 電線管サイズ選定ツール — denki-tools
   デザイントークンはラックチェッカーと共通 */

const INK = "#22272B";
const SUB = "#69737D";
const PAPER = "#F3F4F1";
const CARD = "#FFFFFF";
const LINE = "#E1E4DE";
const STEEL = "#7A838C";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

/* 電線DB：[名称, 仕上外径mm]（被覆含む・代表的な概算値、編集可） */
const WIRE_DB = [
  { group: "IV・EM-IE（絶縁電線）", color: "#D9480F", items: [
    ["IV 1.6", 3.2], ["IV 2.0", 3.6], ["IV 2.6", 4.4], ["IV 5.5sq", 5.2], ["IV 8sq", 6.0],
    ["IV 14sq", 7.6], ["IV 22sq", 9.2], ["IV 38sq", 11.4], ["IV 60sq", 13.8], ["IV 100sq", 17.0],
    ["EM-IE 1.6", 3.4], ["EM-IE 2.0", 3.8], ["EM-IE 5.5sq", 5.4], ["EM-IE 8sq", 6.2], ["EM-IE 14sq", 7.8],
  ]},
  { group: "CV・CVT（ケーブル）", color: "#DD8500", items: [
    ["CV 2sq-2C", 10.5], ["CV 5.5sq-2C", 12.5], ["CV 8sq-2C", 14], ["CV 14sq-2C", 16.5],
    ["CV 2sq-3C", 11.5], ["CV 3.5sq-3C", 12.5], ["CV 5.5sq-3C", 13.5], ["CV 8sq-3C", 15.5],
    ["CV 14sq-3C", 18], ["CV 22sq-3C", 20], ["CV 38sq-3C", 24],
    ["CVT 14sq", 19], ["CVT 22sq", 21], ["CVT 38sq", 25], ["CVT 60sq", 30], ["CVT 100sq", 36], ["CVT 150sq", 42],
  ]},
  { group: "制御・弱電", color: "#1971C2", items: [
    ["CVV 1.25sq-3C", 10.5], ["CVV 1.25sq-4C", 11], ["CVV 1.25sq-7C", 12.5], ["CVV 1.25sq-10C", 15], ["CVV 1.25sq-14C", 16],
    ["CVV 2.0sq-2C", 10.5], ["CVV 2.0sq-3C", 11], ["CVV 2.0sq-4C", 12], ["CVV 2.0sq-6C", 14], ["CVV 2.0sq-8C", 15.5],
    ["CVVS 1.25sq-2C", 11], ["CVVS 1.25sq-3C", 11.5], ["CVVS 1.25sq-4C", 12.5], ["CVVS 1.25sq-7C", 14],
    ["JKVV 0.75sq-3C", 7.7], ["JKVV 0.75sq-5C", 9.1], ["JKVV 0.75sq-7C", 10],
    ["JKVVS 0.75sq-3C", 8.7], ["JKVVS 0.75sq-4C", 9.4], ["JKVVS 0.75sq-6C", 10.8], ["JKVVS 0.75sq-7C", 11], ["JKVVS 1.25sq-2C", 9.3],
    ["VCTF 1.25sq-3C", 8],
    ["LAN Cat5e", 5.5], ["LAN Cat6", 6.5], ["LAN Cat6A", 7.5],
    ["光ケーブル 4心", 9], ["ディストリビューションケーブル", 9],
    ["FCPEV 0.75sq-1P", 6.5], ["FCPEV 0.75sq-2P", 8.5], ["FCPEV 0.9-5P", 9.5], ["FCPEV 0.9-10P", 11.5],
  ]},
];
const FLAT = {};
WIRE_DB.forEach((g) => g.items.forEach(([n, d]) => { FLAT[n] = { dia: d, color: g.color }; }));

/* 電線管DB：[呼び, 内径mm]（代表値・概算。編集は本ファイル上部で） */
const CONDUITS = [
  { key: "PF", label: "PF管（合成樹脂可とう管）", sizes: [["PF14", 14], ["PF16", 16], ["PF22", 22], ["PF28", 28], ["PF36", 36], ["PF42", 42]] },
  { key: "CD", label: "CD管（コンクリート埋設専用）", sizes: [["CD14", 14], ["CD16", 16], ["CD22", 22], ["CD28", 28], ["CD36", 36], ["CD42", 42]] },
  { key: "E", label: "ねじなし電線管（E管）", sizes: [["E19", 16.7], ["E25", 23.0], ["E31", 29.0], ["E39", 35.3], ["E51", 48.0], ["E63", 60.3], ["E75", 72.6]] },
  { key: "C", label: "薄鋼電線管（C管）", sizes: [["C19", 15.9], ["C25", 22.2], ["C31", 28.6], ["C39", 34.9], ["C51", 47.6], ["C63", 59.5], ["C75", 72.2]] },
  { key: "G", label: "厚鋼電線管（G管）", sizes: [["G16", 16.4], ["G22", 21.9], ["G28", 28.3], ["G36", 36.9], ["G42", 42.8], ["G54", 54.0], ["G70", 69.6], ["G82", 82.3], ["G104", 106.4]] },
  { key: "FEP", label: "FEP管（波付合成樹脂・地中）", sizes: [["FEP30", 30], ["FEP40", 40], ["FEP50", 50], ["FEP65", 65], ["FEP80", 80], ["FEP100", 100], ["FEP125", 125], ["FEP150", 150]] },
];

const TEMPLATES = [
  { name: "照明回路", rows: [["IV 1.6", 4]] },
  { name: "コンセント回路", rows: [["IV 2.0", 3]] },
  { name: "動力分岐", rows: [["CV 8sq-3C", 1], ["IV 5.5sq", 1]] },
  { name: "LAN配線", rows: [["LAN Cat6", 4]] },
  { name: "引込（FEP）", rows: [["CVT 60sq", 1], ["IV 14sq", 1]] },
];

let uid = 1;
const mkRow = (name, count) => ({ id: uid++, name, dia: FLAT[name].dia, count, color: FLAT[name].color, custom: false });

const areaOf = (d) => (Math.PI / 4) * d * d;
const fmt = (v) => { const r = Math.round(v * 10) / 10; return Number.isInteger(r) ? String(r) : r.toFixed(1); };

function judgeFill(pct, ratio) {
  if (pct == null || !isFinite(pct)) return { label: "—", color: SUB, bg: "#EEF0EC" };
  if (pct <= ratio * 0.7) return { label: "余裕あり", color: "#2B8A3E", bg: "#E6F4EA" };
  if (pct <= ratio) return { label: "適合", color: "#2B8A3E", bg: "#E6F4EA" };
  return { label: "超過", color: "#C92A2A", bg: "#FBE5E5" };
}

const Chip = ({ pct, ratio }) => {
  const j = judgeFill(pct, ratio);
  return (
    <span style={{ color: j.color, background: j.bg, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
      {pct != null && isFinite(pct) ? `${Math.round(pct)}%・${j.label}` : j.label}
    </span>
  );
};

const Bar = ({ pct, ratio }) => (
  <div style={{ background: "#ECEEE9", borderRadius: 99, height: 8, overflow: "hidden", position: "relative" }}>
    <div style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: judgeFill(pct, ratio).color, height: "100%", borderRadius: 99, transition: "width .25s ease" }} />
    <div style={{ position: "absolute", left: `${ratio}%`, top: -1, width: 2, height: 10, background: INK, opacity: 0.5 }} />
  </div>
);

/* ===== 断面図：管の円に電線を下から詰める簡易パッキング ===== */
function layoutWires(items, R) {
  const sorted = [];
  items.forEach((r) => {
    const d = Number(r.dia) || 0;
    if (d <= 0) return;
    for (let i = 0; i < r.count; i++) sorted.push({ d, color: r.color });
  });
  sorted.sort((a, b) => b.d - a.d);
  const out = [];
  let idx = 0;
  let yBottom = -R + 0.5;
  let guard = 0;
  while (idx < sorted.length && guard < 60) {
    guard++;
    const rowH = sorted[idx].d;
    const yc = yBottom + rowH / 2;
    let half = Math.sqrt(Math.max(0, R * R - yc * yc)) - 0.5;
    if (half < rowH / 2) half = rowH / 2 + 0.5;
    const row = [];
    let w = 0;
    while (idx < sorted.length && w + sorted[idx].d <= 2 * half) {
      row.push(sorted[idx]); w += sorted[idx].d; idx++;
    }
    if (row.length === 0) { row.push(sorted[idx]); w = sorted[idx].d; idx++; }
    let x = -w / 2;
    row.forEach((it) => { out.push({ cx: x + it.d / 2, cy: yc, r: it.d / 2, color: it.color }); x += it.d; });
    yBottom += rowH * 0.87;
  }
  return out;
}

function ConduitSection({ rows, sizeName, innerDia, fillPct, ratio }) {
  const R = innerDia / 2;
  const k = 100 / R;               /* 内半径を100pxに正規化 */
  const CX = 170, CY = 128;
  const wires = layoutWires(rows, R);
  const wall = 10;
  const over = fillPct > ratio;
  return (
    <svg viewBox="0 0 340 300" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="電線管断面イメージ">
      <defs>
        <marker id="carr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0L10,5L0,10z" fill={INK} />
        </marker>
      </defs>
      <circle cx={CX} cy={CY} r={100 + wall} fill={STEEL} />
      <circle cx={CX} cy={CY} r={100} fill="#FBFBF9" />
      {wires.map((w, i) => (
        <circle key={i} cx={CX + w.cx * k} cy={CY - w.cy * k} r={Math.max(w.r * k - 0.8, 1.5)}
          fill={w.color} fillOpacity={0.16} stroke={w.color} strokeWidth={2} />
      ))}
      {/* 内径寸法線 */}
      <line x1={CX - 100} y1={CY + 100 + wall + 16} x2={CX + 100} y2={CY + 100 + wall + 16} stroke={INK} strokeWidth={1.4} markerStart="url(#carr)" markerEnd="url(#carr)" />
      <text x={CX} y={CY + 100 + wall + 38} textAnchor="middle" fontSize={14}
        style={{ fontFamily: MONO, fontWeight: 600, fill: INK }}>{sizeName}　内径 {fmt(innerDia)}</text>
      <text x={CX} y={26} textAnchor="middle" fontSize={14}
        style={{ fontFamily: MONO, fontWeight: 600, fill: over ? "#C92A2A" : INK }}>
        占積率 {Math.round(fillPct)}%{over ? "（超過）" : ""}
      </text>
    </svg>
  );
}

/* ================= main ================= */
export default function ConduitChecker() {
  const [rows, setRows] = useState(() => TEMPLATES[0].rows.map(([n, c]) => mkRow(n, c)));
  const [pick, setPick] = useState("IV 2.0");
  const [ratioSel, setRatioSel] = useState("32");
  const [ratioManual, setRatioManual] = useState(32);
  const [detail, setDetail] = useState("PF");

  const ratio = ratioSel === "manual" ? Math.max(1, Number(ratioManual) || 32) : Number(ratioSel);

  const calc = useMemo(() => {
    const totalA = rows.reduce((s, r) => s + areaOf(Number(r.dia) || 0) * r.count, 0);
    const totalN = rows.reduce((s, r) => s + r.count, 0);
    const recs = CONDUITS.map((c) => {
      const hit = c.sizes.find(([, id]) => totalA <= areaOf(id) * (ratio / 100));
      return { key: c.key, label: c.label, rec: hit ? hit[0] : null, recDia: hit ? hit[1] : null,
        pct: hit ? (totalA / areaOf(hit[1])) * 100 : null };
    });
    return { totalA, totalN, recs };
  }, [rows, ratio]);

  const detailConduit = CONDUITS.find((c) => c.key === detail);
  const detailRec = calc.recs.find((r) => r.key === detail);
  const drawSize = detailRec.rec
    ? [detailRec.rec, detailRec.recDia]
    : detailConduit.sizes[detailConduit.sizes.length - 1];

  const addRow = () => setRows((rs) => {
    const hit = rs.find((r) => !r.custom && r.name === pick);
    if (hit) return rs.map((r) => (r.id === hit.id ? { ...r, count: r.count + 1 } : r));
    return [...rs, mkRow(pick, 1)];
  });
  const addCustom = () => setRows((rs) => [...rs, { id: uid++, name: "カスタム", dia: 10, count: 1, color: SUB, custom: true }]);
  const patch = (id, p) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id) => setRows((rs) => rs.filter((r) => r.id !== id));

  const card = { background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 };
  const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: SUB, fontWeight: 600, marginBottom: 8 };
  const selectSt = { border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 10px", fontSize: 14, background: "#FBFBF9", color: INK, width: "100%" };
  const numSt = { ...selectSt, width: 70, textAlign: "right", fontFamily: MONO, fontWeight: 600, padding: "7px 8px" };

  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "'IBM Plex Sans JP','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans+JP:wght@400;500;700&display=swap');
        input:focus, select:focus, button:focus-visible { outline: 2px solid #1971C2; outline-offset: 1px; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 14px 60px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: SUB, fontWeight: 600 }}>CONDUIT SIZE CHECK</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 4px" }}>電線管サイズ選定ツール</h1>
          <p style={{ fontSize: 13, color: SUB, margin: 0 }}>入れる電線・ケーブルを選ぶと、収容率{ratio}%基準で各管種の適合サイズを判定します。</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={eyebrow}>テンプレート</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => setRows(t.rows.map(([n, c]) => mkRow(n, c)))}
                style={{ border: `1px solid ${LINE}`, background: CARD, borderRadius: 99, padding: "7px 12px", fontSize: 13, fontWeight: 600, color: INK, cursor: "pointer" }}>{t.name}</button>
            ))}
            <button onClick={() => setRows([])} style={{ border: "none", background: "none", color: SUB, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>クリア</button>
          </div>
        </div>

        {/* wires */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>収容する電線・ケーブル</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.length === 0 && <div style={{ fontSize: 13, color: SUB, padding: "8px 0" }}>下の一覧から電線を追加してください。</div>}
            {rows.map((r) => (
              <div key={r.id} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: r.color, flexShrink: 0 }} />
                  {r.custom ? (
                    <input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })}
                      style={{ ...selectSt, padding: "6px 8px", fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }} />
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }}>{r.name}</div>
                  )}
                  <button onClick={() => remove(r.id)} aria-label="削除" style={{ border: "none", background: "none", color: "#A2AAB2", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>×</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: SUB }}>
                    φ<input type="number" inputMode="decimal" step="0.1" min="1" value={r.dia}
                      onChange={(e) => patch(r.id, { dia: e.target.value === "" ? "" : Number(e.target.value) })} style={{ ...numSt, width: 58 }} />mm
                  </label>
                  <div style={{ display: "flex", alignItems: "center", border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
                    <button onClick={() => patch(r.id, { count: Math.max(0, r.count - 1) })} style={{ width: 34, height: 34, border: "none", background: "#F5F6F3", fontSize: 16, cursor: "pointer", color: INK }}>−</button>
                    <div style={{ width: 40, textAlign: "center", fontFamily: MONO, fontWeight: 600, fontSize: 15 }}>{r.count}</div>
                    <button onClick={() => patch(r.id, { count: r.count + 1 })} style={{ width: 34, height: 34, border: "none", background: "#F5F6F3", fontSize: 16, cursor: "pointer", color: INK }}>＋</button>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: SUB }}>
                    断面積 <span style={{ fontFamily: MONO, fontWeight: 600, color: INK }}>{fmt(areaOf(Number(r.dia) || 0) * r.count)}</span> mm²
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...selectSt, flex: 1, minWidth: 0 }}>
              {WIRE_DB.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map(([n, d]) => <option key={n} value={n}>{n}（φ{d}）</option>)}
                </optgroup>
              ))}
            </select>
            <button onClick={addRow} style={{ background: INK, color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>追加</button>
          </div>
          <button onClick={addCustom} style={{ border: "none", background: "none", color: SUB, fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 8, padding: 0 }}>＋ カスタム電線を追加</button>
        </div>

        {/* ratio */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>収容率の基準</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select value={ratioSel} onChange={(e) => setRatioSel(e.target.value)} style={{ ...selectSt, width: "auto", flex: 1, minWidth: 200 }}>
              <option value="32">32%（標準・太さ混在／増設考慮）</option>
              <option value="48">48%（同一太さのみ・増設なし）</option>
              <option value="manual">手入力（社内基準など）</option>
            </select>
            {ratioSel === "manual" && (
              <label style={{ fontSize: 12, color: SUB, display: "flex", alignItems: "center", gap: 5 }}>
                <input type="number" inputMode="numeric" min="1" max="100" value={ratioManual} onChange={(e) => setRatioManual(e.target.value)} style={numSt} />%
              </label>
            )}
          </div>
        </div>

        {/* results */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>判定結果</div>
          {calc.totalA === 0 ? (
            <div style={{ fontSize: 13, color: SUB }}>電線を追加すると結果が表示されます。</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#F7F8F5", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>
                電線 <span style={{ fontFamily: MONO, fontWeight: 600 }}>{calc.totalN}</span> 本・断面積合計（被覆含む）
                <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 18, marginLeft: 6 }}>{fmt(calc.totalA)}</span> mm²
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {calc.recs.map((r) => (
                  <button key={r.key} onClick={() => setDetail(r.key)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, border: `1px solid ${detail === r.key ? "#B9C0B8" : LINE}`, background: detail === r.key ? "#F1F3EE" : CARD, cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <div style={{ fontSize: 12, color: SUB, flex: 1, minWidth: 0 }}>{r.label}</div>
                    {r.rec ? (
                      <>
                        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 16 }}>{r.rec}</div>
                        <Chip pct={r.pct} ratio={ratio} />
                      </>
                    ) : (
                      <span style={{ color: "#C92A2A", fontSize: 12, fontWeight: 700 }}>最大サイズでも不可 → 分割検討</span>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: SUB }}>行をタップすると下に断面図とサイズ別の占積率が出ます。</div>
            </div>
          )}
        </div>

        {/* detail */}
        {calc.totalA > 0 && (
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={eyebrow}>{detailConduit.label}｜断面イメージ（縮尺）とサイズ別占積率</div>
            <ConduitSection rows={rows} sizeName={drawSize[0]} innerDia={drawSize[1]}
              fillPct={(calc.totalA / areaOf(drawSize[1])) * 100} ratio={ratio} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
              {detailConduit.sizes.map(([nm, id]) => {
                const pct = (calc.totalA / areaOf(id)) * 100;
                const isRec = detailRec.rec === nm;
                return (
                  <div key={nm} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 8, background: isRec ? "#F1F3EE" : "transparent" }}>
                    <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 13, width: 78, flexShrink: 0 }}>
                      {nm}{isRec && <span style={{ color: "#2B8A3E", fontSize: 10, marginLeft: 3, fontFamily: "inherit" }}>推奨</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 40 }}><Bar pct={pct} ratio={ratio} /></div>
                    <div style={{ flexShrink: 0 }}><Chip pct={pct} ratio={ratio} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* notes */}
        <div style={{ fontSize: 11, color: SUB, lineHeight: 1.8, padding: "0 4px" }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>前提・注意</div>
          ・判定は「電線の被覆絶縁物を含む断面積の総和 ≦ 管内断面積 × 収容率」によります。太さの異なる電線を混在させる場合や増設を見込む場合は32%（内線規程）、同一太さのみで増設を見込まない場合は電線本数表（おおむね48%相当）が目安です。<br />
          ・電線外径・管内径は代表的な概算値です。実施設計ではメーカーカタログ・JIS値で確認してください。<br />
          ・CD管はコンクリート埋設専用（自己消火性なし）。露出・隠ぺい配管にはPF管を使用してください。<br />
          ・こう長が長い場合や屈曲が多い場合は、収容率が適合していても通線抵抗で入線困難になることがあります。プルボックスの設置・1サイズアップも検討を。
        </div>

        {/* 解説（SEO） */}
        <article style={{ marginTop: 28, background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "20px 18px", fontSize: 13, lineHeight: 2 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>電線管の太さ選定の考え方</h2>
          <p style={{ margin: "0 0 18px", color: "#454C52" }}>
            電線管に収める電線は、被覆絶縁物を含む断面積の総和が管の内断面積の32%以下となるように選定するのが内線規程の基本です（同一太さの電線のみを収め、増設を見込まない場合は電線本数表によることができ、これはおおむね48%に相当します）。本ツールはこの断面積比較を全管種で一括計算し、PF管・CD管・ねじなし電線管・薄鋼・厚鋼・FEPそれぞれの適合サイズを提示します。
          </p>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>管種の使い分けの目安</h2>
          <p style={{ margin: 0, color: "#454C52" }}>
            屋内の隠ぺい・露出にはPF管（自己消火性あり）、コンクリート打込みにはCD管（オレンジ色・埋設専用）、機械的強度が必要な露出部や重量物のある場所には金属管（ねじなし・薄鋼・厚鋼）、地中埋設の引込・幹線にはFEP管、が一般的な使い分けです。計算結果は参考情報のため、実施設計では特記仕様書・社内基準に従ってください。
          </p>
                  <p style={{ margin: "18px 0 0", fontSize: 12 }}>関連用語：<a href="../words/conduit-fill/" style={{ color: "#1971C2" }}>電線管の収容率</a>／<a href="../words/cd-pf/" style={{ color: "#1971C2" }}>CD管とPF管の違い</a></p>
        </article>

        <footer style={{ marginTop: 20, fontSize: 12, color: SUB, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <a href="../" style={{ color: SUB }}>← ツール一覧へ</a>
          <a href="https://forms.gle/ifJ9uVDc1QBDRZas8" target="_blank" rel="noopener" style={{ color: SUB }}>機能リクエスト</a>
          <a href="../rack-checker/" style={{ color: SUB }}>ケーブルラック占有率チェッカー →</a>
        </footer>
      </div>
    </div>
  );
}
