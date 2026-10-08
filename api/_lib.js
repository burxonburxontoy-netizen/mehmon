// Mehmon — server yordamchilari (Vercel Functions)
// Kerakli Environment Variables:
//   TELEGRAM_BOT_TOKEN, SUPABASE_SERVICE_ROLE_KEY
// Ixtiyoriy: SUPABASE_URL, SUPABASE_ANON_KEY, WEBHOOK_SECRET, SITE_URL
import { createHash, createHmac } from "node:crypto";

const DEFAULTS = {
  SUPABASE_URL: "https://ocwifqafrwawmrjaxqxj.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jd2lmcWFmcndhd21yamF4cXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMTI5MDMsImV4cCI6MjEwNjc4ODkwM30.tM_f5QPWuOPsXmvXUHQLi8YlaCLek8vivri1VkIcR_U",
};
export const env = (k) => {
  const v = (process.env[k] || "").trim().replace(/^["']|["']$/g, "") || DEFAULTS[k];
  if (!v) throw new Error(`Environment variable yo'q: ${k}`);
  return v;
};
export const hasBot = () => !!process.env.TELEGRAM_BOT_TOKEN;

export const webhookSecret = () =>
  process.env.WEBHOOK_SECRET ||
  createHash("sha256").update("mehmon:" + env("TELEGRAM_BOT_TOKEN")).digest("hex").slice(0, 48);

export function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  return `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
}

export const money = (n) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
export const esc = (s = "") => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
export const tr = (obj, lang = "uz") => (obj && (obj[lang] || obj.uz || obj.en || Object.values(obj)[0])) || "";

export async function tg(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) throw new Error(`Telegram: ${data.description || r.status}`);
  return data.result;
}
export const tgSafe = (m, p) => (hasBot() ? tg(m, p).catch((e) => console.error(e.message)) : Promise.resolve());

/** Supabase REST. as: "service" | "anon" | {token} */
export async function sb(path, { method = "GET", body, as = "service", prefer } = {}) {
  const key = as === "service" ? env("SUPABASE_SERVICE_ROLE_KEY") : env("SUPABASE_ANON_KEY");
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (typeof as === "object") headers.Authorization = `Bearer ${as.token}`;
  else if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${env("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error((data && data.message) || `Supabase ${r.status}`);
  return data;
}

/** Telegram Mini App initData imzosini tekshirish (soxta foydalanuvchidan himoya) */
export function verifyInitData(initData) {
  if (!initData || !hasBot()) return null;
  try {
    const p = new URLSearchParams(initData);
    const hash = p.get("hash");
    p.delete("hash");
    const dcs = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
    const secret = createHmac("sha256", "WebAppData").update(env("TELEGRAM_BOT_TOKEN")).digest();
    const check = createHmac("sha256", secret).update(dcs).digest("hex");
    if (check !== hash) return null;
    if (Date.now() / 1000 - Number(p.get("auth_date") || 0) > 86400) return null;
    return JSON.parse(p.get("user") || "null");
  } catch { return null; }
}

export function body(req) {
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body || {};
}

// Mehmonga yuboriladigan xabarlar (6 til)
export const T = {
  received: { uz: "✅ Buyurtma #{n} qabul qilindi!", ru: "✅ Заказ #{n} принят!", en: "✅ Order #{n} received!", tr: "✅ #{n} numaralı sipariş alındı!", zh: "✅ 订单 #{n} 已收到！", ko: "✅ 주문 #{n} 접수되었습니다!" },
  cooking: { uz: "👨‍🍳 Buyurtma #{n} tayyorlanmoqda", ru: "👨‍🍳 Заказ #{n} готовится", en: "👨‍🍳 Order #{n} is being prepared", tr: "👨‍🍳 #{n} numaralı sipariş hazırlanıyor", zh: "👨‍🍳 订单 #{n} 正在准备", ko: "👨‍🍳 주문 #{n} 조리 중입니다" },
  ready: { uz: "🔔 Buyurtma #{n} tayyor! Hozir olib kelamiz", ru: "🔔 Заказ #{n} готов! Сейчас принесём", en: "🔔 Order #{n} is ready! Coming to your table", tr: "🔔 #{n} numaralı sipariş hazır! Hemen getiriyoruz", zh: "🔔 订单 #{n} 已备好！马上送到", ko: "🔔 주문 #{n} 준비 완료! 곧 가져다 드립니다" },
  served: { uz: "🍽 Yoqimli ishtaha!", ru: "🍽 Приятного аппетита!", en: "🍽 Enjoy your meal!", tr: "🍽 Afiyet olsun!", zh: "🍽 祝您用餐愉快！", ko: "🍽 맛있게 드세요!" },
  track: { uz: "Holatni kuzatish", ru: "Отслеживать", en: "Track order", tr: "Siparişi takip et", zh: "跟踪订单", ko: "주문 추적" },
  open: { uz: "🍽 Menyuni ochish", ru: "🍽 Открыть меню", en: "🍽 Open menu", tr: "🍽 Menüyü aç", zh: "🍽 打开菜单", ko: "🍽 메뉴 열기" },
};
export const t = (key, lang, n) => (T[key][lang] || T[key].uz).replace("{n}", n ?? "");

/** Kalit turini aniqlash (maxfiy qiymatni oshkor qilmasdan) */
export function keyInfo() {
  const k = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!k) return "yo'q";
  if (k.startsWith("sb_secret_")) return "yangi secret kalit (sb_secret_)";
  if (k.startsWith("sb_publishable_")) return "XATO: publishable kalit qo'yilgan";
  try {
    const role = JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString()).role;
    return role === "service_role" ? "service_role ✅" : `XATO: ${role} kalit qo'yilgan`;
  } catch { return `noma'lum format (${k.length} belgi)`; }
}
