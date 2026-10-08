// Telegram webhook: /api/bot
import { tg, sb, esc, siteUrl, webhookSecret, t } from "./_lib.js";

const langOf = (code = "") => {
  const c = code.slice(0, 2);
  return ["uz", "ru", "en", "tr", "zh", "ko"].includes(c) ? c : "uz";
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("Mehmon bot ishlayapti ✅");
  if (req.headers["x-telegram-bot-api-secret-token"] !== webhookSecret()) return res.status(401).end();
  const msg = req.body?.message;
  try {
    if (msg?.text) {
      const chatId = msg.chat.id;
      const lang = langOf(msg.from?.language_code);
      const site = siteUrl(req);
      const [cmd, param = ""] = msg.text.trim().split(/\s+/);

      if (cmd === "/start" && param.startsWith("staff_")) {
        const name = await sb("rpc/mn_link_staff", { method: "POST", body: { p_code: param.slice(6), p_chat: chatId } });
        await tg("sendMessage", {
          chat_id: chatId, parse_mode: "HTML",
          text: name ? `✅ Bu chat <b>${esc(name)}</b> xodimlari uchun ulandi.\nYangi buyurtmalar va chaqiruvlar shu yerga keladi.` : "❌ Kod noto'g'ri yoki eskirgan.",
          reply_markup: name ? { inline_keyboard: [[{ text: "👨‍🍳 Oshxona ekrani", url: `${site}/#/kitchen` }]] } : undefined,
        });
      } else if (cmd === "/start" && param.includes("__")) {
        const [slug, code] = param.split("__");
        await tg("sendMessage", {
          chat_id: chatId, text: "👋",
          reply_markup: { inline_keyboard: [[{ text: t("open", lang), web_app: { url: `${site}/#/m/${slug}/${code}` } }]] },
        });
      } else {
        await tg("sendMessage", {
          chat_id: chatId, parse_mode: "HTML",
          text: `Assalomu alaykum! 👋\n\n<b>Mehmon</b> — aqlli QR-menyu.\n\n📷 Stol ustidagi QR kodni skanerlang yoki pastdagi tugmani bosing — menyu sizning tilingizda ochiladi, buyurtma to'g'ridan-to'g'ri oshxonaga ketadi.`,
          reply_markup: { inline_keyboard: [
            [{ text: "📷 QR skanerlash", web_app: { url: `${site}/#/app` } }],
            [{ text: "🍽 Demo menyu", web_app: { url: `${site}/#/m/demo/DEMO1` } }],
          ] },
        });
      }
    }
  } catch (e) { console.error(e); }
  res.status(200).json({ ok: true });
}
