import { useEffect, useRef, useState } from "react";
import { Icon, Button, Logo, confetti } from "../components/ui.jsx";
import * as api from "../lib/api.js";
import { tt, loc, detectLang } from "../lib/i18n.js";
import { money, go, usePoll, clock, ding, TG, inTG } from "../lib/util.js";

const STEPS = [
  { k: "new", e: "📝" },
  { k: "cooking", e: "👨‍🍳" },
  { k: "ready", e: "🛎" },
  { k: "served", e: "😋" },
];

export default function Status({ token }) {
  const [lang] = useState(detectLang);
  const L = (k) => tt(k, lang);
  const [o, , err] = usePoll(() => api.orderStatus(token), 3000, [token]);
  const prev = useRef(null);

  useEffect(() => { if (inTG()) { TG.ready(); TG.expand(); } }, []);
  useEffect(() => {
    if (!o) return;
    if (prev.current && prev.current !== o.status) {
      try { TG?.HapticFeedback?.notificationOccurred("success"); } catch {}
      if (o.status === "ready") { ding(3); confetti(); }
    }
    prev.current = o.status;
  }, [o?.status]);

  if (o === undefined && !err) return <div className="center"><div className="loader"><span>🛎</span></div></div>;
  if (!o) return <div className="center"><div className="empty"><span>🧾</span><h3>{L("notFound")}</h3></div></div>;

  const idx = o.status === "cancelled" ? -1 : STEPS.findIndex((s) => s.k === o.status);
  const back = (() => { try { return sessionStorage.getItem("mehmon.lastMenu"); } catch { return null; } })() || `/m/${o.slug}/`;
  const pct = idx < 0 ? 0 : (idx + 1) / STEPS.length;
  const R = 92, C = 2 * Math.PI * R;

  return (
    <div className={`st st--${o.status}`}>
      <div className="st__glow" />
      <header className="st__head">
        <Logo size={28} />
        <span className="chip">{o.table_label || ""}</span>
      </header>

      <div className="st__hero">
        <div className="st__ring">
          <svg viewBox="0 0 220 220">
            <circle cx="110" cy="110" r={R} className="st__track" />
            <circle cx="110" cy="110" r={R} className="st__bar" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - pct) }} />
          </svg>
          <div className="st__emoji" key={o.status}>
            {o.status === "cooking" && <span className="st__fire"><i /><i /><i /></span>}
            {idx >= 0 ? STEPS[idx].e : "✖️"}
          </div>
        </div>
        <small className="st__no">{L("orderNo")} #{o.number}</small>
        <h1 key={o.status} className="st__title">{L(`st_${o.status}`)}</h1>
        <p className="muted small"><span className="live-dot" /> {L("updates")}</p>
      </div>

      <ol className="st__steps">
        {STEPS.map((s, i) => (
          <li key={s.k} className={i < idx ? "is-done" : i === idx ? "is-now" : ""}>
            <span className="st__dot">{i < idx ? <Icon name="check" size={14} stroke={3} /> : s.e}</span>
            <b>{L(`st_${s.k}`)}</b>
            {i === 0 && <small>{clock(o.created_at)}</small>}
            {i === idx && i > 0 && <small>{clock(o.updated_at)}</small>}
          </li>
        ))}
      </ol>

      <div className="st__card">
        <div className="st__card-h"><b>{o.restaurant}</b><span className="muted small">{clock(o.created_at)}</span></div>
        {o.items.map((it, i) => (
          <div key={i} className="st__item">
            <span>{it.emoji}</span><b>{loc(it.name, lang)}</b><em>×{it.qty}</em><span className="muted">{money(it.price * it.qty, false)}</span>
          </div>
        ))}
        <div className="cart__total"><span>{L("total")}</span><b>{money(o.total)}</b></div>
      </div>

      <div className="st__foot">
        <Button size="lg" variant="ghost" icon="plus" className="w100" onClick={() => go(back)}>{L("more")}</Button>
      </div>
    </div>
  );
}
