import { useState } from "react";
import { Button, Logo, QR, useToast } from "../components/ui.jsx";
import * as api from "../lib/api.js";
import { go } from "../lib/util.js";

export default function Auth({ mode }) {
  const toast = useToast();
  const reg = mode === "register";
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (reg) {
        const r = await api.auth.signUp(f);
        if (r.needsConfirm) { toast("Pochtangizga tasdiqlash xati yuborildi ✉️"); setBusy(false); return go("/login"); }
      } else await api.auth.signIn(f);
      go("/admin");
    } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }

  return (
    <div className="auth">
      <div className="auth__art">
        <div className="auth__qr"><QR value="https://mehmon.app" size={180} /><span className="auth__laser" /></div>
        <h2>Menyuingiz — 6 tilda,<br />buyurtmalar — Telegram'da.</h2>
        <p>Restoraningizni 3 daqiqada ulang.</p>
      </div>
      <form className="auth__card" onSubmit={submit}>
        <a href="#/" className="auth__logo"><Logo size={32} /></a>
        <h1>{reg ? "Restoranni ulash" : "Kirish"}</h1>
        <p className="muted">{reg ? "Bepul. Karta talab qilinmaydi." : "Egasi paneliga xush kelibsiz"}</p>
        {reg && <label className="field"><span>Ismingiz</span><input className="input" required value={f.name} onChange={set("name")} placeholder="Aziz" /></label>}
        <label className="field"><span>Email</span><input className="input" type="email" required value={f.email} onChange={set("email")} placeholder="siz@restoran.uz" /></label>
        <label className="field"><span>Parol</span><input className="input" type="password" required minLength={6} value={f.password} onChange={set("password")} placeholder="••••••" /></label>
        <Button size="lg" className="w100" loading={busy}>{reg ? "Ro'yxatdan o'tish" : "Kirish"}</Button>
        <p className="muted small center-text">
          {reg ? <>Akkauntingiz bormi? <a href="#/login">Kirish</a></> : <>Yangi restoranmi? <a href="#/register">Ro'yxatdan o'tish</a></>}
        </p>
        <a className="auth__demo" href="#/admin?demo">👀 Demo panelni ko'rish</a>
      </form>
    </div>
  );
}
