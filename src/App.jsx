import { useState, useMemo } from "react";

/* ================= design tokens =================
   paper #F3F4F1 / ink #22272B / steel #7A838C
   強電・電力 #D9480F ／ 強電・制御 #E08A00 ／ 弱電 #1971C2
   type: IBM Plex Sans JP (UI) + IBM Plex Mono (寸法値)
================================================== */

const INK = "#22272B";
const SUB = "#69737D";
const PAPER = "#F3F4F1";
const CARD = "#FFFFFF";
const LINE = "#E1E4DE";
const STEEL = "#7A838C";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

const CAT = {
  power: { label: "強電・電力", short: "電力", color: "#D9480F", bg: "#FCEDE5" },
  ctrl: { label: "強電・制御", short: "制御", color: "#DD8500", bg: "#FBF2DF" },
  weak: { label: "弱電・計装/通信", short: "弱電", color: "#1971C2", bg: "#E7F0FA" },
};
const CAT_ORDER = ["power", "ctrl", "weak"];

/* ケーブルDB：[名称, 仕上外径mm, 概算質量kg/m]
   ※どちらも代表的な概算値。行ごとに編集可。社内標準に合わせて書き換えてOK */
const DB = [
  { group: "CVT（電力・トリプレックス）", cat: "power", items: [
    ["CVT 8sq", 17, 0.4], ["CVT 14sq", 19, 0.6], ["CVT 22sq", 21, 0.85], ["CVT 38sq", 25, 1.35],
    ["CVT 60sq", 30, 1.9], ["CVT 100sq", 36, 3.3], ["CVT 150sq", 42, 4.7], ["CVT 200sq", 47, 6.1],
    ["CVT 250sq", 52, 7.4], ["CVT 325sq", 57, 9.4],
  ]},
  { group: "CV 3心（電力）", cat: "power", items: [
    ["CV 2sq-3C", 11.5, 0.19], ["CV 3.5sq-3C", 12.5, 0.25], ["CV 5.5sq-3C", 13.5, 0.32], ["CV 8sq-3C", 15.5, 0.45],
    ["CV 14sq-3C", 18, 0.65], ["CV 22sq-3C", 20, 0.9], ["CV 38sq-3C", 24, 1.4], ["CV 60sq-3C", 29, 2.1], ["CV 100sq-3C", 36, 3.4],
  ]},
  { group: "CV 2心（電力）", cat: "power", items: [
    ["CV 2sq-2C", 10.5, 0.15], ["CV 5.5sq-2C", 12.5, 0.25], ["CV 8sq-2C", 14, 0.33], ["CV 14sq-2C", 16.5, 0.48],
  ]},
  { group: "CVV / CVVS（制御）", cat: "ctrl", items: [
    ["CVV 1.25sq-2C", 9.5, 0.11], ["CVV 1.25sq-3C", 10.5, 0.13], ["CVV 1.25sq-4C", 11, 0.15], ["CVV 1.25sq-7C", 12.5, 0.21], ["CVV 1.25sq-10C", 15, 0.3],
    ["CVV 1.25sq-14C", 16, 0.37], ["CVV 1.25sq-19C", 17.5, 0.45], ["CVV 1.25sq-30C", 21.5, 0.65],
    ["CVV 2.0sq-2C", 10.5, 0.14], ["CVV 2.0sq-3C", 11, 0.17], ["CVV 2.0sq-4C", 12, 0.19], ["CVV 2.0sq-6C", 14, 0.28], ["CVV 2.0sq-7C", 14, 0.28], ["CVV 2.0sq-8C", 15.5, 0.34],
    ["CVVS 1.25sq-2C", 11, 0.16], ["CVVS 1.25sq-3C", 11.5, 0.18], ["CVVS 1.25sq-4C", 12.5, 0.21], ["CVVS 1.25sq-7C", 14, 0.26], ["CVVS 1.25sq-10C", 16.5, 0.36],
  ]},
  { group: "JKVV / JKVVS・VCTF（計装）", cat: "weak", items: [
    ["JKVV 0.75sq-2C", 7.3, 0.06], ["JKVV 0.75sq-3C", 7.7, 0.08], ["JKVV 0.75sq-4C", 8.4, 0.09], ["JKVV 0.75sq-5C", 9.1, 0.11], ["JKVV 0.75sq-7C", 10, 0.14],
    ["JKVVS 0.75sq-2C", 8.3, 0.08], ["JKVVS 0.75sq-3C", 8.7, 0.09], ["JKVVS 0.75sq-4C", 9.4, 0.11], ["JKVVS 0.75sq-6C", 10.8, 0.14], ["JKVVS 0.75sq-7C", 11, 0.15],
    ["JKVVS 1.25sq-2C", 9.3, 0.1],
    ["VCTF 1.25sq-3C", 8, 0.09],
  ]},
  { group: "KPEV / KPEV-S（計装）", cat: "weak", items: [
    ["KPEV 1.25sq-1P", 9, 0.09], ["KPEV 1.25sq-2P", 11.5, 0.14], ["KPEV 1.25sq-3P", 12.5, 0.17],
    ["KPEV 1.25sq-5P", 14.5, 0.24], ["KPEV 1.25sq-10P", 19, 0.42],
    ["KPEV-S 1.25sq-1P", 10, 0.1], ["KPEV-S 1.25sq-2P", 12.5, 0.16], ["KPEV-S 1.25sq-3P", 13.5, 0.19],
    ["KPEV-S 1.25sq-5P", 15.5, 0.27], ["KPEV-S 1.25sq-10P", 20, 0.46],
  ]},
  { group: "通信・弱電", cat: "weak", items: [
    ["FCPEV 0.75sq-1P", 6.5, 0.05], ["FCPEV 0.75sq-2P", 8.5, 0.07], ["FCPEV 0.75sq-3P", 9, 0.09], ["FCPEV 0.75sq-5P", 10, 0.11], ["FCPEV 0.75sq-10P", 12.5, 0.17], ["FCPEV 0.75sq-15P", 14, 0.22],
    ["FCPEV 0.9-5P", 9.5, 0.09], ["FCPEV 0.9-10P", 11.5, 0.14], ["FCPEV 0.9-20P", 14.5, 0.24],
    ["ディストリビューションケーブル", 9, 0.08],
    ["LAN Cat5e", 5.5, 0.03], ["LAN Cat6", 6.5, 0.04], ["LAN Cat6A", 7.5, 0.05],
    ["同軸 3C-2V", 5.4, 0.04], ["同軸 5C-FB", 7.7, 0.06], ["光ケーブル 4心", 9, 0.05], ["AE 0.9-2C", 6.5, 0.04],
  ]},
];

