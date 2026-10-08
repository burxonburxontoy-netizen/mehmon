import { useEffect, useRef, useState } from "react";
import { Icon, Logo, QR } from "../components/ui.jsx";
import * as api from "../lib/api.js";
import { LANGS, loc } from "../lib/i18n.js";
import { useInView, useScrollProgress, usePoll, money, ago } from "../lib/util.js";

const HELLO = ["Xush kelibsiz", "Добро пожаловать", "Welcome", "Hoş geldiniz", "欢迎光临", "환영합니다"];
const DEMO_DISHES = [
  { e: "🍚", n: ["Samarqand oshi", "Самаркандский плов", "Samarkand plov", "Semerkant pilavı", "撒马尔罕抓饭", "사마르칸트 플로프"], p: 45000 },
  { e: "🥟", n: ["Tandir somsa", "Самса из тандыра", "Tandoor samsa", "Tandır samsa", "馕坑烤包子", "탄디르 삼사"], p: 12000 },
  { e: "🍢", n: ["Qo'y kabob", "Шашлык из баранины", "Lamb kebab", "Kuzu kebap", "羊肉串", "양고기 케밥"], p: 28000 },
  { e: "🍵", n: ["Ko'k choy", "Зелёный чай", "Green tea", "Yeşil çay", "绿茶", "녹차"], p: 8000 },
];

function useCycle(n, ms, on = true) {
  const [i, setI] = useState(0);
  useEffect(() => { if (!on) return; const t = setInterval(() => setI((x) => (x + 1) % n), ms); return () => clearInterval(t); }, [n, ms, on]);
  return i;
}

