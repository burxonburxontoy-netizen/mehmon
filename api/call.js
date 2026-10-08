// POST /api/call — ofitsiantni yoki hisobni chaqirish { slug, code, kind: "waiter" | "bill" }
import { sb, tgSafe, body, esc } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const b = body(req);
  if (!["waiter", "bill"].includes(b.kind)) return res.status(400).json({ error: "kind" });
  try {
    const r = await sb("rpc/mn_call", { method: "POST", body: { p_slug: b.slug, p_code: b.code || "", p_kind: b.kind } });
    if (r.staff_chat_id) {
      tgSafe("sendMessage", {
        chat_id: r.staff_chat_id, parse_mode: "HTML",
        text: b.kind === "bill" ? `🧾 <b>${esc(r.table_label)}</b> hisobni so'ramoqda` : `🙋 <b>${esc(r.table_label)}</b> ofitsiantni chaqirmoqda`,
      });
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
