import { createSupa } from "./supa.js";

const cfg = (typeof window !== "undefined" && window.MEHMON_CONFIG) || {};
export const BOT = (cfg.bot || "").replace(/^@/, "");
export const sb = createSupa(cfg.supabaseUrl || "", cfg.supabaseAnonKey || "");

async function post(url, data, auth) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${await sb.getToken()}`;
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(data) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Xatolik (${r.status})`);
  return d;
}

// ---------- MEHMON (ochiq) ----------
export const getMenu = (slug, code) => sb.rpc("mn_get_menu", { p_slug: slug, p_code: code || null }, true);
export const orderStatus = (token) => sb.rpc("mn_order_status", { p_token: token }, true);
export const placeOrder = (o) => post("/api/order", o);
export const callStaff = (slug, code, kind) => post("/api/call", { slug, code, kind });

// ---------- DEMO oshxona ----------
export const demoBoard = () => sb.rpc("mn_demo_board", {}, true);
export const demoCallDone = (id) => sb.rpc("mn_demo_call_done", { p_call: id }, true);

// ---------- EGASI ----------
export const auth = {
  restore: () => sb.restore(),
  signIn: (d) => sb.signIn(d),
  signUp: (d) => sb.signUp(d),
  signOut: () => sb.signOut(),
  email: () => sb.getEmail(),
  uid: () => sb.getUserId(),
};
export async function myRestaurant() {
  const rows = await sb.select("mn_restaurants", { owner_id: sb.getUserId() });
  return rows[0] || null;
}
export const createRestaurant = (row) => sb.insert("mn_restaurants", row);
export const updateRestaurant = (id, patch) => sb.update("mn_restaurants", id, patch);

export const list = (table, rid, order = "sort.asc") => sb.select(table, { restaurant_id: rid }, order);
export const insert = (table, row) => sb.insert(table, row);
export const update = (table, id, patch) => sb.update(table, id, patch);
export const remove = (table, id) => sb.remove(table, id);

export async function ownerBoard(rid) {
  const since = new Date(Date.now() - 864e5).toISOString();
  const [orders, calls] = await Promise.all([
    sb.select("mn_orders", { restaurant_id: rid }, "created_at.desc"),
    sb.select("mn_calls", { restaurant_id: rid, done: false }, "created_at.desc"),
  ]);
  return { orders: orders.filter((o) => o.created_at > since).slice(0, 60), calls };
}
export const setStatus = (order_id, status, demo) => post("/api/status", { order_id, status, demo }, !demo);
export const translate = (text) => post("/api/translate", { text, from: "uz" }, true);
