// POST /api/status — oshxona buyurtma holatini o'zgartiradi
// { order_id, status, demo } + (demo bo'lmasa) Authorization: Bearer <egasi tokeni>
import { sb, tgSafe, body, t, siteUrl } from "./_lib.js";

const OK = ["new", "cooking", "ready", "served", "cancelled"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const b = body(req);
  if (!OK.includes(b.status)) return res.status(400).json({ error: "Noto'g'ri holat" });
  try {
    let o;
    if (b.demo) {
      o = await sb("rpc/mn_demo_set_status", { method: "POST", body: { p_order: b.order_id, p_status: b.status } });
    } else {
      const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).json({ error: "Kirish kerak" });
      const rows = await sb(`mn_orders?id=eq.${encodeURIComponent(b.order_id)}`, {
        method: "PATCH", as: { token }, prefer: "return=representation",
        body: { status: b.status, updated_at: new Date().toISOString() },
      });
      o = rows[0];
      if (!o) return res.status(404).json({ error: "Buyurtma topilmadi" });
    }
    if (o.guest_chat_id && ["cooking", "ready", "served"].includes(o.status)) {
      tgSafe("sendMessage", {
        chat_id: o.guest_chat_id,
        text: t(o.status, o.lang, o.number),
        reply_markup: o.status === "served" ? undefined
          : { inline_keyboard: [[{ text: "📍 " + t("track", o.lang), web_app: { url: `${siteUrl(req)}/#/o/${o.public_token}` } }]] },
      });
    }
    res.status(200).json({ ok: true, status: o.status });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
