import { useState, useMemo } from "react";

/* プルボックスサイズ選定ツール — denki-tools */

const INK = "#22272B";
const SUB = "#69737D";
const PAPER = "#F3F4F1";
const CARD = "#FFFFFF";
const LINE = "#E1E4DE";
const STEEL = "#7A838C";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

/* 電線管：呼び径の数値を6倍則・8倍則に使用 */
const CONDUITS = [
  { key: "PF", label: "PF管", sizes: [14, 16, 22, 28, 36, 42] },
  { key: "CD", label: "CD管", sizes: [14, 16, 22, 28, 36, 42] },
  { key: "E", label: "ねじなし（E）", sizes: [19, 25, 31, 39, 51, 63, 75] },
  { key: "C", label: "薄鋼（C）", sizes: [19, 25, 31, 39, 51, 63, 75] },
  { key: "G", label: "厚鋼（G）", sizes: [16, 22, 28, 36, 42, 54, 70, 82, 104] },
  { key: "FEP", label: "FEP管", sizes: [30, 40, 50, 65, 80, 100, 125, 150] },
];

/* 曲げ半径チェック用ケーブル：[名称, 仕上外径mm, 曲げ倍率] */
const CABLES = [
  ["CVT 38sq", 25, 8], ["CVT 60sq", 30, 8], ["CVT 100sq", 36, 8], ["CVT 150sq", 42, 8], ["CVT 200sq", 47, 8],
  ["CV 8sq-3C", 15.5, 6], ["CV 14sq-3C", 18, 6], ["CV 22sq-3C", 20, 6], ["CV 38sq-3C", 24, 6], ["CV 60sq-3C", 29, 6],
  ["CVV 1.25sq-10C", 15, 6], ["CVV 1.25sq-30C", 21.5, 6],
  ["KPEV-S 1.25sq-10P", 20, 6],
  ["CVV 2.0sq-8C", 15.5, 6], ["JKVVS 0.75sq-7C", 11, 6], ["VCTF 1.25sq-3C", 8, 6],
  ["LAN Cat6", 6.5, 4], ["光ケーブル 4心", 9, 10], ["ディストリビューションケーブル", 9, 10],
];

const TEMPLATES = [
  { name: "幹線 通し", pipes: [["E", 31, 2, "through"]], cable: "CV 38sq-3C" },
  { name: "動力 直角曲げ", pipes: [["G", 36, 1, "bend"], ["G", 28, 1, "bend"]], cable: "CVT 60sq" },
  { name: "弱電 通し", pipes: [["PF", 28, 2, "through"]], cable: "LAN Cat6" },
  { name: "引込 FEP直角", pipes: [["FEP", 80, 1, "bend"]], cable: "CVT 150sq" },
];

let uid = 1;
const mkPipe = (type, size, count, route) => ({ id: uid++, type, size, count, route });
const roundUp50 = (v) => Math.max(100, Math.ceil(v / 50) * 50);
const fmt = (v) => String(Math.round(v * 10) / 10);

