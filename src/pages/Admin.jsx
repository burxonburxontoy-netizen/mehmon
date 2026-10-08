import { useEffect, useState } from "react";
import { Icon, Button, Logo, Modal, QR, Spinner, useToast, useCount } from "../components/ui.jsx";
import * as api from "../lib/api.js";
import { LANGS, loc } from "../lib/i18n.js";
import { go, money, clock, ago, usePoll } from "../lib/util.js";

const TABS = [
  { k: "home", t: "Bugun", i: "chart" },
  { k: "menu", t: "Menyu", i: "menu" },
  { k: "tables", t: "Stollar & QR", i: "qr" },
  { k: "orders", t: "Buyurtmalar", i: "receipt" },
  { k: "settings", t: "Sozlamalar", i: "settings" },
];
const STATUS = { new: "Yangi", cooking: "Tayyorlanmoqda", ready: "Tayyor", served: "Berildi", cancelled: "Bekor" };
const origin = () => location.origin + location.pathname.replace(/index\.html$/, "");
const tableUrl = (slug, code) => `${origin()}#/t/${slug}/${code}`;

export default function Admin() {
  const toast = useToast();
  const demo = location.hash.includes("demo");
  const [rest, setRest] = useState(undefined);
  const [tab, setTab] = useState("home");

  useEffect(() => {
    (async () => {
      if (demo) {
        const m = await api.getMenu("demo");
        return setRest(m ? { ...m.restaurant, staff_code: "demo", _menu: m } : null);
      }
      if (!(await api.auth.restore())) return go("/login");
      try { setRest(await api.myRestaurant()); } catch (e) { toast(e.message, "err"); setRest(null); }
    })();
  }, []);

  if (rest === undefined) return <div className="center"><Spinner /></div>;
  if (!rest) return demo ? <div className="center">Demo topilmadi</div> : <Wizard onDone={setRest} />;

  const guard = (fn) => (...a) => (demo ? toast("Demo rejim — o'zgartirish uchun ro'yxatdan o'ting", "err") : fn(...a));
  const logout = async () => { await api.auth.signOut(); go("/"); };

  return (
    <div className="adm">
      <aside className="adm__side">
        <a href="#/" className="adm__logo"><Logo size={30} /></a>
        <div className="adm__rest"><b>{rest.name}</b><small>/{rest.slug}</small></div>
        <nav>
          {TABS.map((t) => (
            <button key={t.k} className={tab === t.k ? "is-on" : ""} onClick={() => setTab(t.k)}><Icon name={t.i} size={18} /><span>{t.t}</span></button>
          ))}
        </nav>
        <div className="adm__side-f">
          <a className="btn btn--gold btn--md w100" href="#/kitchen" target="_blank" rel="noreferrer"><Icon name="chef" size={18} /><span>Oshxona ekrani</span></a>
          {demo ? <a className="btn btn--ghost btn--md w100" href="#/register"><span>Ro'yxatdan o'tish</span></a>
            : <button className="btn btn--ghost btn--md w100" onClick={logout}><Icon name="logout" size={18} /><span>Chiqish</span></button>}
        </div>
      </aside>
      <main className="adm__main" key={tab}>
        {demo && <div className="adm__demo">👀 Demo rejim — faqat ko'rish uchun</div>}
        {tab === "home" && <Home rest={rest} demo={demo} />}
        {tab === "menu" && <MenuTab rest={rest} demo={demo} guard={guard} />}
        {tab === "tables" && <Tables rest={rest} demo={demo} guard={guard} />}
        {tab === "orders" && <Orders rest={rest} demo={demo} />}
        {tab === "settings" && <Settings rest={rest} setRest={setRest} guard={guard} />}
      </main>
    </div>
  );
}

const loadBoard = (rest, demo) => (demo ? api.demoBoard() : api.ownerBoard(rest.id));

function Stat({ label, value, suffix = "", icon }) {
  const v = useCount(value, 900);
  return (
    <div className="stat">
      <span className="stat__ic"><Icon name={icon} size={18} /></span>
      <small>{label}</small>
      <b>{money(v, false)}<em>{suffix}</em></b>
    </div>
  );
}

function Home({ rest, demo }) {
  const [b] = usePoll(() => loadBoard(rest, demo), 5000, []);
  if (!b) return <Spinner />;
  const ok = b.orders.filter((o) => o.status !== "cancelled");
  const rev = ok.reduce((a, o) => a + Number(o.total), 0);
  const active = ok.filter((o) => ["new", "cooking", "ready"].includes(o.status)).length;
  const hours = Array.from({ length: 24 }, (_, h) => ok.filter((o) => new Date(o.created_at).getHours() === h).reduce((a, o) => a + Number(o.total), 0));
  const max = Math.max(1, ...hours);
  const top = {};
  ok.forEach((o) => o.items.forEach((it) => { const k = loc(it.name, "uz"); top[k] = top[k] || { e: it.emoji, n: 0 }; top[k].n += it.qty; }));
  const tops = Object.entries(top).sort((a, b) => b[1].n - a[1].n).slice(0, 5);
  const langs = {};
  ok.forEach((o) => { langs[o.lang] = (langs[o.lang] || 0) + 1; });
  const now = new Date().getHours();

  return (
    <div className="pg">
      <h1 className="pg__t">Bugun <span className="live-dot" /></h1>
      <div className="stats">
        <Stat label="Tushum (24 soat)" value={rev} suffix=" so'm" icon="chart" />
        <Stat label="Buyurtmalar" value={ok.length} icon="receipt" />
        <Stat label="O'rtacha chek" value={ok.length ? rev / ok.length : 0} suffix=" so'm" icon="bag" />
        <Stat label="Hozir faol" value={active} icon="flame" />
      </div>
      <div className="grid2">
        <div className="panel">
          <h3>Soatlar bo'yicha tushum</h3>
          <div className="bars">
            {hours.map((v, h) => (
              <div key={h} className={`bars__c ${h === now ? "is-now" : ""}`} title={`${h}:00 — ${money(v)}`}>
                <i style={{ height: `${(v / max) * 100}%`, animationDelay: `${h * 25}ms` }} />
                {h % 3 === 0 && <small>{h}</small>}
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Top taomlar</h3>
          {tops.length === 0 && <p className="muted">Hali buyurtma yo'q</p>}
          {tops.map(([k, v], i) => (
            <div key={k} className="topd" style={{ animationDelay: `${i * 70}ms` }}>
              <span>{v.e}</span><b>{k}</b>
              <div className="topd__bar"><i style={{ width: `${(v.n / tops[0][1].n) * 100}%` }} /></div>
              <em>{v.n}</em>
            </div>
          ))}
          {Object.keys(langs).length > 0 && (
            <div className="langmix">
              {Object.entries(langs).map(([l, n]) => <span key={l}>{LANGS.find((x) => x.code === l)?.flag} {n}</span>)}
              <small className="muted">mehmonlar tillari</small>
            </div>
          )}
        </div>
      </div>
      <div className="panel">
        <h3>Jonli lenta</h3>
        <div className="feed">
          {b.orders.slice(0, 8).map((o) => (
            <div key={o.id} className="feed__r">
              <span className={`kstat kstat--${o.status}`} />
              <b>#{o.number}</b><span>{o.table_label}</span>
              <span className="feed__items">{o.items.map((i) => i.emoji).join(" ")}</span>
              <span className="muted">{ago(o.created_at)}</span>
              <b>{money(o.total, false)}</b>
            </div>
          ))}
          {b.orders.length === 0 && <p className="muted">Mehmonlar QR'ni skanerlab buyurtma berganda shu yerda paydo bo'ladi.</p>}
        </div>
      </div>
    </div>
  );
}

function Orders({ rest, demo }) {
  const [b] = usePoll(() => loadBoard(rest, demo), 4000, []);
  if (!b) return <Spinner />;
  return (
    <div className="pg">
      <h1 className="pg__t">Buyurtmalar <small className="muted">so'nggi 24 soat</small></h1>
      <div className="panel tbl">
        <div className="tbl__h"><span>#</span><span>Stol</span><span>Taomlar</span><span>Til</span><span>Vaqt</span><span>Holat</span><span>Summa</span></div>
        {b.orders.map((o) => (
          <div key={o.id} className="tbl__r">
            <b>#{o.number}</b><span>{o.table_label}</span>
            <span className="tbl__items">{o.items.map((i) => `${i.emoji} ${loc(i.name, "uz")} ×${i.qty}`).join(", ")}</span>
            <span>{LANGS.find((x) => x.code === o.lang)?.flag}</span>
            <span className="muted">{clock(o.created_at)}</span>
            <span><i className={`badge badge--${o.status}`}>{STATUS[o.status]}</i></span>
            <b>{money(o.total, false)}</b>
          </div>
        ))}
        {b.orders.length === 0 && <p className="muted pad">Hali buyurtma yo'q</p>}
      </div>
    </div>
  );
}

// ------------------------- MENYU -------------------------
function MenuTab({ rest, demo, guard }) {
  const toast = useToast();
  const [cats, setCats] = useState(null);
  const [dishes, setDishes] = useState(null);
  const [edit, setEdit] = useState(null);
  const [cat, setCat] = useState("all");

  const load = async () => {
    if (demo) { setCats(rest._menu.categories); setDishes(rest._menu.dishes.map((d) => ({ ...d, is_available: true }))); return; }
    const [c, d] = await Promise.all([api.list("mn_categories", rest.id), api.list("mn_dishes", rest.id)]);
    setCats(c); setDishes(d);
  };
  useEffect(() => { load().catch((e) => toast(e.message, "err")); }, []);

  const addCat = guard(async () => {
    const name = prompt("Kategoriya nomi (o'zbekcha):");
    if (!name) return;
    const emoji = prompt("Emoji:", "🍽") || "🍽";
    let tr = { uz: name };
    try { tr = { ...(await api.translate(name)), uz: name }; } catch {}
    await api.insert("mn_categories", { restaurant_id: rest.id, name: tr, emoji, sort: cats.length });
    toast("Kategoriya qo'shildi ✨"); load();
  });
  const toggle = guard(async (d) => {
    setDishes((x) => x.map((y) => (y.id === d.id ? { ...y, is_available: !d.is_available } : y)));
    await api.update("mn_dishes", d.id, { is_available: !d.is_available });
  });

  if (!cats) return <Spinner />;
  const shown = dishes.filter((d) => cat === "all" || d.category_id === cat);
  return (
    <div className="pg">
      <div className="pg__row">
        <h1 className="pg__t">Menyu <small className="muted">{dishes.length} ta taom · 6 tilda</small></h1>
        <div className="pg__acts">
          <Button variant="ghost" icon="plus" onClick={addCat}>Kategoriya</Button>
          <Button icon="plus" onClick={guard(() => setEdit({ name: {}, description: {}, price: "", emoji: "🍽", prep_min: 15, category_id: cats[0]?.id || null, is_available: true }))}>Taom</Button>
        </div>
      </div>
      <div className="fpills">
        <button className={cat === "all" ? "is-on" : ""} onClick={() => setCat("all")}>Hammasi</button>
        {cats.map((c) => <button key={c.id} className={cat === c.id ? "is-on" : ""} onClick={() => setCat(c.id)}>{c.emoji} {loc(c.name, "uz")}</button>)}
      </div>
      <div className="mgrid">
        {shown.map((d, i) => (
          <div key={d.id} className={`mcard ${d.is_available ? "" : "is-off"}`} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
            <span className="mcard__e">{d.emoji}</span>
            <div className="mcard__b">
              <b>{loc(d.name, "uz")}</b>
              <small className="muted">{LANGS.filter((l) => d.name?.[l.code]).map((l) => l.flag).join(" ")}</small>
              <span className="price">{money(d.price)}</span>
            </div>
            <div className="mcard__a">
              <label className="switch" title="Mavjud"><input type="checkbox" checked={d.is_available} onChange={() => toggle(d)} /><i /></label>
              <button className="iconbtn" onClick={guard(() => setEdit(d))}><Icon name="edit" size={16} /></button>
            </div>
            {d.is_popular && <span className="mcard__pop">⭐</span>}
          </div>
        ))}
      </div>
      {edit && <DishModal rest={rest} cats={cats} dish={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function DishModal({ rest, cats, dish, onClose, onSaved }) {
  const toast = useToast();
  const [d, setD] = useState({ ...dish, name: { ...dish.name }, description: { ...(dish.description || {}) } });
  const [busy, setBusy] = useState(false);
  const [tr, setTr] = useState(false);
  const [lang, setLang] = useState("uz");
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setL = (k, v) => setD((x) => ({ ...x, [k]: { ...x[k], [lang]: v } }));

  async function auto() {
    if (!d.name.uz) return toast("Avval o'zbekcha nomini yozing", "err");
    setTr(true);
    try {
      const [n, ds] = await Promise.all([api.translate(d.name.uz), d.description.uz ? api.translate(d.description.uz) : null]);
      setD((x) => ({ ...x, name: { ...n, uz: x.name.uz }, description: ds ? { ...ds, uz: x.description.uz } : x.description }));
      toast("5 tilga tarjima qilindi ✨");
    } catch (e) { toast(e.message, "err"); }
    setTr(false);
  }
  async function save() {
    if (!d.name.uz || !d.price) return toast("Nomi va narxi kerak", "err");
    setBusy(true);
    const row = { name: d.name, description: d.description, price: Number(d.price), emoji: d.emoji || "🍽", prep_min: Number(d.prep_min) || 15,
      category_id: d.category_id, photo_url: d.photo_url || null, is_popular: !!d.is_popular, is_spicy: !!d.is_spicy, is_veg: !!d.is_veg, is_available: d.is_available !== false };
    try {
      d.id ? await api.update("mn_dishes", d.id, row) : await api.insert("mn_dishes", { ...row, restaurant_id: rest.id });
      toast("Saqlandi"); onSaved();
    } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }
  async function del() {
    if (!confirm("O'chirilsinmi?")) return;
    await api.remove("mn_dishes", d.id); onSaved();
  }

  return (
    <Modal open title={d.id ? "Taomni tahrirlash" : "Yangi taom"} onClose={onClose} wide>
      <div className="dm">
        <div className="dm__prev"><span>{d.emoji || "🍽"}</span><b>{d.name[lang] || d.name.uz || "Nomi"}</b><em>{money(d.price || 0)}</em></div>
        <div className="dm__langs">
          {LANGS.map((l) => <button key={l.code} className={`${lang === l.code ? "is-on" : ""} ${d.name[l.code] ? "has" : ""}`} onClick={() => setLang(l.code)}>{l.flag}</button>)}
          <Button size="sm" variant="ghost" icon="sparkle" loading={tr} onClick={auto}>Avto-tarjima</Button>
        </div>
        <label className="field"><span>Nomi ({lang.toUpperCase()})</span><input className="input" value={d.name[lang] || ""} onChange={(e) => setL("name", e.target.value)} /></label>
        <label className="field"><span>Tavsif ({lang.toUpperCase()})</span><textarea className="input" rows={2} value={d.description[lang] || ""} onChange={(e) => setL("description", e.target.value)} /></label>
        <div className="row3">
          <label className="field"><span>Narx (so'm)</span><input className="input" type="number" value={d.price} onChange={(e) => set("price", e.target.value)} /></label>
          <label className="field"><span>Emoji</span><input className="input" value={d.emoji} onChange={(e) => set("emoji", e.target.value)} /></label>
          <label className="field"><span>Tayyorlash (daq)</span><input className="input" type="number" value={d.prep_min} onChange={(e) => set("prep_min", e.target.value)} /></label>
        </div>
        <label className="field"><span>Kategoriya</span>
          <select className="input" value={d.category_id || ""} onChange={(e) => set("category_id", e.target.value || null)}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {loc(c.name, "uz")}</option>)}
          </select>
        </label>
        <label className="field"><span>Rasm URL (ixtiyoriy)</span><input className="input" value={d.photo_url || ""} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://…" /></label>
        <div className="checks">
          {[["is_popular", "⭐ Ommabop"], ["is_spicy", "🌶 Achchiq"], ["is_veg", "🌿 Vegetarian"]].map(([k, t]) => (
            <label key={k} className={`ck ${d[k] ? "is-on" : ""}`}><input type="checkbox" checked={!!d[k]} onChange={(e) => set(k, e.target.checked)} />{t}</label>
          ))}
        </div>
        <div className="dm__foot">
          {d.id && <Button variant="ghost" icon="trash" onClick={del}>O'chirish</Button>}
          <Button loading={busy} icon="check" onClick={save}>Saqlash</Button>
        </div>
      </div>
    </Modal>
  );
}

// ------------------------- STOLLAR -------------------------
function Tables({ rest, demo, guard }) {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const load = async () => {
    if (demo) return setRows(Array.from({ length: 8 }, (_, i) => ({ id: i, label: `Stol ${i + 1}`, code: `DEMO${i + 1}` })));
    setRows(await api.list("mn_tables", rest.id, "label.asc"));
  };
  useEffect(() => { load().catch((e) => toast(e.message, "err")); }, []);
  const add = guard(async () => {
    const n = prompt("Stol nomi:", `Stol ${(rows?.length || 0) + 1}`);
    if (!n) return;
    await api.insert("mn_tables", { restaurant_id: rest.id, label: n });
    load();
  });
  const del = guard(async (t) => { if (confirm(`${t.label} o'chirilsinmi?`)) { await api.remove("mn_tables", t.id); load(); } });
  const copy = (t) => { navigator.clipboard?.writeText(tableUrl(rest.slug, t.code)); toast("Havola nusxalandi"); };

  if (!rows) return <Spinner />;
  return (
    <div className="pg">
      <div className="pg__row no-print">
        <h1 className="pg__t">Stollar & QR <small className="muted">{rows.length} ta</small></h1>
        <div className="pg__acts">
          <Button variant="ghost" icon="printer" onClick={() => print()}>Chop etish</Button>
          <Button icon="plus" onClick={add}>Stol</Button>
        </div>
      </div>
      <p className="muted no-print">Har bir QR'ni stolga qo'ying. Mehmon skanerlaydi → Telegram ochiladi → menyu uning tilida.</p>
      <div className="qgrid">
        {rows.map((t, i) => (
          <div key={t.id} className="qcard" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="qcard__top"><Logo size={20} /><b>{t.label}</b></div>
            <div className="qcard__qr"><QR value={tableUrl(rest.slug, t.code)} size={170} /></div>
            <b className="qcard__name">{rest.name}</b>
            <small>📷 Skanerlang · Scan · Сканируйте</small>
            <div className="qcard__flags">🇺🇿 🇷🇺 🇬🇧 🇹🇷 🇨🇳 🇰🇷</div>
            <div className="qcard__acts no-print">
              <a className="iconbtn" href={`#/t/${rest.slug}/${t.code}`} target="_blank" rel="noreferrer" title="Ochish"><Icon name="eye" size={16} /></a>
              <button className="iconbtn" onClick={() => copy(t)} title="Nusxa"><Icon name="copy" size={16} /></button>
              <button className="iconbtn" onClick={() => del(t)} title="O'chirish"><Icon name="trash" size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------- SOZLAMALAR -------------------------
function Settings({ rest, setRest, guard }) {
  const toast = useToast();
  const [f, setF] = useState({ name: rest.name, tagline: rest.tagline || "", address: rest.address || "", phone: rest.phone || "", accent: rest.accent });
  const [busy, setBusy] = useState(false);
  const save = guard(async () => {
    setBusy(true);
    try { setRest({ ...rest, ...(await api.updateRestaurant(rest.id, f)) }); toast("Saqlandi"); } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  });
  const staffLink = api.BOT ? `https://t.me/${api.BOT}?start=staff_${rest.staff_code}` : "";
  const ACC = ["#F5B829", "#E5484D", "#3DD68C", "#7AA7FF", "#C084FC", "#FF8A3D"];
  return (
    <div className="pg">
      <h1 className="pg__t">Sozlamalar</h1>
      <div className="grid2">
        <div className="panel">
          <h3>Restoran</h3>
          {["name", "tagline", "address", "phone"].map((k) => (
            <label key={k} className="field"><span>{{ name: "Nomi", tagline: "Shior", address: "Manzil", phone: "Telefon" }[k]}</span>
              <input className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
          ))}
          <div className="field"><span>Brend rangi</span>
            <div className="accs">{ACC.map((c) => <button key={c} style={{ background: c }} className={f.accent === c ? "is-on" : ""} onClick={() => setF({ ...f, accent: c })} />)}</div>
          </div>
          <Button loading={busy} icon="check" onClick={save}>Saqlash</Button>
        </div>
        <div className="panel">
          <h3>📲 Xodimlar Telegram'i</h3>
          <p className="muted">Oshpaz yoki ofitsiant shu havolani bosib botga /start yuborsa — har bir yangi buyurtma va chaqiruv unga keladi.</p>
          {rest.staff_chat_id ? <p className="ok">✅ Ulangan</p> : <p className="muted small">Hali ulanmagan</p>}
          {staffLink && <>
            <div className="qcard__qr center-qr"><QR value={staffLink} size={150} logo={false} /></div>
            <a className="btn btn--tg btn--md" href={staffLink} target="_blank" rel="noreferrer"><Icon name="tg" size={18} /><span>Xodim sifatida ulash</span></a>
          </>}
          <h3 style={{ marginTop: 24 }}>Menyu havolasi</h3>
          <code className="code">{origin()}#/m/{rest.slug}/</code>
        </div>
      </div>
    </div>
  );
}

// ------------------------- WIZARD -------------------------
function Wizard({ onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ name: "", slug: "" });
  const [copy, setCopy] = useState(true);
  const [busy, setBusy] = useState(false);
  const slugify = (s) => s.toLowerCase().replace(/[ʻʼ'`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.createRestaurant({ name: f.name, slug: f.slug || slugify(f.name) });
      const tables = Array.from({ length: 6 }, (_, i) => api.insert("mn_tables", { restaurant_id: r.id, label: `Stol ${i + 1}` }));
      await Promise.all(tables);
      if (copy) {
        const m = await api.getMenu("demo");
        if (m) {
          const map = {};
          for (const [i, c] of m.categories.entries()) map[c.id] = (await api.insert("mn_categories", { restaurant_id: r.id, name: c.name, emoji: c.emoji, sort: i })).id;
          await Promise.all(m.dishes.map((d, i) => api.insert("mn_dishes", {
            restaurant_id: r.id, category_id: map[d.category_id] || null, name: d.name, description: d.description, price: d.price,
            emoji: d.emoji, prep_min: d.prep_min, is_popular: d.is_popular, is_spicy: d.is_spicy, is_veg: d.is_veg, sort: i,
          })));
        }
      }
      toast("Restoran tayyor! 🎉");
      onDone(r);
    } catch (e) { toast(/duplicate|unique/i.test(e.message) ? "Bu manzil band — boshqasini tanlang" : e.message, "err"); }
    setBusy(false);
  }
  return (
    <div className="center">
      <form className="auth__card wiz" onSubmit={create}>
        <Logo size={32} />
        <h1>Restoraningizni ulaymiz</h1>
        <p className="muted">3 qadam: nom → menyu → QR. Hammasi 1 daqiqa.</p>
        <label className="field"><span>Restoran nomi</span><input className="input" required value={f.name} onChange={(e) => setF({ name: e.target.value, slug: slugify(e.target.value) })} placeholder="Samarqand Darvoza" /></label>
        <label className="field"><span>Manzil (havola)</span><div className="slug"><small>mehmon/</small><input className="input" required pattern="[a-z0-9-]{3,24}" value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} /></div></label>
        <label className={`ck ${copy ? "is-on" : ""}`}><input type="checkbox" checked={copy} onChange={(e) => setCopy(e.target.checked)} />✨ Namuna menyuni nusxalash (16 taom, 6 tilda)</label>
        <Button size="lg" className="w100" loading={busy}>Yaratish</Button>
      </form>
    </div>
  );
}