function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const [ref, seen] = useInView();
  return <Tag ref={ref} className={`rv ${seen ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

/** Telefon ichidagi jonli ssenariy: 0 skan → 1 telegram → 2 menyu → 3 holat */
function Phone({ step, lang = 2 }) {
  return (
    <div className={`phone phone--s${step}`}>
      <div className="phone__notch" />
      <div className="phone__screen">
        {/* 0: kamera */}
        <div className="scr scr--cam">
          <div className="cam__qr"><QR value="https://mehmon.app/#/t/demo/DEMO1" size={130} /></div>
          <div className="cam__frame"><i /><i /><i /><i /><span className="cam__laser" /></div>
          <small>📷 Stol 4</small>
        </div>
        {/* 1: telegram */}
        <div className="scr scr--tg">
          <div className="tg__bar"><span className="tg__ava"><Logo size={22} /></span><b>Mehmon</b><small>bot</small></div>
          <div className="tg__msg tg__msg--1">👋 {HELLO[lang]}! Ipak Yo'li Kafe · Stol 4</div>
          <div className="tg__msg tg__msg--2">🍽 Menyu 6 tilda tayyor</div>
          <div className="tg__btn">Menyuni ochish</div>
        </div>
        {/* 2: menyu */}
        <div className="scr scr--menu">
          <div className="mm__head"><small>{HELLO[lang]} 👋</small><b>Ipak Yo'li</b><span>{LANGS[lang].flag}</span></div>
          {DEMO_DISHES.map((d, i) => (
            <div key={i} className="mm__row" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="mm__e">{d.e}</span>
              <span className="mm__n" key={lang}>{d.n[lang]}</span>
              <span className={`mm__add ${i === 0 ? "is-hit" : ""}`}>+</span>
            </div>
          ))}
          <span className="mm__fly">🍚</span>
          <div className="mm__cart"><Icon name="bag" size={14} /> 1 · 45 000</div>
        </div>
        {/* 3: holat */}
        <div className="scr scr--st">
          <div className="ss__ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" /><circle cx="50" cy="50" r="42" className="ss__bar" /></svg><span>👨‍🍳</span></div>
          <b>Tayyorlanmoqda</b>
          <small>#24 · ~12 daq</small>
          <div className="ss__steps"><i className="on" /><i className="on" /><i /><i /></div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const step = useCycle(4, 2600);
  const li = useCycle(6, 1800);
  return (
    <section className="hero">
      <div className="hero__orbs"><i /><i /><i /></div>
      <div className="hero__grid" />
      <div className="wrap hero__in">
        <div className="hero__copy">
          <span className="eyebrow"><span className="live-dot" /> Turistlar uchun aqlli QR-menyu</span>
          <h1 className="hero__h">
            <span className="hero__hello" key={li}>{HELLO[li].split("").map((c, i) => <i key={i} style={{ animationDelay: `${i * 35}ms` }}>{c === " " ? " " : c}</i>)}</span>
            <span className="hero__line">Skanerla. Tanla.<br /><em>Yeb ko'r.</em></span>
          </h1>
          <p className="hero__p">Mehmon stoldagi QR'ni skanerlaydi — Telegram o'zi ochiladi, menyu uning tilida. Buyurtma oshxona ekraniga <b>1 soniyada</b> tushadi. Ofitsiant kutish, tarjimon, qog'oz menyu — kerak emas.</p>
          <div className="hero__cta">
            <a className="btn btn--gold btn--lg" href="#/register"><span>Restoranni ulash</span><Icon name="arrowRight" size={18} /></a>
            <button className="btn btn--ghost btn--lg" onClick={() => document.getElementById("demo").scrollIntoView({ behavior: "smooth" })}><Icon name="qr" size={18} /><span>Jonli demo</span></button>
          </div>
          <div className="hero__langs">{LANGS.map((l, i) => <span key={l.code} className={i === li ? "is-on" : ""}>{l.flag}</span>)}</div>
        </div>
        <div className="hero__stage">
          <div className="hero__table">
            <div className="tcard"><QR value="https://mehmon.app/#/t/demo/DEMO1" size={92} /><small>Stol 4</small></div>
          </div>
          <Phone step={step} lang={li} />
          <div className={`float float--1 ${step === 2 ? "is-on" : ""}`}>🇰🇷 → 🇺🇿 avto-tarjima</div>
          <div className={`float float--2 ${step === 3 ? "is-on" : ""}`}>🔔 Oshxonaga tushdi · #24</div>
          <div className="hero__steps">{["Skan", "Telegram", "Menyu", "Holat"].map((s, i) => <span key={s} className={i === step ? "is-on" : ""}>{s}</span>)}</div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ["Plov", "Плов", "Pilav", "抓饭", "플로프", "Somsa", "Самса", "Samsa", "烤包子", "삼사", "Shashlik", "Шашлык", "Kebap", "羊肉串", "케밥"];
  return (
    <div className="marq"><div className="marq__t">{[...words, ...words].map((w, i) => <span key={i}>{w}<i>✦</i></span>)}</div></div>
  );
}

function Story() {
  const ref = useRef(null);
  const p = useScrollProgress(ref);
  const step = Math.min(3, Math.floor(p * 4.2));
  const S = [
    { k: "01", t: "QR'ni skanerlaydi", d: "Stoldagi chiroyli QR-kartani oddiy kamera bilan. Ilova o'rnatish shart emas.", e: "📷" },
    { k: "02", t: "Telegram o'zi ochiladi", d: "Sayt mehmonni bir zumda botga yo'naltiradi — Mini App menyu bilan.", e: "✈️" },
    { k: "03", t: "O'z tilida buyurtma", d: "Koreys koreyscha, rus ruscha o'qiydi. Rasm, narx, achchiqligi — hammasi aniq.", e: "🌍" },
    { k: "04", t: "Oshxona darhol ko'radi", d: "Buyurtma oshxona ekraniga tushadi, holat mehmonga Telegram'da keladi.", e: "👨‍🍳" },
  ];
  return (
    <section className="story" ref={ref} id="how">
      <div className="story__sticky">
        <div className="wrap story__in">
          <div className="story__list">
            <span className="eyebrow">Qanday ishlaydi</span>
            <h2 className="h2">4 qadam. 30 soniya.</h2>
            {S.map((s, i) => (
              <div key={s.k} className={`sstep ${i === step ? "is-on" : ""} ${i < step ? "is-past" : ""}`}>
                <span className="sstep__k">{s.k}</span>
                <div><b>{s.e} {s.t}</b><p>{s.d}</p></div>
              </div>
            ))}
            <div className="story__bar"><i style={{ transform: `scaleX(${p})` }} /></div>
          </div>
          <div className="story__phone"><Phone step={step} lang={[2, 1, 5, 0][step]} /></div>
        </div>
      </div>
    </section>
  );
}

function LiveDemo() {
  const url = `${location.origin}${location.pathname}#/t/demo/DEMO1`;
  const [b] = usePoll(() => api.demoBoard().catch(() => null), 4000, []);
  const orders = b?.orders?.slice(0, 5) || [];
  return (
    <section className="live" id="demo">
      <div className="wrap live__in">
        <Reveal className="live__qr">
          <div className="live__card">
            <span className="live__corner" /><span className="live__corner" /><span className="live__corner" /><span className="live__corner" />
            <QR value={url} size={230} />
            <b>Ipak Yo'li Kafe · Stol 1</b>
            <small>Telefon kamerasi bilan skanerlang</small>
          </div>
        </Reveal>
        <Reveal className="live__copy" delay={120}>
          <span className="eyebrow"><span className="live-dot" /> Jonli demo — haqiqiy</span>
          <h2 className="h2">Hoziroq sinab ko'ring</h2>
          <p className="lead">Skanerlang, buyurtma bering — u o'ng tomondagi jonli lentada va oshxona ekranida paydo bo'ladi.</p>
          <div className="live__feed">
            {orders.length === 0 && <div className="live__empty">Birinchi buyurtma siznikidir 👀</div>}
            {orders.map((o) => (
              <div key={o.id} className="live__row">
                <span className={`kstat kstat--${o.status}`} /><b>#{o.number}</b>
                <span>{o.items.map((i) => i.emoji).join(" ")}</span>
                <span className="muted">{LANGS.find((l) => l.code === o.lang)?.flag} {ago(o.created_at)}</span>
                <b>{money(o.total, false)}</b>
              </div>
            ))}
          </div>
          <div className="hero__cta">
            <a className="btn btn--gold btn--md" href="#/t/demo/DEMO1"><Icon name="tg" size={18} /><span>Telefonda ochish</span></a>
            <a className="btn btn--ghost btn--md" href="#/kitchen" target="_blank" rel="noreferrer"><Icon name="chef" size={18} /><span>Oshxona ekrani</span></a>
            <a className="btn btn--ghost btn--md" href="#/admin?demo"><Icon name="grid" size={18} /><span>Admin panel</span></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Bento() {
  return (
    <section className="wrap bento-s">
      <Reveal><span className="eyebrow">Imkoniyatlar</span><h2 className="h2">Restoran egasi uchun hammasi bir joyda</h2></Reveal>
      <div className="bento">
        <Reveal className="bx bx--big">
          <div className="bx__langs">{LANGS.map((l, i) => <span key={l.code} style={{ animationDelay: `${i * 0.4}s` }}>{l.flag}<b>{loc({ uz: "Osh", ru: "Плов", en: "Plov", tr: "Pilav", zh: "抓饭", ko: "플로프" }, l.code)}</b></span>)}</div>
          <h3>6 til, avto-tarjima</h3><p>Taomni o'zbekcha yozing — qolgan 5 tilga bir tugma bilan tarjima qilinadi.</p>
        </Reveal>
        <Reveal className="bx" delay={80}><div className="bx__ic">🔔</div><h3>Ofitsiant / hisob</h3><p>Mehmon bir bosishda chaqiradi — oshxona ekrani va xodim Telegram'i jiringlaydi.</p></Reveal>
        <Reveal className="bx" delay={160}><div className="bx__ic">📊</div><h3>Jonli statistika</h3><p>Tushum, o'rtacha chek, top taomlar va mehmonlar tillari — real vaqtda.</p></Reveal>
        <Reveal className="bx" delay={80}><div className="bx__ic">🖨</div><h3>QR-kartalar</h3><p>Har bir stol uchun brendli QR — chop eting va qo'ying.</p></Reveal>
        <Reveal className="bx" delay={160}><div className="bx__ic">✈️</div><h3>Telegram Mini App</h3><p>Ilova o'rnatish yo'q. Holat xabarlari mehmonning Telegram'iga keladi.</p></Reveal>
        <Reveal className="bx bx--wide" delay={160}>
          <div className="bx__kds"><span className="k1">#21 · Stol 3 🍚🥟</span><span className="k2">#22 · Stol 7 🍢🍵</span><span className="k3">#23 · Stol 1 🍲</span></div>
          <h3>Oshxona ekrani (KDS)</h3><p>Yangi → Tayyorlanmoqda → Tayyor. Har o'zgarish mehmonga Telegram'da xabar bo'lib boradi.</p>
        </Reveal>
      </div>
    </section>
  );
}

function Pricing() {
  const P = [
    { n: "Start", p: "0", d: "Kichik kafe uchun", f: ["5 tagacha stol", "6 tilli menyu", "Telegram buyurtmalar"] },
    { n: "Pro", p: "149 000", d: "Eng ommabop", f: ["Cheksiz stol", "Oshxona ekrani", "Statistika", "Xodimlar bildirishnomasi"], hot: true },
    { n: "Tarmoq", p: "Kelishuv", d: "Bir nechta filial", f: ["Filiallar", "Brend rangi", "Ustuvor yordam"] },
  ];
  return (
    <section className="wrap price-s" id="price">
      <Reveal><span className="eyebrow">Narxlar</span><h2 className="h2">Bitta mehmon xursand bo'lsa — o'zini oqlaydi</h2></Reveal>
      <div className="prices">
        {P.map((x, i) => (
          <Reveal key={x.n} className={`pc ${x.hot ? "pc--hot" : ""}`} delay={i * 90}>
            {x.hot && <span className="pc__tag">⭐ Tavsiya</span>}
            <b className="pc__n">{x.n}</b><small className="muted">{x.d}</small>
            <div className="pc__p">{x.p}{/\d/.test(x.p) && <small> so'm/oy</small>}</div>
            <ul>{x.f.map((f) => <li key={f}><Icon name="check" size={16} stroke={2.6} />{f}</li>)}</ul>
            <a className={`btn ${x.hot ? "btn--gold" : "btn--ghost"} btn--md w100`} href="#/register"><span>Boshlash</span></a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function Landing() {
  const [sc, setSc] = useState(false);
  useEffect(() => { const on = () => setSc(scrollY > 20); addEventListener("scroll", on, { passive: true }); return () => removeEventListener("scroll", on); }, []);
  return (
    <div className="land">
      <nav className={`nav ${sc ? "is-sc" : ""}`}>
        <div className="wrap nav__in">
          <a href="#/"><Logo size={30} /></a>
          <div className="nav__links"><a href="#how" onClick={(e) => { e.preventDefault(); document.getElementById("how").scrollIntoView({ behavior: "smooth" }); }}>Qanday ishlaydi</a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); document.getElementById("demo").scrollIntoView({ behavior: "smooth" }); }}>Demo</a>
            <a href="#price" onClick={(e) => { e.preventDefault(); document.getElementById("price").scrollIntoView({ behavior: "smooth" }); }}>Narxlar</a></div>
          <div className="nav__r"><a className="btn btn--ghost btn--sm" href="#/login"><span>Kirish</span></a><a className="btn btn--gold btn--sm" href="#/register"><span>Ulash</span></a></div>
        </div>
      </nav>
      <Hero />
      <Marquee />
      <Story />
      <LiveDemo />
      <Bento />
      <Pricing />
      <section className="wrap final">
        <Reveal className="final__card">
          <div className="final__plate">🍽</div>
          <h2 className="h2">Mehmoningiz o'z tilida<br /><em>“Rahmat”</em> deydi.</h2>
          <a className="btn btn--gold btn--lg" href="#/register"><span>Bepul boshlash</span><Icon name="arrowRight" size={18} /></a>
        </Reveal>
      </section>
      <footer className="foot wrap"><Logo size={24} /><span className="muted small">© 2026 Mehmon · Toshkent · Samarqand · Buxoro</span></footer>
    </div>
  );
}