const FLAT = {};
DB.forEach((g) => g.items.forEach(([n, d, w]) => { FLAT[n] = { dia: d, wt: w, cat: g.cat }; }));

const RACK_WIDTHS = [200, 300, 400, 500, 600, 800, 1000, 1200];

/* ============ 許容静荷重（ネグロス技術資料ベース・参考値） ============
   単位：kgf/m（≒kg/m）。両端支持・等分布荷重の値。
   支持間隔 SPANS = [1.0, 1.5, 2.0, 2.5, 3.0] m に対応する5値。
   幅アンカー（200/400/800）の間は直線補間。800mm超はデータなし扱い。
   ステンレス(S-)は幅200の値を鋼製との比率で幅方向に展開した推定値。
   ※採用時は必ず最新のネグロスカタログ・技術資料で確認すること */
const SPANS = [1.0, 1.5, 2.0, 2.5, 3.0];
const SERIES = {
  SR: { label: "SR形（親桁70mm・鋼製）", anchors: { 200: [609, 269, 111, 55, 31], 400: [428, 268, 111, 55, 30], 800: [240, 240, 111, 53, 28] } },
  QR: { label: "QR形（親桁100mm・鋼製）", anchors: { 200: [1635, 723, 404, 217, 124], 400: [821, 722, 403, 216, 123], 800: [383, 383, 383, 214, 121] } },
  SSR: { label: "S-SR形（ステンレス）", base: "SR", anchor200: [410, 180, 80, 40, 22] },
  SQR: { label: "S-QR形（ステンレス）", base: "QR", anchor200: [1085, 479, 268, 155, 88] },
  manual: { label: "手入力（社内基準値など）" },
};

const interpAllow = (anchors, width, si) => {
  const ws = Object.keys(anchors).map(Number).sort((a, b) => a - b);
  if (width > ws[ws.length - 1]) return null;
  if (width <= ws[0]) return anchors[ws[0]][si];
  for (let i = 0; i < ws.length - 1; i++) {
    const a = ws[i], b = ws[i + 1];
    if (width <= b) {
      const t = (width - a) / (b - a);
      return anchors[a][si] + (anchors[b][si] - anchors[a][si]) * t;
    }
  }
  return anchors[ws[ws.length - 1]][si];
};

function allowFor(sKey, width, si, manual) {
  if (sKey === "manual") return manual > 0 ? manual : null;
  const s = SERIES[sKey];
  if (s.base) {
    const base = SERIES[s.base];
    const b = interpAllow(base.anchors, width, si);
    if (b == null) return null;
    return b * (s.anchor200[si] / base.anchors[200][si]);
  }
  return interpAllow(s.anchors, width, si);
}

const TEMPLATES = [
  { name: "動力幹線", desc: "電力のみ", rows: [["CVT 100sq", 2], ["CVT 60sq", 2], ["CV 38sq-3C", 3], ["CV 8sq-3C", 4]] },
  { name: "動力＋制御", desc: "強電のみ", rows: [["CV 38sq-3C", 2], ["CV 14sq-3C", 4], ["CV 5.5sq-3C", 6], ["CVV 1.25sq-7C", 6], ["CVV 1.25sq-14C", 3]] },
  { name: "計装・通信", desc: "弱電のみ", rows: [["KPEV-S 1.25sq-1P", 12], ["KPEV-S 1.25sq-2P", 6], ["KPEV-S 1.25sq-10P", 2], ["FCPEV 0.9-10P", 2], ["LAN Cat6", 8]] },
  { name: "強弱混在", desc: "要セパレーター", rows: [["CV 8sq-3C", 4], ["CV 5.5sq-3C", 4], ["CVV 1.25sq-7C", 4], ["KPEV-S 1.25sq-2P", 8], ["LAN Cat6", 6], ["FCPEV 0.9-5P", 2]] },
];

let uid = 1;
const mkRow = (name, count) => ({ id: uid++, name, dia: FLAT[name].dia, wt: FLAT[name].wt, count, cat: FLAT[name].cat, custom: false });

