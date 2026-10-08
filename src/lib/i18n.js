export const LANGS = [
  { code: "uz", flag: "🇺🇿", name: "O'zbekcha" },
  { code: "ru", flag: "🇷🇺", name: "Русский" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "tr", flag: "🇹🇷", name: "Türkçe" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
];

const S = {
  welcome:   ["Xush kelibsiz", "Добро пожаловать", "Welcome", "Hoş geldiniz", "欢迎光临", "환영합니다"],
  table:     ["Stol", "Стол", "Table", "Masa", "餐桌", "테이블"],
  popular:   ["Ommabop", "Популярное", "Popular", "Popüler", "人气", "인기"],
  all:       ["Hammasi", "Все", "All", "Tümü", "全部", "전체"],
  add:       ["Qo'shish", "Добавить", "Add", "Ekle", "添加", "담기"],
  min:       ["daq", "мин", "min", "dk", "分钟", "분"],
  spicy:     ["Achchiq", "Острое", "Spicy", "Acı", "辣", "매운맛"],
  veg:       ["Vegetarian", "Вегетарианское", "Vegetarian", "Vejetaryen", "素食", "채식"],
  cart:      ["Savat", "Корзина", "Your order", "Sepet", "购物车", "장바구니"],
  total:     ["Jami", "Итого", "Total", "Toplam", "合计", "합계"],
  order:     ["Buyurtma berish", "Заказать", "Place order", "Sipariş ver", "下单", "주문하기"],
  note:      ["Izoh (masalan: piyozsiz)", "Комментарий (напр.: без лука)", "Note (e.g. no onion)", "Not (örn. soğansız)", "备注（例如：不要洋葱）", "요청사항 (예: 양파 빼고)"],
  empty:     ["Savat bo'sh", "Корзина пуста", "Your cart is empty", "Sepet boş", "购物车是空的", "장바구니가 비어 있습니다"],
  waiter:    ["Ofitsiant", "Официант", "Waiter", "Garson", "服务员", "직원 호출"],
  bill:      ["Hisob", "Счёт", "Bill", "Hesap", "结账", "계산서"],
  called:    ["Ofitsiant chaqirildi!", "Официант вызван!", "Waiter is on the way!", "Garson geliyor!", "服务员马上到！", "직원이 곧 갑니다!"],
  billAsked: ["Hisob so'raldi!", "Счёт запрошен!", "Bill requested!", "Hesap istendi!", "已请求结账！", "계산서를 요청했습니다!"],
  sent:      ["Buyurtma yuborildi!", "Заказ отправлен!", "Order sent!", "Sipariş gönderildi!", "订单已发送！", "주문이 전송되었습니다!"],
  st_new:    ["Qabul qilindi", "Принят", "Received", "Alındı", "已接收", "접수됨"],
  st_cooking:["Tayyorlanmoqda", "Готовится", "Cooking", "Hazırlanıyor", "制作中", "조리 중"],
  st_ready:  ["Tayyor!", "Готов!", "Ready!", "Hazır!", "已完成！", "준비 완료!"],
  st_served: ["Yoqimli ishtaha!", "Приятного аппетита!", "Enjoy your meal!", "Afiyet olsun!", "用餐愉快！", "맛있게 드세요!"],
  st_cancelled: ["Bekor qilindi", "Отменён", "Cancelled", "İptal edildi", "已取消", "취소됨"],
  orderNo:   ["Buyurtma", "Заказ", "Order", "Sipariş", "订单", "주문"],
  more:      ["Yana buyurtma", "Заказать ещё", "Order more", "Daha sipariş ver", "继续点餐", "추가 주문"],
  search:    ["Taom qidirish…", "Поиск блюд…", "Search dishes…", "Yemek ara…", "搜索菜品…", "메뉴 검색…"],
  notFound:  ["Menyu topilmadi", "Меню не найдено", "Menu not found", "Menü bulunamadı", "未找到菜单", "메뉴를 찾을 수 없습니다"],
  updates:   ["Holat avtomatik yangilanadi", "Статус обновляется автоматически", "Status updates live", "Durum canlı güncellenir", "状态实时更新", "상태가 실시간으로 업데이트됩니다"],
};
const IDX = Object.fromEntries(LANGS.map((l, i) => [l.code, i]));
export const tt = (key, lang) => (S[key] ? S[key][IDX[lang] ?? 0] : key);
export const loc = (obj, lang) => (obj && (obj[lang] || obj.uz || obj.en || Object.values(obj)[0])) || "";

export function detectLang() {
  try {
    const saved = localStorage.getItem("mehmon.lang");
    if (saved && IDX[saved] != null) return saved;
  } catch {}
  const tg = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  const c = (tg || navigator.language || "uz").slice(0, 2);
  return IDX[c] != null ? c : "uz";
}
export function saveLang(l) { try { localStorage.setItem("mehmon.lang", l); } catch {} }
