# Mehmon — turistlar uchun aqlli QR-menyu

Stoldagi QR → sayt → Telegram bot (Mini App) → menyu 6 tilda → buyurtma oshxona ekraniga.

## Sahifalar
- `#/` — landing (animatsiyalar, jonli demo)
- `#/t/:slug/:code` — QR kirish: animatsiya → Telegram
- `#/m/:slug/:code` — mehmon menyusi (savat, 6 til, ofitsiant/hisob)
- `#/o/:token` — buyurtma holati (jonli)
- `#/app` — Telegram Mini App bosh sahifasi (QR skaner)
- `#/kitchen` — oshxona ekrani (KDS)
- `#/admin` — egasi paneli (`#/admin?demo` — demo)

## O'rnatish
1. Supabase SQL Editor: `supabase/schema.sql`, keyin `supabase/seed_demo.sql`.
2. `public/config.js` — bot username.
3. Vercel env: `TELEGRAM_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploydan keyin `/api/setup` ni oching (webhook + menyu tugmasi).
