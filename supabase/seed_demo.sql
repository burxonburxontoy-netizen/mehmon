-- =====================================================================
--  MEHMON — demo restoran (bir marta ishga tushiring)
--  Egasi: birinchi ro'yxatdan o'tgan foydalanuvchi emas, balki quyidagi email
-- =====================================================================
do $$
declare
  rid uuid; c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  owner uuid := (select id from auth.users where email = 'burxonburxontoy@gmail.com');
begin
  delete from public.mn_restaurants where slug = 'demo';
  insert into public.mn_restaurants (owner_id, slug, name, tagline, address, phone, accent, is_demo)
  values (owner, 'demo', 'Ipak Yo''li Kafe', 'Milliy taomlar · 1999 yildan beri (demo)',
          'Toshkent, Amir Temur shoh ko''chasi (demo)', '+998 71 000 00 00', '#F5B829', true)
  returning id into rid;

  insert into public.mn_categories (restaurant_id, name, emoji, sort) values
   (rid, '{"uz":"Asosiy taomlar","ru":"Основные блюда","en":"Main dishes","tr":"Ana yemekler","zh":"主菜","ko":"메인 요리"}', '🍛', 1) returning id into c1;
  insert into public.mn_categories (restaurant_id, name, emoji, sort) values
   (rid, '{"uz":"Kaboblar","ru":"Шашлыки","en":"Kebabs","tr":"Kebaplar","zh":"烤串","ko":"꼬치구이"}', '🍢', 2) returning id into c2;
  insert into public.mn_categories (restaurant_id, name, emoji, sort) values
   (rid, '{"uz":"Salatlar","ru":"Салаты","en":"Salads","tr":"Salatalar","zh":"沙拉","ko":"샐러드"}', '🥗', 3) returning id into c3;
  insert into public.mn_categories (restaurant_id, name, emoji, sort) values
   (rid, '{"uz":"Non va shirinliklar","ru":"Хлеб и сладости","en":"Bread & sweets","tr":"Ekmek ve tatlılar","zh":"馕与甜点","ko":"빵과 디저트"}', '🫓', 4) returning id into c4;
  insert into public.mn_categories (restaurant_id, name, emoji, sort) values
   (rid, '{"uz":"Ichimliklar","ru":"Напитки","en":"Drinks","tr":"İçecekler","zh":"饮品","ko":"음료"}', '🍵', 5) returning id into c5;

  insert into public.mn_dishes (restaurant_id, category_id, name, description, price, emoji, prep_min, is_popular, is_spicy, is_veg, sort) values
  (rid, c1, '{"uz":"Toshkent oshi","ru":"Ташкентский плов","en":"Tashkent plov","tr":"Taşkent pilavı","zh":"塔什干抓饭","ko":"타슈켄트 플롭"}',
   '{"uz":"Guruch, mol go''shti, sariq sabzi, no''xat va bedana tuxumi","ru":"Рис, говядина, жёлтая морковь, нут и перепелиное яйцо","en":"Rice, beef, yellow carrots, chickpeas and quail egg","tr":"Pirinç, dana eti, sarı havuç, nohut ve bıldırcın yumurtası","zh":"米饭、牛肉、黄胡萝卜、鹰嘴豆和鹌鹑蛋","ko":"쌀, 소고기, 노란 당근, 병아리콩, 메추리알"}',
   48000, '🍚', 10, true, false, false, 1),
  (rid, c1, '{"uz":"Manti","ru":"Манты","en":"Manti dumplings","tr":"Mantı","zh":"蒸包子","ko":"만티 만두"}',
   '{"uz":"Bug''da pishirilgan qo''y go''shti va piyozli chuchvara, 5 dona","ru":"Паровые манты с бараниной и луком, 5 шт","en":"Steamed dumplings with lamb and onion, 5 pcs","tr":"Kuzu eti ve soğanlı buharda mantı, 5 adet","zh":"羊肉洋葱蒸包，5个","ko":"양고기와 양파 찐만두 5개"}',
   38000, '🥟', 20, true, false, false, 2),
  (rid, c1, '{"uz":"Lag''mon","ru":"Лагман","en":"Lagman noodles","tr":"Lağman","zh":"拉条子","ko":"라그만 국수"}',
   '{"uz":"Qo''lda cho''zilgan lag''mon, go''sht va sabzavotlar","ru":"Тянутая лапша с мясом и овощами","en":"Hand-pulled noodles with beef and vegetables","tr":"Elde çekilmiş erişte, et ve sebzeler","zh":"手工拉面配牛肉和蔬菜","ko":"고기와 채소를 곁들인 수타면"}',
   42000, '🍜', 15, false, true, false, 3),
  (rid, c1, '{"uz":"Shurva","ru":"Шурпа","en":"Shurpa soup","tr":"Şurpa çorbası","zh":"羊肉汤","ko":"슈르파 수프"}',
   '{"uz":"Qo''y go''shti, kartoshka va sabzavotli quyuq sho''rva","ru":"Наваристый суп с бараниной и овощами","en":"Rich lamb soup with potatoes and vegetables","tr":"Kuzu etli, patatesli yoğun çorba","zh":"浓郁羊肉土豆蔬菜汤","ko":"양고기와 감자, 채소를 넣은 진한 수프"}',
   35000, '🍲', 10, false, false, false, 4),
  (rid, c1, '{"uz":"Dimlama","ru":"Димлама","en":"Dimlama stew","tr":"Dimlama yahnisi","zh":"焖菜炖肉","ko":"딤라마 스튜"}',
   '{"uz":"O''z sharbatida dimlangan go''sht va sabzavotlar","ru":"Мясо и овощи, томлённые в собственном соку","en":"Meat and vegetables slow-cooked in their own juices","tr":"Kendi suyunda pişmiş et ve sebzeler","zh":"肉与蔬菜原汁慢炖","ko":"고기와 채소를 자체 즙으로 천천히 익힌 요리"}',
   45000, '🥘', 25, false, false, false, 5),

  (rid, c2, '{"uz":"Qo''y go''shti kabobi","ru":"Шашлык из баранины","en":"Lamb shashlik","tr":"Kuzu şiş","zh":"羊肉串","ko":"양고기 샤슬릭"}',
   '{"uz":"Ko''mirda pishirilgan, piyoz va sumax bilan, 1 six","ru":"На углях, с луком и сумахом, 1 шампур","en":"Charcoal-grilled with onion and sumac, 1 skewer","tr":"Kömürde, soğan ve sumakla, 1 şiş","zh":"炭烤，配洋葱和漆树粉，1串","ko":"숯불구이, 양파와 수막 곁들임, 1꼬치"}',
   22000, '🍢', 15, true, false, false, 1),
  (rid, c2, '{"uz":"Jigar kabob","ru":"Шашлык из печени","en":"Liver kebab","tr":"Ciğer şiş","zh":"烤肝串","ko":"간 꼬치"}',
   '{"uz":"Dumba bilan o''ralgan jigar, 1 six","ru":"Печень с курдючным жиром, 1 шампур","en":"Liver wrapped in lamb fat, 1 skewer","tr":"Kuyruk yağıyla sarılmış ciğer, 1 şiş","zh":"羊尾油包肝，1串","ko":"양 꼬리 지방으로 감싼 간, 1꼬치"}',
   18000, '🔥', 15, false, false, false, 2),
  (rid, c2, '{"uz":"Lula kabob","ru":"Люля-кебаб","en":"Lula kebab","tr":"Adana kebap","zh":"肉末烤串","ko":"룰라 케밥"}',
   '{"uz":"Qiyma go''shtdan, ziravorlar bilan, 1 six","ru":"Из рубленого мяса со специями, 1 шампур","en":"Minced meat with spices, 1 skewer","tr":"Baharatlı kıyma, 1 şiş","zh":"香料肉末，1串","ko":"향신료 다진 고기, 1꼬치"}',
   20000, '🌶', 15, false, true, false, 3),

  (rid, c3, '{"uz":"Achchiq-chuchuk","ru":"Аччик-чучук","en":"Achichuk salad","tr":"Açık-çuçuk salatası","zh":"番茄洋葱沙拉","ko":"아치추크 샐러드"}',
   '{"uz":"Pomidor, piyoz, achchiq qalampir va rayhon","ru":"Помидоры, лук, острый перец и базилик","en":"Tomato, onion, chili and basil","tr":"Domates, soğan, acı biber ve fesleğen","zh":"番茄、洋葱、辣椒和罗勒","ko":"토마토, 양파, 고추, 바질"}',
   15000, '🍅', 5, false, true, true, 1),
  (rid, c3, '{"uz":"Toshkent salati","ru":"Салат Ташкент","en":"Tashkent salad","tr":"Taşkent salatası","zh":"塔什干沙拉","ko":"타슈켄트 샐러드"}',
   '{"uz":"Turp, mol go''shti, tuxum va qovurilgan piyoz","ru":"Редька, говядина, яйцо и жареный лук","en":"Radish, beef, egg and fried onion","tr":"Turp, dana eti, yumurta ve kızarmış soğan","zh":"萝卜、牛肉、鸡蛋和炸洋葱","ko":"무, 소고기, 달걀, 튀긴 양파"}',
   28000, '🥗', 7, true, false, false, 2),

  (rid, c4, '{"uz":"Patir non","ru":"Лепёшка патир","en":"Patir bread","tr":"Patır ekmeği","zh":"油馕","ko":"파티르 빵"}',
   '{"uz":"Tandirda yopilgan qatlamli non","ru":"Слоёная лепёшка из тандыра","en":"Flaky tandoor flatbread","tr":"Tandırda pişmiş katmerli ekmek","zh":"馕坑烤制的千层馕","ko":"탄두르에서 구운 겹겹이 빵"}',
   8000, '🫓', 3, false, false, true, 1),
  (rid, c4, '{"uz":"Somsa","ru":"Самса","en":"Samsa pastry","tr":"Samsa","zh":"烤包子","ko":"삼사"}',
   '{"uz":"Tandirda pishgan go''shtli somsa","ru":"Самса с мясом из тандыра","en":"Tandoor-baked meat pastry","tr":"Tandırda etli samsa","zh":"馕坑烤肉包","ko":"탄두르에서 구운 고기 페이스트리"}',
   12000, '🥐', 5, true, false, false, 2),
  (rid, c4, '{"uz":"Chak-chak","ru":"Чак-чак","en":"Chak-chak","tr":"Çak-çak tatlısı","zh":"蜂蜜脆","ko":"착착"}',
   '{"uz":"Asal va yong''oqli an''anaviy shirinlik","ru":"Традиционная сладость с мёдом и орехами","en":"Traditional honey and nut sweet","tr":"Bal ve cevizli geleneksel tatlı","zh":"蜂蜜坚果传统甜点","ko":"꿀과 견과류의 전통 과자"}',
   16000, '🍯', 3, false, false, true, 3),

  (rid, c5, '{"uz":"Ko''k choy","ru":"Зелёный чай","en":"Green tea","tr":"Yeşil çay","zh":"绿茶","ko":"녹차"}',
   '{"uz":"Choynakda, limon bilan","ru":"Чайник, с лимоном","en":"A pot, with lemon","tr":"Demlikte, limonlu","zh":"一壶，配柠檬","ko":"주전자, 레몬 곁들임"}',
   7000, '🍵', 3, true, false, true, 1),
  (rid, c5, '{"uz":"Kompot","ru":"Компот","en":"Fruit compote","tr":"Komposto","zh":"果汁饮","ko":"과일 콤포트"}',
   '{"uz":"Uy kompoti, 1 litr","ru":"Домашний компот, 1 литр","en":"Homemade fruit drink, 1 litre","tr":"Ev yapımı komposto, 1 litre","zh":"自制果汁饮，1升","ko":"수제 과일 음료, 1리터"}',
   18000, '🍹', 2, false, false, true, 2),
  (rid, c5, '{"uz":"Ayron","ru":"Айран","en":"Ayran","tr":"Ayran","zh":"酸奶饮","ko":"아이란"}',
   '{"uz":"Sovuq qatiq ichimligi","ru":"Холодный кисломолочный напиток","en":"Chilled yogurt drink","tr":"Soğuk yoğurt içeceği","zh":"冰镇酸奶饮品","ko":"차가운 요거트 음료"}',
   9000, '🥛', 2, false, false, true, 3);

  insert into public.mn_tables (restaurant_id, label, code, seats)
  select rid, 'Stol ' || g, 'DEMO' || g, 4 from generate_series(1, 8) g;
end $$;