const fmt = (v) => {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};
const fmt2 = (v) => {
  const r = Math.round(v * 100) / 100;
  return String(r);
};

function judge(pct) {
  if (pct == null || !isFinite(pct)) return { label: "データなし", color: SUB, bg: "#EEF0EC" };
  if (pct <= 50) return { label: "余裕あり", color: "#2B8A3E", bg: "#E6F4EA" };
  if (pct <= 70) return { label: "適正", color: "#2B8A3E", bg: "#E6F4EA" };
  if (pct <= 90) return { label: "注意", color: "#E67700", bg: "#FDF0DD" };
  if (pct <= 100) return { label: "限界", color: "#D9480F", bg: "#FCE9E0" };
  return { label: "超過", color: "#C92A2A", bg: "#FBE5E5" };
}

const JChip = ({ pct, prefix = "" }) => {
  const j = judge(pct);
  return (
    <span style={{ color: j.color, background: j.bg, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
      {pct != null && isFinite(pct) ? `${prefix}${Math.round(pct)}%・${j.label}` : `${prefix}${j.label}`}
    </span>
  );
};

const Bar = ({ pct, color }) => (
  <div style={{ background: "#ECEEE9", borderRadius: 99, height: 8, overflow: "hidden" }}>
    <div style={{ width: `${pct == null ? 0 : Math.max(2, Math.min(100, pct))}%`, background: color, height: "100%", borderRadius: 99, transition: "width .25s ease" }} />
  </div>
);

/* ============ 断面図（縮尺・寸法線つき） ============ */
function RackSection({ c, sepLoss, stack }) {
  const { W, sepUsed, pos, strong, weak, mixed } = c;
  const M = 70;
  const railTop = 84;
  const railH = 96;
  const bottomY = railTop + railH;
  const H = bottomY + 84;
  const fs = Math.max(15, Math.min(26, (W + 2 * M) * 0.03));

  const circles = [];
  const catRank = { power: 0, ctrl: 1, weak: 2 };
  const strongSorted = [...strong].sort((a, b) =>
    catRank[a.cat] !== catRank[b.cat] ? catRank[a.cat] - catRank[b.cat] : (Number(b.dia) || 0) - (Number(a.dia) || 0)
  );
  let x = M + 1;
  strongSorted.forEach((r) => {
    const d = Number(r.dia) || 0;
    if (d <= 0) return;
    for (let i = 0; i < r.count; i++) {
      const rr = d / 2;
      circles.push({ cx: x + rr, cy: bottomY - rr, r: rr, cat: r.cat });
      x += d;
    }
  });
  const strongEnd = x;

  const weakStart = sepUsed ? M + pos + sepLoss : (strong.length ? strongEnd + 4 : M + 1);
  const weakDias = [];
  [...weak].sort((a, b) => (Number(b.dia) || 0) - (Number(a.dia) || 0)).forEach((r) => {
    const d = Number(r.dia) || 0;
    if (d <= 0) return;
    for (let i = 0; i < r.count; i++) weakDias.push(d);
  });
  const layers = Array.from({ length: Math.max(1, stack) }, () => []);
  weakDias.forEach((d, i) => layers[i % layers.length].push(d));
  let base = bottomY;
  let weakEnd = weakStart;
  layers.forEach((layer) => {
    let wx = weakStart;
    layer.forEach((d) => {
      const rr = d / 2;
      circles.push({ cx: wx + rr, cy: base - rr, r: rr, cat: "weak" });
      wx += d;
    });
    weakEnd = Math.max(weakEnd, wx);
    if (layer.length) base -= Math.max(...layer);
  });

  const dimY = bottomY + 44;
  const halo = { paintOrder: "stroke", stroke: PAPER, strokeWidth: 7, fill: INK, fontFamily: MONO, fontWeight: 600 };

  return (
    <svg viewBox={`0 0 ${W + 2 * M} ${H}`} style={{ width: "100%", display: "block" }} role="img" aria-label="ラック断面イメージ">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0L10,5L0,10z" fill={INK} />
        </marker>
      </defs>

      <rect x={M - 12} y={railTop} width={12} height={railH + 10} fill={STEEL} rx={2} />
      <rect x={M + W} y={railTop} width={12} height={railH + 10} fill={STEEL} rx={2} />
      <rect x={M - 12} y={bottomY} width={W + 24} height={9} fill="#9AA3AB" rx={2} />

      {strong.length > 0 && (
        <text x={(M + Math.min(strongEnd, M + W)) / 2} y={railTop - 10} textAnchor="middle" fontSize={fs * 0.82} style={{ ...halo, fill: CAT.power.color }}>強電</text>
      )}
      {weak.length > 0 && (
        <text x={(weakStart + weakEnd) / 2} y={railTop - 10} textAnchor="middle" fontSize={fs * 0.82} style={{ ...halo, fill: CAT.weak.color }}>弱電</text>
      )}

      {sepUsed && (
        <g>
          <rect x={M + pos + sepLoss / 2 - 2.5} y={bottomY - railH + 6} width={5} height={railH - 6} fill={INK} rx={1.5} />
          <line x1={M} y1={40} x2={M + pos} y2={40} stroke={INK} strokeWidth={1.6} markerStart="url(#arr)" markerEnd="url(#arr)" />
          <line x1={M} y1={32} x2={M} y2={railTop - 30} stroke={SUB} strokeWidth={1} />
          <line x1={M + pos} y1={32} x2={M + pos} y2={railTop - 30} stroke={SUB} strokeWidth={1} />
          <text x={M + pos / 2} y={28} textAnchor="middle" fontSize={fs} style={halo}>{fmt(pos)}</text>
        </g>
      )}

      {circles.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={Math.max(p.r - 0.9, 1.5)} fill={CAT[p.cat].color} fillOpacity={0.16} stroke={CAT[p.cat].color} strokeWidth={1.8} />
      ))}
      {circles.length === 0 && (
        <text x={M + W / 2} y={bottomY - 40} textAnchor="middle" fontSize={fs} fill={SUB} fontFamily="inherit">ケーブルを追加すると断面が表示されます</text>
      )}

      <line x1={M} y1={dimY} x2={M + W} y2={dimY} stroke={INK} strokeWidth={1.6} markerStart="url(#arr)" markerEnd="url(#arr)" />
      <line x1={M} y1={bottomY + 16} x2={M} y2={dimY + 8} stroke={SUB} strokeWidth={1} />
      <line x1={M + W} y1={bottomY + 16} x2={M + W} y2={dimY + 8} stroke={SUB} strokeWidth={1} />
      <text x={M + W / 2} y={dimY + fs + 8} textAnchor="middle" fontSize={fs} style={halo}>内幅 {W}</text>

      {mixed && !sepUsed && (
        <text x={M + W / 2} y={railTop - 34} textAnchor="middle" fontSize={fs * 0.8} style={{ ...halo, fill: "#C92A2A" }}>！強弱混在・セパレーター無し</text>
      )}
    </svg>
  );
}

