import { useEffect, useRef, useState } from "react";

export const TG = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
export const inTG = () => !!(TG && TG.initData);

export function money(n, suffix = true) {
  const s = Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return s + (suffix ? " so'm" : "");
}
export const ago = (d) => {
  const s = Math.max(0, (Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${Math.floor(s)} s`;
  if (s < 3600) return `${Math.floor(s / 60)} daq`;
  return `${Math.floor(s / 3600)} soat`;
};
export const clock = (d) => {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
};

export function useRoute() {
  const get = () => (location.hash.replace(/^#/, "") || "/").split("?")[0];
  const [path, setPath] = useState(get);
  useEffect(() => {
    const on = () => setPath(get());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return path;
}
export const go = (p) => { location.hash = p; };

export function useInView(opts = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setSeen(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, opts);
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

export function useScrollProgress(ref) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setP(Math.max(0, Math.min(1, -r.top / ((r.height - innerHeight) || 1))));
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return p;
}

export function usePoll(fn, ms, deps = []) {
  const [data, setData] = useState(undefined);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true, timer;
    const tick = async () => {
      try { const d = await fn(); if (alive) { setData(d); setErr(null); } } catch (e) { if (alive) setErr(e); }
      if (alive) timer = setTimeout(tick, document.hidden ? ms * 3 : ms);
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, deps);
  return [data, setData, err];
}

export const seg = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
export const ease = (t) => 1 - Math.pow(1 - t, 3);

// Kichik "ding" ovozi (WebAudio)
let actx;
export function ding(times = 2) {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine"; o.frequency.value = i % 2 ? 1320 : 880;
      const t0 = actx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + 0.45);
    }
  } catch {}
}
export const haptic = (k = "light") => { try { TG?.HapticFeedback?.impactOccurred(k); } catch {} };