export default function PullboxChecker() {
  const [pipes, setPipes] = useState(() => TEMPLATES[1].pipes.map((p) => mkPipe(...p)));
  const [pickType, setPickType] = useState("G");
  const [pickSize, setPickSize] = useState(28);
  const [cableName, setCableName] = useState("CVT 60sq");
  const [cableDia, setCableDia] = useState(30);
  const [cableK, setCableK] = useState(8);
  const [gap, setGap] = useState(30);      /* 管間あき */
  const [edge, setEdge] = useState(50);    /* 端あき */
  const [depthMargin, setDepthMargin] = useState(60);
  const [showAdv, setShowAdv] = useState(false);

  const calc = useMemo(() => {
    const all = pipes.filter((p) => p.count > 0);
    const flat = [];
    all.forEach((p) => { for (let i = 0; i < p.count; i++) flat.push({ d: p.size, route: p.route }); });
    if (flat.length === 0) return { empty: true };

    const through = flat.filter((p) => p.route === "through").map((p) => p.d);
    const bend = flat.filter((p) => p.route === "bend").map((p) => p.d);
    const maxAll = Math.max(...flat.map((p) => p.d));

    const crits = [];
    /* ① 直線引き：8倍則 */
    if (through.length) {
      const v = 8 * Math.max(...through);
      crits.push({ label: `直線引き 8倍則（8 × ${Math.max(...through)}）`, value: v, dim: "L" });
    }
    /* ② 直角引き：6倍則＋他管径 */
    if (bend.length) {
      const mx = Math.max(...bend);
      const others = bend.reduce((s, d) => s + d, 0) - mx;
      const v = 6 * mx + others;
      crits.push({ label: `直角引き 6倍則（6 × ${mx}${others ? ` ＋ 他管 ${others}` : ""}）`, value: v, dim: "WL" });
    }
    /* ③ ケーブル曲げ半径（直角がある場合） */
    const bendR = (Number(cableDia) || 0) * (Number(cableK) || 6);
    if (bend.length && bendR > 0) {
      const v = bendR + Math.max(...bend) + 50;
      crits.push({ label: `ケーブル曲げ半径（${cableK}D＝R${fmt(bendR)} ＋ 管径 ＋ 余裕50）`, value: v, dim: "WL" });
    }
    /* ④ 管の並び幅（同一面に全数並ぶ想定） */
    const rowW = flat.reduce((s, p) => s + p.d, 0) + gap * (flat.length - 1) + edge * 2;
    crits.push({ label: `管の並び幅（Σ管径 ＋ あき${gap} × ${flat.length - 1} ＋ 端${edge} × 2）`, value: rowW, dim: "W" });

    const needW = Math.max(...crits.filter((c) => c.dim !== "L").map((c) => c.value));
    const needL = Math.max(...crits.filter((c) => c.dim !== "W").map((c) => c.value), needW * 0);
    const W = roundUp50(needW);
    const L = roundUp50(Math.max(needL, 100));
    const D = roundUp50(maxAll + depthMargin);
    const governW = crits.filter((c) => c.dim !== "L").reduce((a, b) => (b.value > a.value ? b : a));
    const governL = crits.filter((c) => c.dim !== "W").length
      ? crits.filter((c) => c.dim !== "W").reduce((a, b) => (b.value > a.value ? b : a))
      : null;
    return { crits, W, L, D, needW, needL, governW, governL, bendR, hasBend: bend.length > 0, maxAll };
  }, [pipes, cableDia, cableK, gap, edge, depthMargin]);

  const addPipe = (route) => setPipes((ps) => [...ps, mkPipe(pickType, Number(pickSize), 1, route)]);
  const patch = (id, p) => setPipes((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const remove = (id) => setPipes((ps) => ps.filter((x) => x.id !== id));
  const applyTemplate = (t) => {
    setPipes(t.pipes.map((p) => mkPipe(...p)));
    const c = CABLES.find(([n]) => n === t.cable);
    if (c) { setCableName(c[0]); setCableDia(c[1]); setCableK(c[2]); }
  };
  const onCablePick = (name) => {
    const c = CABLES.find(([n]) => n === name);
    setCableName(name);
    if (c) { setCableDia(c[1]); setCableK(c[2]); }
  };

  const card = { background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 };
  const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: SUB, fontWeight: 600, marginBottom: 8 };
  const selectSt = { border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 10px", fontSize: 14, background: "#FBFBF9", color: INK };
  const numSt = { ...selectSt, width: 70, textAlign: "right", fontFamily: MONO, fontWeight: 600, padding: "7px 8px" };
  const curType = CONDUITS.find((c) => c.key === pickType);

  /* 平面図 */
  const Plan = () => {
    if (calc.empty) return null;
    const { W, L, bendR, hasBend } = calc;
    const s = 230 / Math.max(W, L);
    const bw = W * s, bl = L * s;
    const ox = (340 - bw) / 2, oy = 30;
    const rpx = Math.min(bendR * s, Math.min(bw, bl) - 8);
    const halo = { fontFamily: MONO, fontWeight: 600, fill: INK };
    return (
      <svg viewBox="0 0 340 330" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="プルボックス平面イメージ">
        <defs>
          <marker id="parr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0L10,5L0,10z" fill={INK} />
          </marker>
        </defs>
        <rect x={ox} y={oy} width={bw} height={bl} fill="#FBFBF9" stroke={STEEL} strokeWidth={5} rx={3} />
        {/* 直通イメージ：左右のスタブ */}
        <rect x={ox - 22} y={oy + bl * 0.3 - 5} width={22} height={10} fill={STEEL} />
        <rect x={ox + bw} y={oy + bl * 0.3 - 5} width={22} height={10} fill={STEEL} />
        <line x1={ox - 18} y1={oy + bl * 0.3} x2={ox + bw + 18} y2={oy + bl * 0.3} stroke="#D9480F" strokeWidth={2.5} strokeDasharray="1 5" strokeLinecap="round" />
        {/* 直角イメージ：左→下 と曲げ半径 */}
        {hasBend && rpx > 6 && (
          <g>
            <rect x={ox - 22} y={oy + bl - rpx - 5} width={22} height={10} fill={STEEL} />
            <rect x={ox + rpx - 5} y={oy + bl} width={10} height={22} fill={STEEL} />
            <path d={`M ${ox - 18} ${oy + bl - rpx} L ${ox} ${oy + bl - rpx} A ${rpx} ${rpx} 0 0 0 ${ox + rpx} ${oy + bl} L ${ox + rpx} ${oy + bl + 18}`}
              fill="none" stroke="#1971C2" strokeWidth={2.5} strokeDasharray="1 5" strokeLinecap="round" />
            <text x={ox + rpx * 0.55} y={oy + bl - rpx * 0.45} fontSize={12} style={{ ...halo, fill: "#1971C2" }}>R{Math.round(calc.bendR)}</text>
          </g>
        )}
        {/* 寸法線 */}
        <line x1={ox} y1={oy + bl + 46} x2={ox + bw} y2={oy + bl + 46} stroke={INK} strokeWidth={1.4} markerStart="url(#parr)" markerEnd="url(#parr)" />
        <text x={ox + bw / 2} y={oy + bl + 66} textAnchor="middle" fontSize={14} style={halo}>W {W}</text>
        <line x1={ox + bw + 34} y1={oy} x2={ox + bw + 34} y2={oy + bl} stroke={INK} strokeWidth={1.4} markerStart="url(#parr)" markerEnd="url(#parr)" />
        <text x={ox + bw + 30} y={oy + bl / 2} textAnchor="end" fontSize={14} style={halo}>L {L}</text>
      </svg>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "'IBM Plex Sans JP','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans+JP:wght@400;500;700&display=swap');
        input:focus, select:focus, button:focus-visible { outline: 2px solid #1971C2; outline-offset: 1px; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 14px 60px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: SUB, fontWeight: 600 }}>PULL BOX SIZE CHECK</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 4px" }}>プルボックス サイズ選定ツール</h1>
          <p style={{ fontSize: 13, color: SUB, margin: 0 }}>貫通する電線管と経路（通し／直角）を入れると、8倍則・6倍則・ケーブル曲げ半径から必要寸法を計算します。</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={eyebrow}>テンプレート</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => applyTemplate(t)}
                style={{ border: `1px solid ${LINE}`, background: CARD, borderRadius: 99, padding: "7px 12px", fontSize: 13, fontWeight: 600, color: INK, cursor: "pointer" }}>{t.name}</button>
            ))}
            <button onClick={() => setPipes([])} style={{ border: "none", background: "none", color: SUB, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>クリア</button>
          </div>
        </div>

        {/* pipes */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>貫通する電線管<span style={{ marginLeft: 8, color: "#A2AAB2" }}>経路チップをタップで 通し⇄直角 切替</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pipes.length === 0 && <div style={{ fontSize: 13, color: SUB, padding: "8px 0" }}>下から電線管を追加してください。</div>}
            {pipes.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 12px", flexWrap: "wrap" }}>
                <button onClick={() => patch(p.id, { route: p.route === "through" ? "bend" : "through" })}
                  style={{ background: p.route === "through" ? "#FCEDE5" : "#E7F0FA", color: p.route === "through" ? "#D9480F" : "#1971C2", border: "none", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "4px 9px", cursor: "pointer" }}>
                  {p.route === "through" ? "通し" : "直角"}
                </button>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: MONO }}>
                  {CONDUITS.find((c) => c.key === p.type)?.label ?? p.type} {p.size}
                </div>
                <div style={{ display: "flex", alignItems: "center", border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden", marginLeft: "auto" }}>
                  <button onClick={() => patch(p.id, { count: Math.max(0, p.count - 1) })} style={{ width: 32, height: 32, border: "none", background: "#F5F6F3", fontSize: 16, cursor: "pointer", color: INK }}>−</button>
                  <div style={{ width: 36, textAlign: "center", fontFamily: MONO, fontWeight: 600 }}>{p.count}</div>
                  <button onClick={() => patch(p.id, { count: p.count + 1 })} style={{ width: 32, height: 32, border: "none", background: "#F5F6F3", fontSize: 16, cursor: "pointer", color: INK }}>＋</button>
                </div>
                <button onClick={() => remove(p.id)} aria-label="削除" style={{ border: "none", background: "none", color: "#A2AAB2", fontSize: 18, cursor: "pointer" }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <select value={pickType} onChange={(e) => { setPickType(e.target.value); setPickSize(CONDUITS.find((c) => c.key === e.target.value).sizes[2]); }} style={{ ...selectSt, flex: 1, minWidth: 110 }}>
              {CONDUITS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select value={pickSize} onChange={(e) => setPickSize(Number(e.target.value))} style={{ ...selectSt, width: 90 }}>
              {curType.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => addPipe("through")} style={{ background: INK, color: "#fff", border: "none", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>＋通し</button>
            <button onClick={() => addPipe("bend")} style={{ background: "#1971C2", color: "#fff", border: "none", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>＋直角</button>
          </div>
        </div>

        {/* cable */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>最大ケーブル（曲げ半径チェック用）</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select value={cableName} onChange={(e) => onCablePick(e.target.value)} style={{ ...selectSt, flex: 1, minWidth: 170 }}>
              {CABLES.map(([n, d, k]) => <option key={n} value={n}>{n}（φ{d}・{k}D）</option>)}
              <option value="custom">カスタム（下で入力）</option>
            </select>
            <label style={{ fontSize: 12, color: SUB, display: "flex", alignItems: "center", gap: 4 }}>
              φ<input type="number" inputMode="decimal" step="0.1" value={cableDia} onChange={(e) => setCableDia(e.target.value)} style={{ ...numSt, width: 58 }} />mm
            </label>
            <label style={{ fontSize: 12, color: SUB, display: "flex", alignItems: "center", gap: 4 }}>
              曲げ<input type="number" inputMode="numeric" value={cableK} onChange={(e) => setCableK(e.target.value)} style={{ ...numSt, width: 48 }} />D
            </label>
          </div>
          <div style={{ fontSize: 11, color: SUB, marginTop: 6 }}>目安：CV多心 6D／CVT・単心 8D／LAN 4D／光 10D。直角引きがある場合のみ判定に使います。</div>
          <button onClick={() => setShowAdv((v) => !v)} style={{ border: "none", background: "none", color: SUB, fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 8, padding: 0 }}>
            {showAdv ? "詳細設定を閉じる" : "詳細設定（あき寸法・深さ余裕）"}
          </button>
          {showAdv && (
            <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", fontSize: 12, color: SUB }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5 }}>管間あき<input type="number" value={gap} onChange={(e) => setGap(Number(e.target.value) || 0)} style={numSt} />mm</label>
              <label style={{ display: "flex", alignItems: "center", gap: 5 }}>端あき<input type="number" value={edge} onChange={(e) => setEdge(Number(e.target.value) || 0)} style={numSt} />mm</label>
              <label style={{ display: "flex", alignItems: "center", gap: 5 }}>深さ余裕<input type="number" value={depthMargin} onChange={(e) => setDepthMargin(Number(e.target.value) || 0)} style={numSt} />mm</label>
            </div>
          )}
        </div>

        {/* results */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={eyebrow}>判定結果</div>
          {calc.empty ? (
            <div style={{ fontSize: 13, color: SUB }}>電線管を追加すると結果が表示されます。</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#F7F8F5", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: SUB }}>推奨サイズ（50mm単位切上げ）</div>
                <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 26, marginTop: 2 }}>
                  {calc.W} × {calc.L} × {calc.D}
                </div>
                <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>W（管が並ぶ方向）× L（引抜き方向）× D（深さ）mm</div>
              </div>
              <Plan />
              <div>
                <div style={{ fontSize: 12, color: SUB, marginBottom: 6 }}>寸法の決定要因（最大値が採用されます）</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {calc.crits.map((c, i) => {
                    const governs = c === calc.governW || c === calc.governL;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: 8, background: governs ? "#F1F3EE" : "transparent" }}>
                        <div style={{ fontSize: 12, flex: 1, color: governs ? INK : SUB }}>{c.label}</div>
                        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14 }}>{Math.round(c.value)}</div>
                        {governs && <span style={{ fontSize: 10, color: "#2B8A3E", fontWeight: 700 }}>決定</span>}
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 9px" }}>
                    <div style={{ fontSize: 12, flex: 1, color: SUB }}>深さ（最大管径 {calc.maxAll} ＋ 余裕 {depthMargin}）</div>
                    <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14 }}>{calc.maxAll + depthMargin}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: SUB, lineHeight: 1.8, padding: "0 4px" }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>前提・注意</div>
          ・直線引き8倍・直角引き「6倍＋同一面の他管径の和」は電気設備設計で広く用いられる選定則です。あき寸法・深さ余裕・曲げ倍率は目安値なので、社内基準や監理指針・メーカー技術資料に合わせて調整してください。<br />
          ・全管が同一面に並ぶ想定で幅を計算しています。上下面・複数面に分かれる場合は面ごとに読み替えてください。<br />
          ・高圧ケーブルや遮へい付ケーブルは曲げ倍率が大きくなります（10〜12D等）。カタログ値で確認を。<br />
          ・屋外・防水（ちょう番・パッキン付）や結露対策、支持荷重は別途検討してください。
        </div>

        <article style={{ marginTop: 28, background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "20px 18px", fontSize: 13, lineHeight: 2 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>プルボックスの大きさはどう決める？</h2>
          <p style={{ margin: "0 0 18px", color: "#454C52" }}>
            プルボックスの寸法は感覚で決められがちですが、実務では「直線引きは最大管径の8倍」「直角引きは最大管径の6倍に同一面のその他の管径を加えた長さ」という選定則が広く使われています。さらに中を通るケーブルの許容曲げ半径（CV多心で仕上外径の6倍、CVTや単心で8倍が目安）が箱の中で確保できるか、管をロックナット・ブッシング込みで並べられる幅があるか、の4点を満たすサイズが必要です。本ツールはこの4条件を同時に計算し、どの条件で寸法が決まったかも表示します。
          </p>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>迷ったら1サイズ上を</h2>
          <p style={{ margin: 0, color: "#454C52" }}>
            プルボックスは小さくて困ることはあっても、大きくて困ることはほぼありません。将来の増設、通線作業のしやすさ、結線スペースを考えると、計算値ぎりぎりよりワンサイズ上を選ぶのが現場的には安全です。計算結果は参考情報のため、実施設計では特記仕様書・監理指針・社内基準に従ってください。
          </p>
        </article>

        <footer style={{ marginTop: 20, fontSize: 12, color: SUB, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <a href="../" style={{ color: SUB }}>← ツール一覧へ</a>
          <a href="https://forms.gle/ifJ9uVDc1QBDRZas8" target="_blank" rel="noopener" style={{ color: SUB }}>機能リクエスト</a>
          <a href="../conduit-checker/" style={{ color: SUB }}>電線管サイズ選定 →</a>
        </footer>
      </div>
    </div>
  );
}
