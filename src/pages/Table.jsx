import { useEffect, useState } from "react";
import { Icon, Logo } from "../components/ui.jsx";
import { BOT } from "../lib/api.js";
import { go, inTG } from "../lib/util.js";

/** QR skanerlanganda ochiladigan sahifa: chiroyli animatsiya → Telegram bot (Mini App) */
export default function TableEntry({ slug, code }) {
  const param = `${slug}__${code}`.replace(/[^A-Za-z0-9_-]/g, "");
  const web = `https://t.me/${BOT}?startapp=${param}`;
  const deep = `tg://resolve?domain=${BOT}&startapp=${param}`;
  const [phase, setPhase] = useState(0); // 0 scan, 1 fly, 2 fallback

  useEffect(() => {
    if (inTG() || !BOT) { go(`/m/${slug}/${code}`); return; }
    const t1 = setTimeout(() => setPhase(1), 1100);
    const t2 = setTimeout(() => { location.href = deep; }, 1900);
    const t3 = setTimeout(() => setPhase(2), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`entry entry--p${phase}`}>
      <div className="entry__bg" />
      <div className="entry__card">
        <Logo size={34} />
        <div className="entry__stage">
          <div className="entry__plate"><span>🍽</span></div>
          <div className="entry__plane"><Icon name="tg" size={34} stroke={1.8} /></div>
          <div className="entry__ring" />
        </div>
        <h1>{phase < 2 ? "Telegram ochilmoqda…" : "Davom etish usulini tanlang"}</h1>
        <p>Stol <b>{code}</b> · menyu sizning tilingizda ochiladi</p>
        <div className="entry__btns">
          <a className="btn btn--tg btn--lg" href={web}><Icon name="tg" size={18} /><span>Telegram'da ochish</span></a>
          <a className="btn btn--ghost btn--lg" href={`#/m/${slug}/${code}`}><Icon name="globe" size={18} /><span>Brauzerda ko'rish</span></a>
        </div>
      </div>
    </div>
  );
}
