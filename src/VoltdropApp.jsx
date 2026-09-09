import { useState, useMemo } from "react";

/* 電圧降下計算ツール — denki-tools（内線規程の簡易式・銅導体） */

const INK = "#22272B";
const SUB = "#69737D";
const PAPER = "#F3F4F1";
const CARD = "#FFFFFF";
const LINE = "#E1E4DE";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

/* 方式と係数：e = K × L × I ÷ (1000 × A × 並列条数) */
const METHODS = [
  { key: "s2", label: "単相2線式", k: 35.6 },
  { key: "s3", label: "単相3線式（電圧線−中性線間）", k: 17.8 },
  { key: "t3", label: "三相3線式", k: 30.8 },
  { key: "t4", label: "三相4線式（電圧線−中性線間）", k: 17.8 },
];

/* 電線サイズ：[表示, 断面積mm²] */
const SIZES = [
  ["1.6mm", 2.0], ["2.0mm", 3.14], ["2.6mm", 5.3],
  ["5.5sq", 5.5], ["8sq", 8], ["14sq", 14], ["22sq", 22], ["38sq", 38],
  ["60sq", 60], ["100sq", 100], ["150sq", 150], ["200sq", 200], ["250sq", 250], ["325sq", 325],
];

const TEMPLATES = [
  { name: "照明分岐", m: "s2", v: 100, i: 15, l: 30, allow: 2 },
  { name: "コンセント", m: "s2", v: 100, i: 20, l: 25, allow: 2 },
  { name: "動力", m: "t3", v: 200, i: 30, l: 50, allow: 2 },
  { name: "単3幹線", m: "s3", v: 100, i: 100, l: 60, allow: 2 },
  { name: "遠方ポンプ", m: "t3", v: 200, i: 15, l: 150, allow: 4 },
];

const fmt = (v, d = 1) => {
  const p = 10 ** d;
  const r = Math.round(v * p) / p;
  return Number.isInteger(r) && d <= 1 ? String(r) : r.toFixed(d);
};

function judge(pct, allow) {
  if (pct == null || !isFinite(pct)) return { label: "—", color: SUB, bg: "#EEF0EC" };
  if (pct <= allow * 0.7) return { label: "余裕あり", color: "#2B8A3E", bg: "#E6F4EA" };
  if (pct <= allow) return { label: "適合", color: "#2B8A3E", bg: "#E6F4EA" };
  return { label: "超過", color: "#C92A2A", bg: "#FBE5E5" };
}

