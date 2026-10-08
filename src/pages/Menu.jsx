import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Button, DishArt, Spinner, useToast, confetti, useCount } from "../components/ui.jsx";
import * as api from "../lib/api.js";
import { LANGS, tt, loc, detectLang, saveLang } from "../lib/i18n.js";
import { money, go, TG, inTG, haptic } from "../lib/util.js";

export default function Menu({ slug, code }) {
  const toast = useToast();
  const [data, setData] = useState(undefined);
  const [lang, setLang] = useState(detectLang);
  const [cart, setCart] = useState({}); // dish_id -> qty
  const [active, setActive] = useState("pop");
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(null); // 'cart' | 'lang' | dish
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [bump, setBump] = useState(0);
  const fabRef = useRef(null);
  const pillsRef = useRef(null);
  const L = (k) => tt(k, lang);

  useEffect(() => {
    api.getMenu(slug, code).then(setData).catch(() => setData(null));
    try { sessionStorage.setItem("mehmon.lastMenu", `/m/${slug}/${code}`); } catch {}
    if (inTG()) { TG.ready(); TG.expand(); try { TG.setHeaderColor("#110D0A"); TG.setBackgroundColor("#110D0A"); } catch {} }
  }, [slug, code]);

  useEffect(() => {
    if (data?.restaurant?.accent) document.documentElement.style.setProperty("--gold", data.restaurant.accent);
  }, [data]);

  const dishes = data?.dishes || [];
  const byId = useMemo(() => Object.fromEntries(dishes.map((d) => [d.id, d])), [dishes]);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((a, [id, n]) => a + (byId[id]?.price || 0) * n, 0);
  const shownTotal = useCount(total, 500);
  const filtered = q.trim()
    ? dishes.filter((d) => (loc(d.name, lang) + " " + loc(d.name, "uz") + " " + loc(d.description, lang)).toLowerCase().includes(q.toLowerCase()))
    : null;

  // Scroll-spy
  useEffect(() => {
    if (!data) return;
    const on = () => {
      const secs = [...document.querySelectorAll("[data-sec]")];
      let cur = secs[0]?.dataset.sec;
      for (const s of secs) if (s.getBoundingClientRect().top < 170) cur = s.dataset.sec;
      if (cur) setActive(cur);
    };
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, [data]);
  useEffect(() => {
    const el = pillsRef.current?.querySelector(`[data-pill="${active}"]`);
    if (el && pillsRef.current) {
      const ind = pillsRef.current.querySelector(".pills__ind");
      ind.style.width = el.offsetWidth + "px";
      ind.style.transform = `translateX(${el.offsetLeft}px)`;
      pillsRef.current.scrollTo({ left: el.offsetLeft - 60, behavior: "smooth" });
    }
  }, [active, data, lang]);

  function add(d, e, n = 1) {
    setCart((c) => ({ ...c, [d.id]: (c[d.id] || 0) + n }));
    haptic("light");
    setBump((b) => b + 1);
    if (e && fabRef.current) {
      const from = e.currentTarget.getBoundingClientRect(), to = fabRef.current.getBoundingClientRect();
      const fly = document.createElement("div");
      fly.className = "fly"; fly.textContent = d.emoji;
      fly.style.left = from.left + from.width / 2 + "px"; fly.style.top = from.top + from.height / 2 + "px";
      document.body.appendChild(fly);
      requestAnimationFrame(() => {
        fly.style.transform = `translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.top + to.height / 2 - from.top - from.height / 2}px) scale(.4)`;
        fly.style.opacity = "0.2";
      });
      setTimeout(() => fly.remove(), 700);
    }
  }
  const dec = (id) => setCart((c) => { const n = (c[id] || 0) - 1; const x = { ...c }; if (n > 0) x[id] = n; else delete x[id]; return x; });

  async function order() {
    if (!count) return;
    setBusy(true);
    try {
      const r = await api.placeOrder({
        slug, code, lang, note: note.trim() || null,
        items: Object.entries(cart).map(([dish_id, qty]) => ({ dish_id, qty })),
        initData: TG?.initData || null,
      });
      try { TG?.HapticFeedback?.notificationOccurred("success"); } catch {}
      confetti();
      try { const mine = JSON.parse(localStorage.getItem("mehmon.orders") || "[]"); localStorage.setItem("mehmon.orders", JSON.stringify([r.token, ...mine].slice(0, 10))); } catch {}
      setCart({}); setSheet(null); setNote("");
      setTimeout(() => go(`/o/${r.token}`), 650);
    } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }

  async function call(kind) {
    try { await api.callStaff(slug, code, kind); haptic("medium"); toast(kind === "bill" ? L("billAsked") : L("called")); }
    catch (e) { toast(e.message, "err"); }
  }

  if (data === undefined) return <div className="center"><div className="loader"><span>🍽</span></div></div>;
  if (!data) return <div className="center"><div className="empty"><span>🧭</span><h3>{L("notFound")}</h3></div></div>;

  const { restaurant, table, categories } = data;
  const popular = dishes.filter((d) => d.is_popular);
  const sections = categories.map((c) => ({ ...c, items: dishes.filter((d) => d.category_id === c.id) })).filter((s) => s.items.length);
  const jump = (id) => {
    const el = document.querySelector(`[data-sec="${id}"]`);
    if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 140, behavior: "smooth" });
  };
  const curLang = LANGS.find((l) => l.code === lang);

  const Row = ({ d, i }) => (
    <div className="dish" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }} onClick={() => setSheet(d)}>
      <DishArt dish={d} />
      <div className="dish__body">
        <b className="dish__name">{loc(d.name, lang)}</b>
        <p className="dish__desc">{loc(d.description, lang)}</p>
        <div className="dish__meta">
          <span><Icon name="clock" size={13} /> {d.prep_min} {L("min")}</span>
          {d.is_spicy && <span className="tag tag--red">🌶 {L("spicy")}</span>}
          {d.is_veg && <span className="tag tag--green">🌿</span>}
        </div>
        <div className="dish__foot">
          <b className="price">{money(d.price, false)} <small>so'm</small></b>
          {cart[d.id] ? (
            <div className="stepper" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => dec(d.id)}><Icon name="minus" size={16} /></button>
              <span key={cart[d.id]}>{cart[d.id]}</span>
              <button onClick={(e) => add(d, e)}><Icon name="plus" size={16} /></button>
            </div>
          ) : (
            <button className="addbtn" onClick={(e) => { e.stopPropagation(); add(d, e); }}><Icon name="plus" size={18} stroke={2.6} /></button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="gm">
      <div className="gm__glow" />
      <header className="gm__head">
        <div>
          <small className="gm__hi">{L("welcome")} 👋</small>
          <h1>{restaurant.name}</h1>
        </div>
        <div className="gm__head-r">
          {table && <span className="chip chip--gold">{table.label}</span>}
          <button className="chip" onClick={() => setSheet("lang")}>{curLang.flag} {curLang.code.toUpperCase()}</button>
        </div>
      </header>

      <div className="gm__search"><Icon name="search" size={18} /><input placeholder={L("search")} value={q} onChange={(e) => setQ(e.target.value)} /></div>

      {!filtered && (
        <nav className="pills" ref={pillsRef}>
          <span className="pills__ind" />
          {popular.length > 0 && <button data-pill="pop" className={active === "pop" ? "is-on" : ""} onClick={() => jump("pop")}>⭐ {L("popular")}</button>}
          {sections.map((s) => <button key={s.id} data-pill={s.id} className={active === s.id ? "is-on" : ""} onClick={() => jump(s.id)}>{s.emoji} {loc(s.name, lang)}</button>)}
        </nav>
      )}

      <main className="gm__main" key={lang}>
        {filtered ? (
          <section className="sec">{filtered.map((d, i) => <Row key={d.id} d={d} i={i} />)}</section>
        ) : (
          <>
            {popular.length > 0 && (
              <section data-sec="pop" className="sec">
                <h2 className="sec__title">⭐ {L("popular")}</h2>
                <div className="carousel">
                  {popular.map((d, i) => (
                    <div key={d.id} className="pcard" style={{ animationDelay: `${i * 70}ms` }} onClick={() => setSheet(d)}>
                      <DishArt dish={d} size="lg" />
                      <b>{loc(d.name, lang)}</b>
                      <div className="pcard__foot">
                        <span className="price">{money(d.price, false)}</span>
                        <button className="addbtn addbtn--sm" onClick={(e) => { e.stopPropagation(); add(d, e); }}><Icon name="plus" size={16} stroke={2.6} /></button>
                      </div>
                      {cart[d.id] > 0 && <span className="pcard__badge">{cart[d.id]}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {sections.map((s) => (
              <section key={s.id} data-sec={s.id} className="sec">
                <h2 className="sec__title">{s.emoji} {loc(s.name, lang)}</h2>
                {s.items.map((d, i) => <Row key={d.id} d={d} i={i} />)}
              </section>
            ))}
          </>
        )}
        <div className="gm__spacer" />
      </main>

      <div className="dock">
        <button className="dock__mini" onClick={() => call("waiter")}><Icon name="bell" size={18} /><span>{L("waiter")}</span></button>
        <button className="dock__mini" onClick={() => call("bill")}><Icon name="receipt" size={18} /><span>{L("bill")}</span></button>
        <button ref={fabRef} className={`dock__cart ${count ? "is-on" : ""}`} onClick={() => setSheet("cart")}>
          <span className="dock__bag" key={bump}><Icon name="bag" size={20} />{count > 0 && <em>{count}</em>}</span>
          <span>{count ? money(shownTotal) : L("cart")}</span>
          <Icon name="arrowRight" size={18} />
        </button>
      </div>

      {/* SHEETS */}
      <div className={`sheet-bg ${sheet ? "is-on" : ""}`} onClick={() => setSheet(null)} />
      <div className={`sheet ${sheet ? "is-on" : ""}`}>
        <div className="sheet__grip" />
        {sheet === "lang" && (
          <div className="langs">
            {LANGS.map((l, i) => (
              <button key={l.code} className={l.code === lang ? "is-on" : ""} style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => { setLang(l.code); saveLang(l.code); setSheet(null); haptic(); }}>
                <span>{l.flag}</span>{l.name}{l.code === lang && <Icon name="check" size={18} />}
              </button>
            ))}
          </div>
        )}
        {sheet && typeof sheet === "object" && (
          <div className="ddet">
            <DishArt dish={sheet} size="xl" />
            <h2>{loc(sheet.name, lang)}</h2>
            {lang !== "uz" && <small className="ddet__orig">{loc(sheet.name, "uz")}</small>}
            <p>{loc(sheet.description, lang)}</p>
            <div className="dish__meta">
              <span><Icon name="clock" size={14} /> {sheet.prep_min} {L("min")}</span>
              {sheet.is_spicy && <span className="tag tag--red">🌶 {L("spicy")}</span>}
              {sheet.is_veg && <span className="tag tag--green">🌿 {L("veg")}</span>}
            </div>
            <Button size="lg" icon="plus" className="w100" onClick={(e) => { add(sheet, e); setSheet(null); }}>
              {L("add")} · {money(sheet.price)}
            </Button>
          </div>
        )}
        {sheet === "cart" && (
          <div className="cart">
            <h2>{L("cart")}</h2>
            {!count ? <p className="muted center-text">{L("empty")}</p> : (
              <>
                <div className="cart__list">
                  {Object.entries(cart).map(([id, n]) => byId[id] && (
                    <div key={id} className="cart__row">
                      <span className="cart__emoji">{byId[id].emoji}</span>
                      <span className="cart__name"><b>{loc(byId[id].name, lang)}</b><small>{money(byId[id].price)}</small></span>
                      <div className="stepper">
                        <button onClick={() => dec(id)}><Icon name="minus" size={16} /></button>
                        <span key={n}>{n}</span>
                        <button onClick={() => add(byId[id])}><Icon name="plus" size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <textarea className="input" rows={2} placeholder={L("note")} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="cart__total"><span>{L("total")}</span><b>{money(shownTotal)}</b></div>
                <Button size="lg" className="w100" loading={busy} icon="check" onClick={order}>{L("order")}</Button>
                {table && <p className="muted center-text small">{restaurant.name} · {table.label}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
