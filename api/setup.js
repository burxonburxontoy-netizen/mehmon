// Bir martalik sozlash: /api/setup — webhook, buyruqlar, menyu tugmasi
import { tg, siteUrl, webhookSecret } from "./_lib.js";

export default async function handler(req, res) {
  try {
    const site = siteUrl(req);
    await tg("setWebhook", { url: `${site}/api/bot`, secret_token: webhookSecret(), allowed_updates: ["message"], drop_pending_updates: true });
    await tg("setMyCommands", { commands: [{ command: "start", description: "Boshlash" }] });
    await tg("setMyDescription", { description: "Mehmon — aqlli QR-menyu. Stol ustidagi QR kodni skanerlang: menyu sizning tilingizda, buyurtma to'g'ridan-to'g'ri oshxonaga." });
    await tg("setMyShortDescription", { short_description: "Aqlli QR-menyu 🍽 6 tilda" });
    await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "Menyu", web_app: { url: `${site}/#/app` } } });
    const me = await tg("getMe", {});
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<body style="font-family:system-ui;padding:40px;background:#120E0B;color:#F7EFE3"><h1>✅ Bot sozlandi</h1><p>@${me.username}</p><p>Webhook: ${site}/api/bot</p></body>`);
  } catch (e) {
    res.status(500).send("Xato: " + e.message);
  }
}