const Chip = ({ pct, allow }) => {
  const j = judge(pct, allow);
  return (
    <span style={{ color: j.color, background: j.bg, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
      {pct != null && isFinite(pct) ? `${fmt(pct, 2)}%・${j.label}` : j.label}
    </span>
  );
};

const Bar = ({ pct, allow }) => (
  <div style={{ background: "#ECEEE9", borderRadius: 99, height: 8, overflow: "hidden", position: "relative" }}>
    <div style={{ width: `${Math.max(2, Math.min(100, (pct / (allow * 1.5)) * 100))}%`, background: judge(pct, allow).color, height: "100%", borderRadius: 99, transition: "width .25s ease" }} />
    <div style={{ position: "absolute", left: `${(1 / 1.5) * 100}%`, top: -1, width: 2, height: 10, background: INK, opacity: 0.5 }} />
  </div>
);

/* 線路の模式図 */
function CircuitFig({ V, L, I, e }) {
  const halo = { fontFamily: MONO, fontWeight: 600, fill: INK };
  const vEnd = V - e;
  return (
    <svg viewBox="0 0 360 120" style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="回路の模式図">
      <rect x={14} y={30} width={44} height={60} fill="#FBFBF9" stroke="#7A838C" strokeWidth={3} rx={4} />
      <text x={36} y={65} textAnchor="middle" fontSize={13} style={halo}>盤</text>
      <line x1={58} y1={50} x2={296} y2={50} stroke="#D9480F" strokeWidth={3} />
      <line x1={58} y1={70} x2={296} y2={70} stroke="#D9480F" strokeWidth={3} />
      <circle cx={314} cy={60} r={20} fill="#FBFBF9" stroke="#7A838C" strokeWidth={3} />
      <text x={314} y={65} textAnchor="middle" fontSize={13} style={halo}>M</text>
      <text x={177} y={38} textAnchor="middle" fontSize={13} style={halo}>L {fmt(L)} m ／ {fmt(I)} A</text>
      <text x={68} y={96} fontSize={12} style={halo}>送出 {fmt(V)} V</text>
      <text x={296} y={96} textAnchor="end" fontSize={12} style={{ ...halo, fill: e / V * 100 > 0 ? "#C92A2A" : INK }}>末端 {fmt(vEnd, 1)} V（−{fmt(e, 2)} V）</text>
    </svg>
  );
}

export default function VoltDropChecker() {
  const [m, setM] = useState("t3");
  const [v, setV] = useState(200);
  const [i, setI] = useState(30);
  const [l, setL] = useState(50);
  const [n, setN] = useState(1);
  const [allow, setAllow] = useState(2);

  const K = METHODS.find((x) => x.key === m).k;
  const calc = useMemo(() => {
    const I = Number(i) || 0, L = Number(l) || 0, V = Number(v) || 0, N = Number(n) || 1, A_ = Number(allow) || 2;
    const rows = SIZES.map(([nm, A]) => {
      const e = (K * L * I) / (1000 * A * N);
      const pct = V > 0 ? (e / V) * 100 : null;
      return { nm, A, e, pct };
    });
    const rec = rows.find((r) => r.pct != null && r.pct <= A_) ?? null;
    return { rows, rec, I, L, V, N, A_ };
  }, [m, v, i, l, n, allow, K]);

  const card = { background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 };
  const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: SUB, fontWeight: 600, marginBottom: 8 };
  const selectSt = { border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 10px", fontSize: 14, background: "#FBFBF9", color: INK, width: "100%" };
  const numSt = { ...selectSt, textAlign: "right", fontFamily: MONO, fontWeight: 600 };

  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "'IBM Plex Sans JP','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans+JP:wght@400;500;700&display=swap');
        input:focus, select:focus, button:focus-visible { outline: 2px solid #1971C2; outline-offset: 1px; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 14px 60px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: SUB, fontWeight: 600 }}>VOLTAGE DROP CALC</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 4px" }}>電圧降下 計算ツール</h1>
          <p style={{ fontSize: 13, color: SUB, margin: 0 }}>内線規程の簡易式（銅導体）で、電圧降下と適合する最小電線サイズを計算します。</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={eyebrow}>テンプレート</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => { setM(t.m); setV(t.v); setI(t.i); setL(t.l); setAllow(t.allow); }}
                style={{ border: `1px solid ${LINE}`, background: CARD, borderRadius: 99, padding: "7px 12px", fontSize: 13, fontWeight: 600, color: INK, cursor: "pointer" }}>{t.name}</button>
            ))}
          </div>
        </div>

        {/* inputs */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>条件</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, color: SUB, gridColumn: "1 / -1" }}>配線方式
              <select value={m} onChange={(e) => setM(e.target.value)} style={{ ...selectSt, marginTop: 4 }}>
                {METHODS.map((x) => <option key={x.key} value={x.key}>{x.label}（係数 {x.k}）</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: SUB }}>電圧 V
              <input type="number" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} style={{ ...numSt, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: SUB }}>電流 A
              <input type="number" inputMode="decimal" value={i} onChange={(e) => setI(e.target.value)} style={{ ...numSt, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: SUB }}>こう長 m（片道）
              <input type="number" inputMode="decimal" value={l} onChange={(e) => setL(e.target.value)} style={{ ...numSt, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: SUB }}>許容降下率 %
              <select value={allow} onChange={(e) => setAllow(Number(e.target.value))} style={{ ...selectSt, marginTop: 4 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((x) => <option key={x} value={x}>{x}%</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: SUB }}>並列条数（1相あたり）
              <select value={n} onChange={(e) => setN(Number(e.target.value))} style={{ ...selectSt, marginTop: 4 }}>
                {[1, 2, 3, 4].map((x) => <option key={x} value={x}>{x} 条</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* results */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>判定結果</div>
          <div style={{ background: "#F7F8F5", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: SUB }}>許容 {calc.A_}% 以下に収まる最小サイズ</div>
            {calc.rec ? (
              <div style={{ fontSize: 15, marginTop: 2 }}>
                <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 26 }}>{calc.rec.nm}</span>
                <span style={{ fontSize: 12, color: SUB, marginLeft: 10 }}>降下 <span style={{ fontFamily: MONO }}>{fmt(calc.rec.e, 2)}</span> V（{fmt(calc.rec.pct, 2)}%）・末端 <span style={{ fontFamily: MONO }}>{fmt(calc.V - calc.rec.e, 1)}</span> V</span>
              </div>
            ) : (
              <div style={{ fontSize: 13, marginTop: 2, color: "#C92A2A", fontWeight: 600 }}>
                325sqでも許容内に収まりません。並列条数を増やす、電圧区分の変更、変圧器位置の見直しを検討してください。
              </div>
            )}
          </div>
          {calc.rec && <CircuitFig V={calc.V} L={calc.L} I={calc.I} e={calc.rec.e} />}

          <div style={{ fontSize: 12, color: SUB, margin: "12px 0 6px" }}>サイズ別の電圧降下（縦線＝許容 {calc.A_}%）</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {calc.rows.map((r) => (
              <div key={r.nm} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 8, background: calc.rec?.nm === r.nm ? "#F1F3EE" : "transparent" }}>
                <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 13, width: 70, flexShrink: 0 }}>
                  {r.nm}{calc.rec?.nm === r.nm && <span style={{ color: "#2B8A3E", fontSize: 10, marginLeft: 3, fontFamily: "inherit" }}>推奨</span>}
                </div>
                <div style={{ flex: 1, minWidth: 40 }}><Bar pct={r.pct} allow={calc.A_} /></div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: SUB, width: 56, textAlign: "right", flexShrink: 0 }}>{fmt(r.e, 2)}V</div>
                <div style={{ flexShrink: 0 }}><Chip pct={r.pct} allow={calc.A_} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* 許容値の目安表 */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>許容電圧降下の目安（内線規程 1310-1）</div>
          <div style={{ fontSize: 13 }}>
            {[
              ["こう長 60m以下", "2%", "3%"],
              ["120m以下", "4%", "5%"],
              ["200m以下", "5%", "6%"],
              ["200m超", "6%", "7%"],
            ].map(([a, b, c], idx) => (
              <div key={a} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "7px 8px", borderTop: idx ? `1px solid ${LINE}` : "none", alignItems: "center" }}>
                <div style={{ color: idx === 0 ? SUB : INK, fontSize: idx === 0 ? 12 : 13 }}>{a}</div>
                <div style={{ fontFamily: MONO, fontWeight: 600, textAlign: "center" }}>{b}</div>
                <div style={{ fontFamily: MONO, fontWeight: 600, textAlign: "center" }}>{c}</div>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", padding: "4px 8px", fontSize: 10, color: SUB }}>
              <div></div><div style={{ textAlign: "center" }}>低圧受電</div><div style={{ textAlign: "center" }}>高圧受電（変圧器から）</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: SUB, lineHeight: 1.8, padding: "0 4px" }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>前提・注意</div>
          ・計算式：e ＝ K × L × I ÷（1000 × A × 並列条数）。K＝35.6（単相2線）／30.8（三相3線）／17.8（単相3線・三相4線の電圧線−中性線間）。銅導体・力率1の簡易式です。<br />
          ・こう長Lは片道の長さを入力してください（往復分は係数に含まれています）。<br />
          ・大サイズや長距離ではリアクタンス・力率の影響が出るため、厳密にはインピーダンス法での検算を推奨します。<br />
          ・電線サイズは電圧降下だけでなく許容電流・短絡強度でも決まります。許容電流の確認は別途必ず行ってください。
        </div>

        <article style={{ marginTop: 28, background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "20px 18px", fontSize: 13, lineHeight: 2 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>電圧降下の簡易式とは</h2>
          <p style={{ margin: "0 0 18px", color: "#454C52" }}>
            低圧配線の電圧降下は、内線規程に示される簡易式「e ＝ K × L × I ÷（1000 × A）」で計算するのが実務の定番です。Kは配線方式ごとの係数で、単相2線式35.6・三相3線式30.8・単相3線式や三相4線式の電圧線−中性線間17.8（いずれも銅導体）を用います。降下率が大きいと照明のちらつきや電動機のトルク不足・始動不良の原因になるため、こう長に応じた許容値（60m以下で標準2%など）に収まるサイズを選定します。
          </p>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>降下率が収まらないときの対策</h2>
          <p style={{ margin: 0, color: "#454C52" }}>
            サイズアップで収まらない場合は、並列条数を増やす、配電電圧を上げる（100V→200V化で同一負荷の電流が半減し、降下率は約1/4）、変圧器や分電盤を負荷の近くに配置する、といった対策が有効です。計算結果は参考情報のため、実施設計では許容電流との照合を含め、内線規程・社内基準にて確認してください。
          </p>
        </article>

        <footer style={{ marginTop: 20, fontSize: 12, color: SUB, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <a href="../" style={{ color: SUB }}>← ツール一覧へ</a>
          <a href="https://forms.gle/ifJ9uVDc1QBDRZas8" target="_blank" rel="noopener" style={{ color: SUB }}>機能リクエスト</a>
        </footer>
      </div>
    </div>
  );
}
