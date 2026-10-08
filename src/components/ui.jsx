import { useEffect, useState, createContext, useContext, useCallback, useMemo, useRef } from "react";
import QRCode from "qrcode-terminal/vendor/QRCode/index.js";
import QRErrorCorrectLevel from "qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel.js";

const P = {
  plus: "M12 5v14M5 12h14", minus: "M5 12h14", x: "M18 6 6 18M6 6l12 12", check: "M20 6 9 17l-5-5",
  arrowRight: "M5 12h14M13 5l7 7-7 7", arrowLeft: "M19 12H5M11 19l-7-7 7-7",
  bag: "M6 7h12l1 13H5zM9 7a3 3 0 0 1 6 0",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  receipt: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14h1",
  tg: "M21.5 4.5 2.8 11.7c-1 .4-1 1.6 0 1.9l4.7 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.4 4.9 3.6c.6.4 1.4.1 1.6-.6l3.2-15.4c.2-1-.7-1.8-1.7-1.3zM7.5 15.1l10-7.6",
  chef: "M6 13.9V21h12v-7.1M6 17h12M7 14a4 4 0 0 1-1-7.9 6 6 0 0 1 12 0A4 4 0 0 1 17 14z",
  menu: "M3 6h18M3 12h18M3 18h18", grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  chart: "M3 3v18h18M7 15l4-4 3 3 6-6", settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-2.8 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.8-1.2 2 2 0 1 1-2.8-2.8A1.7 1.7 0 0 0 3.3 13a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.8 2 2 0 1 1 2.8-2.8A1.7 1.7 0 0 0 10 2.2a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.8 1.2 2 2 0 1 1 2.8 2.8A1.7 1.7 0 0 0 20.8 9a2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.4 2z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 3v4M17 5h4",
  printer: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  flame: "M12 22c4 0 7-3 7-7 0-5-5-8-5-13-3 2-6 6-6 10-1-1-2-2-2-4-2 2-1 6-1 7 0 4 3 7 7 7z",
  leaf: "M11 20A7 7 0 0 1 4 13c0-6 5-10 16-10 0 9-4 17-9 17zM4 21c3-5 6-8 11-11",
  copy: "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  volume: "M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14",
  mute: "M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6",
};
export function Icon({ name, size = 20, stroke = 2, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={P[name]} /></svg>
  );
}

export function Logo({ size = 30 }) {
  return (
    <span className="logo" style={{ fontSize: size * 0.68 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD56A" /><stop offset="1" stopColor="#E9A21A" /></linearGradient></defs>
        <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#lg)" />
        <path d="M11 12h6v6h-6zM23 12h6v6h-6zM11 24h6v6h-6z" fill="#120E0B" />
        <path d="M24 25.5c1.5 2 3.5 2 5 0" stroke="#120E0B" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </svg>
      Mehmon
    </span>
  );
}

export function Button({ variant = "gold", size = "md", icon, children, loading, className = "", ...rest }) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="spin" /> : icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children && <span>{children}</span>}
    </button>
  );
}
export const Spinner = ({ size = 26 }) => <span className="spin" style={{ width: size, height: size }} />;

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const on = (e) => e.key === "Escape" && onClose?.();
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal__card ${wide ? "modal__card--wide" : ""}`}>
        <div className="modal__head"><h3>{title}</h3><button className="iconbtn" onClick={onClose}><Icon name="x" /></button></div>
        {children}
      </div>
    </div>
  );
}

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, set] = useState([]);
  const push = useCallback((text, type = "ok") => {
    const id = Math.random();
    set((x) => [...x, { id, text, type }]);
    setTimeout(() => set((x) => x.filter((i) => i.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">{items.map((t) => <div key={t.id} className={`toast toast--${t.type}`}>{t.text}</div>)}</div>
    </ToastCtx.Provider>
  );
}

/** QR kod (SVG) — kutubxonasiz */
export function QR({ value, size = 220, fg = "#120E0B", bg = "#FFFFFF", logo = true }) {
  const modules = useMemo(() => {
    const q = new QRCode(-1, QRErrorCorrectLevel.H);
    q.addData(value);
    q.make();
    const n = q.getModuleCount();
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) cells.push([r, c]);
    return { n, cells };
  }, [value]);
  const { n, cells } = modules;
  const pad = 2, total = n + pad * 2;
  const isFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const lw = n * 0.22, lo = (total - lw) / 2;
  return (
    <svg viewBox={`0 0 ${total} ${total}`} width={size} height={size} className="qr" shapeRendering="geometricPrecision">
      <rect width={total} height={total} rx="2" fill={bg} />
      {cells.filter(([r, c]) => !isFinder(r, c) && !(logo && r + pad > lo - 0.5 && r + pad < lo + lw + 0.5 && c + pad > lo - 0.5 && c + pad < lo + lw + 0.5))
        .map(([r, c], i) => <rect key={i} x={c + pad + 0.08} y={r + pad + 0.08} width="0.84" height="0.84" rx="0.3" fill={fg} />)}
      {[[0, 0], [0, n - 7], [n - 7, 0]].map(([r, c], i) => (
        <g key={i} transform={`translate(${c + pad} ${r + pad})`}>
          <rect x="0.5" y="0.5" width="6" height="6" rx="1.8" fill="none" stroke={fg} strokeWidth="1" />
          <rect x="2" y="2" width="3" height="3" rx="0.9" fill={fg} />
        </g>
      ))}
      {logo && (
        <g transform={`translate(${lo} ${lo})`}>
          <rect width={lw} height={lw} rx={lw * 0.28} fill="#F5B829" />
          <text x={lw / 2} y={lw * 0.7} textAnchor="middle" fontSize={lw * 0.62} fontWeight="900" fontFamily="Arial" fill="#120E0B">M</text>
        </g>
      )}
    </svg>
  );
}

/** Taom vizual: rasm bo'lsa rasm, bo'lmasa idishdagi emoji */
export function DishArt({ dish, size = "md" }) {
  const [broken, setBroken] = useState(false);
  if (dish.photo_url && !broken) {
    return <div className={`art art--${size}`}><img src={dish.photo_url} alt="" loading="lazy" onError={() => setBroken(true)} /></div>;
  }
  return (
    <div className={`art art--${size} art--plate`}>
      <span className="art__steam"><i /><i /><i /></span>
      <span className="art__emoji">{dish.emoji || "🍽"}</span>
    </div>
  );
}

/** Konfetti (canvas) */
export function confetti() {
  const c = document.createElement("canvas");
  c.className = "confetti";
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  const colors = ["#F5B829", "#E5484D", "#3DD68C", "#F7EFE3", "#7AA7FF"];
  const parts = Array.from({ length: 140 }, () => ({
    x: c.width / 2, y: c.height * 0.55, vx: (Math.random() - 0.5) * 26 * devicePixelRatio,
    vy: (-Math.random() * 22 - 8) * devicePixelRatio, r: (4 + Math.random() * 6) * devicePixelRatio,
    col: colors[(Math.random() * colors.length) | 0], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
  }));
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.vy += 0.7 * devicePixelRatio; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    }
    if (++f < 150) requestAnimationFrame(tick); else c.remove();
  })();
}

/** Raqam animatsiyasi */
export function useCount(target, ms = 900) {
  const [v, setV] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current; prev.current = target;
    let raf, st;
    const step = (t) => { st ??= t; const p = Math.min(1, (t - st) / ms); setV(from + (target - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
