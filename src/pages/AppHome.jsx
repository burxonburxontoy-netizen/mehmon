import { useEffect, useState } from "react";
import { Icon, Button, Logo, useToast } from "../components/ui.jsx";
import * as api from "../lib/api.js";
import { tt, detectLang } from "../lib/i18n.js";
import { go, TG, inTG, haptic, clock } from "../lib/util.js";

/** QR dan "slug/CODE" ni ajratib olish (to'liq URL, start_param yoki qisqa ko'rinish) */
export function parseTarget(s) {
  if (!s) return null;
  s = String(s).trim();
  let m = s.match(/#\/[tm]\/([a-z0-9-]{3,24})\/([A-Za-z0-9]+)/i);
  if (m) return { slug: m[1].toLowerCase(), code: m[2].toUpperCase() };
  m = s.match(/startapp=([a-z0-9-]{3,24})__([A-Za-z0-9]+)/i) || s.match(/^([a-z0-9-]{3,24})__([A-Za-z0-9]+)$/i);
  if (m) return { slug: m[1].toLowerCase(), code: m[2].toUpperCase() };
  return null;
}

const T = {
  hi: ["Stolingizdagi QR kodni skanerlang", "Отсканируйте QR-код на столе", "Scan the QR code on your table", "Masanızdaki QR kodu tarayın", "扫描餐桌上的二维码", "테이블의 QR 코드를 스캔하세요"],
  scan: ["QR skanerlash", "Сканировать QR", "Scan QR", "QR tara", "扫一扫", "QR 스캔"],
  demo: ["Demo menyuni ko'rish", "Открыть демо-меню", "Try the demo menu", "Demo menüyü dene", "查看演示菜单", "데모 메뉴 보기"],
  mine: ["Buyurtmalarim", "Мои заказы", "My orders", "Siparişlerim", "我的订单", "내 주문"],
  bad: ["Bu Mehmon QR kodi emas", "Это не QR-код Mehmon", "Not a Mehmon QR code", "Mehmon QR kodu değil", "不是 Mehmon 二维码", "Mehmon QR 코드가 아닙니다"],
};
const IDX = { uz: 0, ru: 1, en: 2, tr: 3, zh: 4, ko: 5 };

export default function AppHome() {
  const toast = useToast();
  const [lang] = useState(detectLang);
  const t = (k) => T[k][IDX[lang] ?? 0];
  const [mine, setMine] = useState([]);

  useEffect(() => {
    if (inTG()) { TG.ready(); TG.expand(); try { TG.setHeaderColor("#110D0A"); TG.setBackgroundColor("#110D0A"); } catch {} }
    let tokens = [];
    try { tokens = JSON.parse(localStorage.getItem("mehmon.orders") || "[]"); } catch {}
    Promise.all(tokens.slice(0, 5).map((tk) => api.orderStatus(tk).then((o) => o && { ...o, token: tk }).catch(() => null)))
      .then((x) => setMine(x.filter(Boolean)));
  }, []);

  function scan() {
    haptic("medium");
    if (TG?.showScanQrPopup && inTG()) {
      try {
        TG.showScanQrPopup({ text: t("hi") }, (text) => {
          const x = parseTarget(text);
          if (!x) { toast(t("bad"), "err"); return false; }
          TG.closeScanQrPopup();
          go(`/m/${x.slug}/${x.code}`);
          return true;
        });
        return;
      } catch {}
    }
    go("/m/demo/DEMO1");
  }

  return (
    <div className="ah">
      <div className="ah__glow" />
      <header className="ah__head"><Logo size={30} /></header>
      <div className="ah__scan" onClick={scan}>
        <div className="ah__frame">
          <i /><i /><i /><i />
          <span className="ah__laser" />
          <Icon name="qr" size={78} stroke={1.4} />
        </div>
      </div>
      <h1 className="ah__title">{t("hi")}</h1>
      <div className="ah__btns">
        <Button size="lg" icon="qr" className="w100" onClick={scan}>{t("scan")}</Button>
        <Button size="lg" variant="ghost" className="w100" onClick={() => go("/m/demo/DEMO1")}>🍽 {t("demo")}</Button>
      </div>
      {mine.length > 0 && (
        <section className="ah__mine">
          <h3>{t("mine")}</h3>
          {mine.map((o) => (
            <button key={o.token} className="ah__ord" onClick={() => go(`/o/${o.token}`)}>
              <span className={`kstat kstat--${o.status}`} />
              <b>#{o.number} · {o.restaurant}</b>
              <small>{tt(`st_${o.status}`, lang)} · {clock(o.created_at)}</small>
              <Icon name="arrowRight" size={16} />
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
