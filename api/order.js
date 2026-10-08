// POST /api/order — mehmon buyurtmasi
// { slug, code, items:[{dish_id,qty}], note, lang, guest_name, initData }
import { sb, tgSafe, verifyInitData, body, money, esc, tr, t, siteUrl } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const b = body(req);
  try {
    const user = verifyInitData(b.initData);
    const lang = ["uz", "ru", "en", "tr", "zh", "ko"].includes(b.lang) ? b.lang : "uz";
    const o = await sb("rpc/mn_place_order", {
      method: "POST",
      body: {
        p_slug: String(b.slug || ""), p_code: String(b.code || ""), p_items: Array.isArray(b.items) ? b.items.slice(0, 40) : [],
        p_note: b.note ? String(b.note) : null, p_lang: lang,
        p_guest_name: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : (b.guest_name || null),
        p_chat_id: user ? user.id : null,
      },
    });
    const site = siteUrl(req);
    const statusUrl = `${site}/#/o/${o.token}`;

    // Xodimlarga (oshxona / ofitsiant guruhi)
    if (o.staff_chat_id) {
      const lines = o.items.map((i) => `${i.emoji} ${esc(tr(i.name, "uz"))} × ${i.qty}`).join("\n");
      tgSafe("sendMessage", {
        chat_id: o.staff_chat_id, parse_mode: "HTML",
        text: `🆕 <b>Yangi buyurtma #${o.number}</b> · ${esc(o.table_label)}\n\n${lines}\n\n💰 <b>${money(o.total)}</b>` +
          (b.note ? `\n📝 ${esc(b.note)}` : "") + (user ? `\n👤 ${esc(user.first_name || "")}` : ""),
        reply_markup: { inline_keyboard: [[{ text: "👨‍🍳 Oshxona ekrani", url: `${site}/#/kitchen` }]] },
      });
    }
    // Mehmonning o'ziga (Telegram ichidan buyurtma bergan bo'lsa)
    if (user) {
      tgSafe("sendMessage", {
        chat_id: user.id, parse_mode: "HTML",
        text: `${t("received", lang, o.number)}\n${esc(o.restaurant)} · ${esc(o.table_label)} · <b>${money(o.total)}</b>`,
        reply_markup: { inline_keyboard: [[{ text: "📍 " + t("track", lang), web_app: { url: statusUrl } }]] },
      });
    }
    res.status(200).json({ ok: true, token: o.token, number: o.number, total: o.total });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
