import { useEffect, useRef, useState } from "react";
import { Icon, Logo, Spinner, useToast } from "../components/ui.jsx";
import * as api from "../lib/api.js";
import { loc } from "../lib/i18n.js";
import { go, usePoll, ding, ago, clock, money } from "../lib/util.js";
import { LANGS } from "../lib/i18n.js";

const COLS = [
  { k: "new", title: "Yangi", e: "🆕", next: "cooking", act: "Boshlash" },
  { k: "cooking", title: "Tayyorlanmoqda", e: "🔥", next: "ready", act: "Tayyor" },
  { k: "ready", title: "Tayyor", e: "🛎", next: "served", act: "Berildi" },
];
const flag = (l) => LANGS.find((x) => x.code === l)?.flag || "";

export default function Kitchen() {
  const toast = useToast();
  const [mode, setMode] = useState(null); // {demo:true} | {rid, name}
  const [sound, setSound] = useState(true);
  const [, tick] = useState(0);
  const seen = useRef(null);
  const seenCalls = useRef(null);
  const [fresh, setFresh] = useState({});

  useEffect(() => {
    (async () => {
      try {
        if (await api.auth.restore()) {
          const r = await api.myRestaurant();
          if (r) return setMode({ rid: r.id, name: r.name });
        }
      } catch {}
      setMode({ demo: true });
    })();
    const t = setInterval(() => tick((x) => x + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const [board, setBoard] = usePoll(async () => {
    if (!mode) return undefined;
    if (mode.demo) { const b = await api.demoBoard(); return { ...b, name: b.restaurant?.name }; }
    return { ...(await api.ownerBoard(mode.rid)), name: mode.name };
  }, 2500, [mode]);

  // Yangi buyurtma / chaqiruv → ovoz + yorqin animatsiya
  useEffect(() => {
    if (!board) return;
    const ids = new Set(board.orders.map((o) => o.id));
    if (seen.current) {
      const nw = board.orders.filter((o) => !seen.current.has(o.id)).map((o) => o.id);
      if (nw.length) {
        if (sound) ding(2);
        setFresh((f) => ({ ...f, ...Object.fromEntries(nw.map((i) => [i, 1])) }));
        setTimeout(() => setFresh((f) => { const x = { ...f }; nw.forEach((i) => delete x[i]); return x; }), 4000);
      }
    }
    seen.current = ids;
    const cids = new Set(board.calls.map((c) => c.id));
    if (seenCalls.current && board.calls.some((c) => !seenCalls.current.has(c.id)) && sound) ding(4);
    seenCalls.current = cids;
  }, [board]);

  async function move(o, status) {
    setBoard((b) => ({ ...b, orders: b.orders.map((x) => (x.id === o.id ? { ...x, status, updated_at: new Date().toISOString() } : x)) }));
    try { await api.setStatus(o.id, status, !!mode.demo); }
    catch (e) { toast(e.message, "err"); }
  }
  async function done(c) {
    setBoard((b) => ({ ...b, calls: b.calls.filter((x) => x.id !== c.id) }));
    try { mode.demo ? await api.demoCallDone(c.id) : await api.update("mn_calls", c.id, { done: true }); } catch (e) { toast(e.message, "err"); }
  }

  if (!board) return <div className="center"><Spinner /></div>;
  const today = board.orders.filter((o) => o.status !== "cancelled");
  const served = today.filter((o) => o.status === "served");

  return (
    <div className="kds">
      <header className="kds__head">
        <div className="kds__brand">
          <Logo size={30} />
          <span className="kds__sep" />
          <div><b>{board.name || "Oshxona"}</b><small><span className="live-dot" /> Oshxona ekrani {mode.demo && "· DEMO"}</small></div>
        </div>
        <div className="kds__stats">
          <span><b>{today.length}</b> bugun</span>
          <span><b>{served.length}</b> berildi</span>
          <span><b>{money(today.reduce((a, o) => a + Number(o.total), 0), false)}</b> so'm</span>
        </div>
        <div className="kds__tools">
          <button className="iconbtn" title="Ovoz" onClick={() => { setSound(!sound); if (!sound) ding(1); }}><Icon name={sound ? "volume" : "mute"} /></button>
          <button className="iconbtn" title="Panel" onClick={() => go(mode.demo ? "/" : "/admin")}><Icon name="grid" /></button>
        </div>
      </header>

      {board.calls.length > 0 && (
        <div className="kds__calls">
          {board.calls.map((c) => (
            <button key={c.id} className={`call call--${c.kind}`} onClick={() => done(c)}>
              <span className="call__ic">{c.kind === "bill" ? "🧾" : "🔔"}</span>
              <b>{c.table_label}</b>
              <span>{c.kind === "bill" ? "hisob so'rayapti" : "ofitsiant chaqiryapti"}</span>
              <small>{ago(c.created_at)}</small>
              <Icon name="check" size={16} />
            </button>
          ))}
        </div>
      )}

      <div className="kds__cols">
        {COLS.map((col) => {
          const items = board.orders.filter((o) => o.status === col.k).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          return (
            <section key={col.k} className={`kcol kcol--${col.k}`}>
              <h3><span>{col.e}</span>{col.title}<em>{items.length}</em></h3>
              <div className="kcol__list">
                {items.length === 0 && <div className="kcol__empty">Bo'sh</div>}
                {items.map((o) => {
                  const mins = (Date.now() - new Date(o.created_at)) / 60000;
                  return (
                    <article key={o.id} className={`kcard ${fresh[o.id] ? "is-fresh" : ""} ${mins > 20 && col.k !== "ready" ? "is-late" : ""}`}>
                      <div className="kcard__top">
                        <b className="kcard__no">#{o.number}</b>
                        <span className="kcard__table">{o.table_label}</span>
                        <span className="kcard__time"><Icon name="clock" size={13} /> {ago(o.created_at)}</span>
                      </div>
                      <ul>
                        {o.items.map((it, i) => <li key={i}><em>{it.qty}×</em><span>{it.emoji}</span>{loc(it.name, "uz")}</li>)}
                      </ul>
                      {o.note && <p className="kcard__note">💬 {o.note}</p>}
                      <div className="kcard__foot">
                        <small>{flag(o.lang)} {clock(o.created_at)} · {money(o.total, false)}</small>
                        <button className={`kbtn kbtn--${col.k}`} onClick={() => move(o, col.next)}>{col.act} <Icon name="arrowRight" size={15} /></button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
