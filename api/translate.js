// POST /api/translate — taom nomini 5 tilga avto-tarjima { text, from: "uz" }
// Bepul MyMemory API ishlatiladi. Kirgan foydalanuvchi uchun.
import { body } from "./_lib.js";

const TARGETS = { ru: "ru-RU", en: "en-GB", tr: "tr-TR", zh: "zh-CN", ko: "ko-KR" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!req.headers.authorization) return res.status(401).json({ error: "Kirish kerak" });
  const { text, from = "uz" } = body(req);
  if (!text || String(text).length > 400) return res.status(400).json({ error: "Matn kerak" });
  const out = { [from]: text };
  await Promise.all(Object.entries(TARGETS).map(async ([k, code]) => {
    if (k === from) return;
    try {
      const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from === "uz" ? "uz-UZ" : from}|${code}`;
      const d = await fetch(u).then((r) => r.json());
      const v = d?.responseData?.translatedText;
      if (v && !/MYMEMORY WARNING|INVALID/i.test(v)) out[k] = v;
    } catch {}
  }));
  res.status(200).json(out);
}