/* ================= main ================= */

/* ===== サイト内ナビ ===== */
function TopBar() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <a href="../" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: CARD, border: `1px solid ${LINE}`, borderRadius: 99, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: INK, textDecoration: "none" }}>← ツール一覧</a>
      <a href="../" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: SUB, fontWeight: 600, textDecoration: "none" }}>DENKI TOOLS</a>
    </div>
  );
}
function BottomNav({ next }) {
  const btn = { display: "block", textAlign: "center", padding: "14px 12px", borderRadius: 12, border: `1px solid ${LINE}`, background: CARD, fontWeight: 700, fontSize: 14, color: INK, textDecoration: "none", flex: "1 1 45%" };
  return (
    <BottomNav next={{ href: "../conduit-checker/", label: "電線管サイズ選定" }} />
  );
}

export default function CableRackChecker() {
  const [rows, setRows] = useState(() => TEMPLATES[3].rows.map(([n, c]) => mkRow(n, c)));
  const [pick, setPick] = useState("CV 8sq-3C");
  const [rackSel, setRackSel] = useState("auto");
  const [target, setTarget] = useState(60);
  const [sepMode, setSepMode] = useState("auto");
  const [sepLoss, setSepLoss] = useState(30);
  const [stack, setStack] = useState(1);
  const [showAdv, setShowAdv] = useState(false);
  const [series, setSeries] = useState("SR");
  const [span, setSpan] = useState(2);
  const [manualAllow, setManualAllow] = useState(200);

  const spanIdx = SPANS.indexOf(span);

  const calc = useMemo(() => {
    const strong = rows.filter((r) => r.cat !== "weak" && r.count > 0);
    const weak = rows.filter((r) => r.cat === "weak" && r.count > 0);
    const sumD = (a) => a.reduce((s, r) => s + (Number(r.dia) || 0) * r.count, 0);
    const strongW = sumD(strong);
    const weakRaw = sumD(weak);
    const weakW = weakRaw / Math.max(1, stack);
    const mixed = strongW > 0 && weakRaw > 0;
    const sepUsed = (sepMode === "auto" ? mixed : sepMode === "on") && mixed;
    const total = strongW + weakW;
    const totalWt = rows.reduce((s, r) => s + (Number(r.wt) || 0) * r.count, 0);
    const eta = target / 100;
    const required = total > 0 ? Math.ceil(total / eta + (sepUsed ? sepLoss : 0)) : 0;

    /* 幅と荷重の両方を満たす最小サイズを推奨 */
    const pureRec = total > 0 ? RACK_WIDTHS.find((w) => w >= required) ?? null : null;
    let rec = null;
    if (total > 0) {
      for (const w of RACK_WIDTHS) {
        if (w < required) continue;
        const a = allowFor(series, w, spanIdx, manualAllow);
        const lp = a ? (totalWt / a) * 100 : null;
        if (lp == null || lp <= 100) { rec = w; break; }
      }
    }

    const W = rackSel === "auto" ? (rec ?? pureRec ?? 1200) : Number(rackSel);
    const avail = W - (sepUsed ? sepLoss : 0);
    const occAll = total > 0 && avail > 0 ? (total / avail) * 100 : 0;
    const allow = allowFor(series, W, spanIdx, manualAllow);
    const loadPct = allow && totalWt > 0 ? (totalWt / allow) * 100 : (totalWt > 0 ? null : 0);

    let pos = null, occS = null, occW = null;
    if (sepUsed) {
      const raw = avail * (strongW / total);
      let p = Math.round(raw / 10) * 10;
      p = Math.max(p, Math.ceil(strongW));
      p = Math.min(p, Math.floor(avail - weakW));
      if (p < strongW || avail - p < weakW || p <= 0) p = Math.max(10, Math.round(raw));
      pos = p;
      occS = (strongW / pos) * 100;
      occW = (weakW / Math.max(1, avail - pos)) * 100;
    }
    return { strong, weak, strongW, weakRaw, weakW, mixed, sepUsed, total, totalWt, required, pureRec, rec, W, avail, occAll, allow, loadPct, pos, occS, occW };
  }, [rows, stack, sepMode, sepLoss, target, rackSel, series, spanIdx, manualAllow]);

  const widthOcc = (w) => {
    const avail = w - (calc.sepUsed ? sepLoss : 0);
    if (avail <= 0 || calc.total === 0) return Infinity;
    return (calc.total / avail) * 100;
  };
  const widthLoad = (w) => {
    const a = allowFor(series, w, spanIdx, manualAllow);
    if (!a || calc.totalWt === 0) return a ? 0 : null;
    return (calc.totalWt / a) * 100;
  };

  const addRow = () => {
    setRows((rs) => {
      const hit = rs.find((r) => !r.custom && r.name === pick);
      if (hit) return rs.map((r) => (r.id === hit.id ? { ...r, count: r.count + 1 } : r));
      return [...rs, mkRow(pick, 1)];
    });
  };
  const addCustom = () => setRows((rs) => [...rs, { id: uid++, name: "カスタム", dia: 10, wt: 0.1, count: 1, cat: "weak", custom: true }]);
  const patch = (id, p) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const cycleCat = (r) => patch(r.id, { cat: CAT_ORDER[(CAT_ORDER.indexOf(r.cat) + 1) % 3] });

  const card = { background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 };
  const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: SUB, fontWeight: 600, marginBottom: 8 };
  const selectSt = { border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 10px", fontSize: 14, background: "#FBFBF9", color: INK, width: "100%" };
  const numSt = { ...selectSt, width: 70, textAlign: "right", fontFamily: MONO, fontWeight: 600, padding: "7px 8px" };

  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "'IBM Plex Sans JP','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans+JP:wght@400;500;700&display=swap');
        input:focus, select:focus, button:focus-visible { outline: 2px solid #1971C2; outline-offset: 1px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 14px 130px" }}>
        <TopBar />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: SUB, fontWeight: 600 }}>CABLE RACK LOADING CHECK</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 4px" }}>ラック占有率・荷重チェッカー</h1>
          <p style={{ fontSize: 13, color: SUB, margin: 0 }}>載せるケーブルを選ぶと、必要ラック幅・占有率・セパレーター位置・荷重負担率を計算します。</p>
        </div>

        {/* templates */}
        <div style={{ marginBottom: 16 }}>
          <div style={eyebrow}>テンプレート</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => setRows(t.rows.map(([n, c]) => mkRow(n, c)))}
                style={{ border: `1px solid ${LINE}`, background: CARD, borderRadius: 99, padding: "7px 12px", fontSize: 13, fontWeight: 600, color: INK, cursor: "pointer" }}>
                {t.name}<span style={{ color: SUB, fontWeight: 400, fontSize: 11, marginLeft: 6 }}>{t.desc}</span>
              </button>
            ))}
            <button onClick={() => setRows([])} style={{ border: "none", background: "none", color: SUB, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>クリア</button>
          </div>
        </div>

        {/* cables */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>敷設ケーブル<span style={{ marginLeft: 8, color: "#A2AAB2" }}>分類チップをタップで 電力→制御→弱電 切替</span></div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.length === 0 && (
              <div style={{ fontSize: 13, color: SUB, padding: "10px 0" }}>まだケーブルがありません。下の一覧から追加するか、テンプレートを選んでください。</div>
            )}
            {rows.map((r) => (
              <div key={r.id} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => cycleCat(r)} title="分類を切替"
                    style={{ background: CAT[r.cat].bg, color: CAT[r.cat].color, border: "none", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "4px 9px", cursor: "pointer", flexShrink: 0 }}>
                    {CAT[r.cat].short}
                  </button>
                  {r.custom ? (
                    <input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })}
                      style={{ ...selectSt, padding: "6px 8px", fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }} />
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  )}
                  <button onClick={() => remove(r.id)} aria-label="削除"
                    style={{ border: "none", background: "none", color: "#A2AAB2", fontSize: 18, cursor: "pointer", padding: "0 2px", flexShrink: 0 }}>×</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: SUB }}>
                    φ
                    <input type="number" inputMode="decimal" step="0.1" min="1" value={r.dia}
                      onChange={(e) => patch(r.id, { dia: e.target.value === "" ? "" : Number(e.target.value) })}
                      style={{ ...numSt, width: 58 }} />
                    mm
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: SUB }}>
                    <input type="number" inputMode="decimal" step="0.01" min="0" value={r.wt}
                      onChange={(e) => patch(r.id, { wt: e.target.value === "" ? "" : Number(e.target.value) })}
                      style={{ ...numSt, width: 58 }} />
                    kg/m
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 0, border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
                    <button onClick={() => patch(r.id, { count: Math.max(0, r.count - 1) })} style={{ width: 34, height: 34, border: "none", background: "#F5F6F3", fontSize: 16, cursor: "pointer", color: INK }}>−</button>
                    <div style={{ width: 40, textAlign: "center", fontFamily: MONO, fontWeight: 600, fontSize: 15 }}>{r.count}</div>
                    <button onClick={() => patch(r.id, { count: r.count + 1 })} style={{ width: 34, height: 34, border: "none", background: "#F5F6F3", fontSize: 16, cursor: "pointer", color: INK }}>＋</button>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: SUB, textAlign: "right" }}>
                    小計 <span style={{ fontFamily: MONO, fontWeight: 600, color: INK }}>{fmt((Number(r.dia) || 0) * r.count)}</span>mm・
                    <span style={{ fontFamily: MONO, fontWeight: 600, color: INK }}>{fmt2((Number(r.wt) || 0) * r.count)}</span>kg/m
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...selectSt, flex: 1, minWidth: 0 }}>
              {DB.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map(([n, d]) => (
                    <option key={n} value={n}>{n}（φ{d}）</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button onClick={addRow} style={{ background: INK, color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>追加</button>
          </div>
          <button onClick={addCustom} style={{ border: "none", background: "none", color: SUB, fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 8, padding: 0 }}>＋ カスタムケーブルを追加（名称・外径・質量を手入力）</button>
        </div>

        {/* rack settings */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>ラック条件</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, color: SUB }}>目標占有率
              <select value={target} onChange={(e) => setTarget(Number(e.target.value))} style={{ ...selectSt, marginTop: 4 }}>
                {[50, 60, 70, 80, 90].map((v) => <option key={v} value={v}>{v}% 以下</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: SUB }}>ラック幅
              <select value={rackSel} onChange={(e) => setRackSel(e.target.value)} style={{ ...selectSt, marginTop: 4 }}>
                <option value="auto">自動（推奨サイズ）</option>
                {RACK_WIDTHS.map((w) => <option key={w} value={w}>{w} mm</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: SUB }}>ラック種別（荷重）
              <select value={series} onChange={(e) => setSeries(e.target.value)} style={{ ...selectSt, marginTop: 4 }}>
                {Object.entries(SERIES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: SUB }}>支持間隔
              <select value={span} onChange={(e) => setSpan(Number(e.target.value))} style={{ ...selectSt, marginTop: 4 }}>
                {SPANS.map((v) => <option key={v} value={v}>{v.toFixed(1)} m</option>)}
              </select>
            </label>
          </div>
          {series === "manual" && (
            <label style={{ fontSize: 12, color: SUB, display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              許容荷重
              <input type="number" inputMode="numeric" min="1" value={manualAllow} onChange={(e) => setManualAllow(Number(e.target.value) || 0)} style={numSt} /> kgf/m
            </label>
          )}
          {span > 2 && (series === "SR" || series === "QR") && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#E67700" }}>※ 鋼製ラックの水平支持間隔は2m以下が標準です（2m超は参考値）。</div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 14, fontWeight: 600 }}>
            <input type="checkbox" checked={calc.sepUsed || (sepMode === "on" && !calc.mixed)}
              onChange={(e) => setSepMode(e.target.checked ? "on" : "off")} style={{ width: 18, height: 18 }} />
            セパレーターで強電・弱電を分離する
            {sepMode === "auto" && calc.mixed && <span style={{ fontSize: 11, color: SUB, fontWeight: 400 }}>（混在を検出し自動ON）</span>}
          </label>
          {calc.mixed && !calc.sepUsed && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#C92A2A", background: "#FBE5E5", borderRadius: 8, padding: "8px 10px" }}>
              強電と弱電が混在しています。同一ラックに低圧ケーブルと弱電流電線を敷設する場合、内線規程上セパレーター等での分離が必要です。
            </div>
          )}

          <button onClick={() => setShowAdv((v) => !v)} style={{ border: "none", background: "none", color: SUB, fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 10, padding: 0 }}>
            {showAdv ? "詳細設定を閉じる" : "詳細設定（セパレーター幅・弱電段積み）"}
          </button>
          {showAdv && (
            <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, color: SUB, display: "flex", alignItems: "center", gap: 6 }}>
                セパレーター占有幅
                <input type="number" inputMode="numeric" min="0" value={sepLoss} onChange={(e) => setSepLoss(Number(e.target.value) || 0)} style={numSt} /> mm
              </label>
              <label style={{ fontSize: 12, color: SUB, display: "flex", alignItems: "center", gap: 6 }}>
                弱電の段積み
                <select value={stack} onChange={(e) => setStack(Number(e.target.value))} style={{ ...selectSt, width: 90 }}>
                  {[1, 2, 3].map((v) => <option key={v} value={v}>{v} 段</option>)}
                </select>
              </label>
              <div style={{ fontSize: 11, color: SUB, width: "100%" }}>※ 電力ケーブルは許容電流確保のため原則1段整然並べ。段積みは弱電側のみ、幅の計算にのみ反映されます（重量は全数分を計上）。</div>
            </div>
          )}
        </div>

        {/* results */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>判定結果</div>

          {calc.total === 0 ? (
            <div style={{ fontSize: 13, color: SUB }}>ケーブルを追加すると結果が表示されます。</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* recommendation */}
              <div style={{ background: "#F7F8F5", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: SUB }}>占有率 {target}% 以下・荷重 100% 以下で選定</div>
                {calc.rec ? (
                  <div style={{ fontSize: 15, marginTop: 2 }}>
                    推奨ラック幅 <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 24 }}>{calc.rec}</span> mm
                    <span style={{ fontSize: 12, color: SUB, marginLeft: 8 }}>幅の必要値 <span style={{ fontFamily: MONO }}>{calc.required}</span> mm</span>
                  </div>
                ) : calc.pureRec ? (
                  <div style={{ fontSize: 13, marginTop: 2, color: "#C92A2A", fontWeight: 600 }}>
                    幅は {calc.pureRec}mm で足りますが、荷重が許容を超えます。支持間隔の短縮、QR形（親桁100）への変更、ラック2条化を検討してください。
                  </div>
                ) : (
                  <div style={{ fontSize: 13, marginTop: 2, color: "#C92A2A", fontWeight: 600 }}>
                    1200mm でも幅が不足（必要幅 {calc.required} mm）。ラック2条化・目標占有率の見直し・弱電の段積みを検討してください。
                  </div>
                )}
              </div>

              {/* occupancy */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    占有率：ラック {calc.W} mm{rackSel === "auto" && <span style={{ fontSize: 11, color: SUB, fontWeight: 400 }}>（自動選択）</span>}
                  </div>
                  <JChip pct={calc.occAll} />
                </div>
                <Bar pct={calc.occAll} color={judge(calc.occAll).color} />
                <div style={{ fontSize: 11, color: SUB, marginTop: 4, fontFamily: MONO }}>
                  占有幅 {fmt(calc.total)} / 有効幅 {fmt(calc.avail)} mm{calc.sepUsed ? `（セパレーター ${sepLoss}mm 控除）` : ""}
                </div>
              </div>

              {/* load */}
              <div style={{ borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>荷重：{SERIES[series].label.split("（")[0]}・支持 {span.toFixed(1)}m</div>
                  <JChip pct={calc.loadPct} />
                </div>
                <Bar pct={calc.loadPct} color={judge(calc.loadPct).color} />
                {calc.allow ? (
                  <div style={{ fontSize: 11, color: SUB, marginTop: 4, fontFamily: MONO }}>
                    積載 {fmt2(calc.totalWt)} kg/m ／ 許容 {Math.round(calc.allow)} kgf/m ・ 支持点1箇所あたり 約{Math.round(calc.totalWt * span)} kg
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#C92A2A", marginTop: 4 }}>
                    この幅の許容荷重データがありません（SR/QR系は800mmまで）。手入力モードでカタログ値を入れてください。
                  </div>
                )}
              </div>

              {/* separator detail */}
              {calc.sepUsed && (
                <div style={{ borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    セパレーター位置：強電側レール内面から <span style={{ fontFamily: MONO, fontSize: 18 }}>{fmt(calc.pos)}</span> mm
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: CAT.power.bg, borderRadius: 10, padding: "9px 11px" }}>
                      <div style={{ fontSize: 11, color: CAT.power.color, fontWeight: 700 }}>強電側（電力＋制御）</div>
                      <div style={{ fontFamily: MONO, fontSize: 13, marginTop: 3 }}>{fmt(calc.strongW)} / {fmt(calc.pos)} mm</div>
                      <div style={{ marginTop: 5 }}><JChip pct={calc.occS} /></div>
                    </div>
                    <div style={{ background: CAT.weak.bg, borderRadius: 10, padding: "9px 11px" }}>
                      <div style={{ fontSize: 11, color: CAT.weak.color, fontWeight: 700 }}>弱電側（計装・通信）{stack > 1 ? `・${stack}段` : ""}</div>
                      <div style={{ fontFamily: MONO, fontSize: 13, marginTop: 3 }}>{fmt(calc.weakW)} / {fmt(calc.avail - calc.pos)} mm</div>
                      <div style={{ marginTop: 5 }}><JChip pct={calc.occW} /></div>
                    </div>
                  </div>
                </div>
              )}

              {/* per-width table */}
              <div style={{ borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
                <div style={{ fontSize: 12, color: SUB, marginBottom: 6 }}>標準幅ごとの占有率・荷重（幅が広いほど許容荷重は下がります）</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {RACK_WIDTHS.map((w) => {
                    const o = widthOcc(w);
                    const l = widthLoad(w);
                    const isRec = w === calc.rec;
                    const isSel = w === calc.W;
                    return (
                      <div key={w} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 8, background: isSel ? "#F1F3EE" : "transparent" }}>
                        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 13, width: 66, flexShrink: 0 }}>
                          {w}{isRec && <span style={{ color: "#2B8A3E", fontSize: 10, marginLeft: 3, fontFamily: "inherit" }}>推奨</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 40 }}><Bar pct={o} color={judge(o).color} /></div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <JChip pct={o} prefix="幅" />
                          <JChip pct={l} prefix="荷重" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* cross-section */}
        <div style={{ ...card, marginBottom: 12, paddingBottom: 8 }}>
          <div style={eyebrow}>断面イメージ（縮尺）</div>
          <RackSection c={calc} sepLoss={sepLoss} stack={stack} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "4px 0 8px" }}>
            {CAT_ORDER.map((k) => (
              <span key={k} style={{ fontSize: 11, color: SUB, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, border: `2px solid ${CAT[k].color}`, background: CAT[k].bg, display: "inline-block" }} />
                {CAT[k].label}
              </span>
            ))}
            <span style={{ fontSize: 11, color: SUB, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 3, height: 12, background: INK, display: "inline-block", borderRadius: 2 }} />セパレーター
            </span>
          </div>
        </div>

        {/* notes */}
        <div style={{ fontSize: 11, color: SUB, lineHeight: 1.8, padding: "0 4px" }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>前提・注意</div>
          ・外径・質量は代表的な概算値です。実施設計ではメーカーカタログ値で上書きして確認してください。<br />
          ・許容荷重はネグロス技術資料の許容静荷重表（両端支持・等分布荷重、kgf/m）に基づく参考値です。中間の幅は直線補間、ステンレス系は幅200の比率からの推定値。実際の連続支持（3スパン以上）では有利側になる場合があります。必ず最新カタログで確認してください。<br />
          ・荷重にはラック自重・カバー・積雪/風圧・人の荷重は含みません。支持点あたり荷重で吊りボルト・インサート・デッキ耐力も別途確認してください。<br />
          ・占有率＝Σ（仕上外径×本数）÷ ラック有効幅（幅ベース・電力は1段整然並べ前提）。基準値は社内基準・特記仕様書に従ってください。<br />
          ・低圧ケーブルと弱電流電線（通信・信号）の同一ラック敷設はセパレーター等での分離が必要（内線規程）。計装信号はノイズ対策上、動力との離隔（目安300mm以上）または別ラックが望ましいです。
        </div>

        {/* ===== 解説（SEO・AdSense審査対策を兼ねた静的コンテンツ） ===== */}
        <article style={{ marginTop: 28, background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "20px 18px", fontSize: 13, lineHeight: 2, color: INK }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>ケーブルラックの占有率とは</h2>
          <p style={{ margin: "0 0 18px", color: "#454C52" }}>
            ケーブルラックの占有率は「載せるケーブルの仕上外径の合計 ÷ ラックの有効幅」で表すのが実務での一般的な考え方です。電力ケーブルは発熱による許容電流の低下を避けるため原則1段で整然と並べることが前提となり、ケーブル外径の合計がラック幅を超えないことが最低条件になります。設計段階では将来の増設や施工時の作業性を見込んで、占有率50〜70%程度を目標にラック幅を選定するのが一般的です。
          </p>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>セパレーターが必要になるケース</h2>
          <p style={{ margin: "0 0 18px", color: "#454C52" }}>
            低圧の電力・制御ケーブルと、弱電流電線（通信・信号・計装ケーブルなど）を同一のケーブルラックに敷設する場合は、内線規程によりセパレーター（隔壁）等での分離が必要です。また規程上の要求とは別に、4-20mAやDC24Vなどの計装信号は動力ケーブルからの誘導ノイズを受けやすいため、300mm以上の離隔や別ラック化が望ましいとされています。本ツールでは強電・弱電の混在を検出すると自動でセパレーターを考慮し、推奨取付位置を寸法で表示します。
          </p>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>ラックの許容荷重と支持間隔</h2>
          <p style={{ margin: "0 0 18px", color: "#454C52" }}>
            ケーブルラックには支持間隔ごとの許容静荷重（等分布荷重）がメーカーから示されており、支持間隔が広いほど、またラック幅が広いほど許容値は小さくなります。幅に余裕があっても重量ケーブルを多条敷設すると荷重側が先に限界を迎えることがあるため、幅と荷重の両方の確認が必要です。本ツールはネグロス電工のSR形（親桁70mm）・QR形（親桁100mm）の技術資料に基づく参考値を内蔵していますが、採用時は必ず最新のメーカーカタログで確認してください。
          </p>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>このツールについて</h2>
          <p style={{ margin: 0, color: "#454C52" }}>
            電気工事・計装工事の現場経験をもとに、ラック選定の検討をその場で完結できるように作った無料ツールです。計算結果は概算値による参考情報であり、実施設計における適合性を保証するものではありません。外径・質量・許容荷重はすべて編集できるので、メーカーカタログ値や社内基準値に置き換えてご利用ください。
          </p>
                  <p style={{ margin: "18px 0 0", fontSize: 12 }}>関連用語：<a href="../words/separator/" style={{ color: "#1971C2" }}>セパレーター</a>／<a href="../words/weak-current-wire/" style={{ color: "#1971C2" }}>弱電流電線</a>／<a href="../words/jkvv/" style={{ color: "#1971C2" }}>JKVVケーブル</a>／<a href="../words/rack-load/" style={{ color: "#1971C2" }}>ラックの許容荷重</a></p>
        </article>

        <footer style={{ marginTop: 20, fontSize: 12, color: SUB, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <a href="../" style={{ color: SUB }}>← ツール一覧へ</a>
          <a href="https://forms.gle/ifJ9uVDc1QBDRZas8" target="_blank" rel="noopener" style={{ color: SUB }}>機能リクエスト</a>
          <span>© DENKI TOOLS</span>
        </footer>
      </div>

      {/* sticky summary */}
      {calc.total > 0 && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20, background: "rgba(255,255,255,0.96)", borderTop: `1px solid ${LINE}`, backdropFilter: "blur(6px)" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: SUB }}>推奨 </span>
              <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 17 }}>{calc.rec ? `${calc.rec}mm` : "—"}</span>
              {calc.sepUsed && calc.rec && (
                <span style={{ color: SUB, fontSize: 12, marginLeft: 8 }}>SEP <span style={{ fontFamily: MONO }}>{fmt(calc.pos)}mm</span></span>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <JChip pct={calc.occAll} prefix="幅" />
              <JChip pct={calc.loadPct} prefix="荷重" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
