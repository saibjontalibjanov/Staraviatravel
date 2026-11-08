# Tashriflar, hamkorlar, shriftlar va Economy

Ushbu o‘zgarishlar `feature/traffic-partners-sfpro` branchida. Hosting va ishlab turgan production bazasiga avtomatik o‘zgartirish kiritilmagan.

## CRM: Website visitors

Dashboard va **Website visitors** bo‘limida:

- **Active now**: oxirgi 5 daqiqada ko‘ringan brauzerlar. Ko‘rinib turgan sahifa har daqiqada signal yuboradi; statistikani ko‘rishda Refresh bosing.
- **Visitors today**: Toshkent vaqti bo‘yicha bugungi alohida brauzerlar.
- **Total visitors**: hisob yoqilgandan beri rozilik bergan alohida brauzerlar.
- **Total page views**: sahifa ochilishlari; kunlik va sahifalar kesimidagi oxirgi 30 kunlik jadval ham bor.

Bir brauzerdagi qayta ochilish yangi tashrifchi hisoblanmaydi. Bir inson bir nechta qurilma/brauzer ishlatsa, alohida hisoblanadi; bu aniq insonlar yoki barcha tashriflarni aniqlovchi tizim emas. Oldingi tashriflar qayta tiklanmaydi, sun’iy tarixiy raqamlar qo‘shilmaydi.

Mavjud Cookie banner’dagi **Accept All** tanlangandan keyin hisob boshlanadi. Rad etish, Do Not Track va Global Privacy Control hurmat qilinadi. Backend tanilgan botlarni ham chetlab o‘tadi. Cookie banner endi bosh sahifa bilan birga boshqa ochiq marketing sahifalarida ham mavjud. Checkout va CRM kuzatilmaydi. IP manzil, to‘liq URL, qidiruv parametrlari, pasport yoki boshqa shaxsiy ma’lumotlar visitor jadvaliga saqlanmaydi. Backend faqat tasodifiy brauzer UUID’sining server HMAC xeshini, vaqt va cheklangan sahifa yo‘lini saqlaydi. Amaldagi rate limiter alohida xeshlangan kalitlardan foydalanadi.

`POST /api/visits` JSON hodisalarini qabul qiladi. Takrorlangan event UUID bitta page view bo‘lib qoladi. Heartbeat page-view sonini oshirmaydi. Metrika so‘rovi muvaffaqiyatsiz bo‘lsa, sayt va buyurtma formasi ishlashda davom etadi. Statistikalar faqat tegishli staff huquqi bilan ko‘rinadi; ommaviy visitor-list API yo‘q.

## CRM: Partner logos

**Partner logos → Add record**:

1. Kompaniya nomini kiriting.
2. **Logo** yuklang: PNG/JPEG/WebP, eng ko‘pi 2 MB. Shaffof fonli PNG tavsiya qilinadi. SVG qabul qilinmaydi.
3. Istasangiz HTTPS veb-saytini yozing; parol yoki login kiritilgan URL qabul qilinmaydi.
4. **Position** orqali tartiblang; kichik raqam oldin chiqadi.
5. **Published** ni belgilang va saqlang. Belgini olib tashlasangiz, logotip saytdan yashiriladi.

Managers va superuser qo‘shish/tahrirlash/chop etish huquqiga ega; Agents ko‘ra oladi. `bootstrap_roles` bu huquqlarni yangilaydi; maxsus o‘zgartirilgan guruhlar bo‘lsa avval tekshiring.

Chop etilgan logotiplar bosh sahifada **`#biz-haqimizda`** bo‘limi oldida, About sahifasida **mijozlar fikrlari** oldida chiqadi. Default holat grayscale, hover’da asl rang. Aylanish o‘ngdan chapga uzluksiz; logotip ko‘payganda tezlik o‘qishga qulay saqlanadi. Pause/Resume tugmasi, klaviatura focus pauzasi va reduced-motion qo‘llanadi. Hech qanday logotip kiritilmagan bo‘lsa, bo‘lim yashirin qoladi; soxta hamkorlar kiritilmaydi. `GET /api/partners` faqat published logotiplarni qaytaradi.

Logotip fayllari backend `media/partners/` ichida. Namecheap’da mavjud `/uploads/` mapping shu katalogni ham to‘g‘ri ochishi kerak. Fayllarni va mavjud offer rasmlarini o‘chirmang.

## Shrift

Foydalanuvchi so‘roviga ko‘ra oldingi shriftlar qaytarildi: saytda **Poppins** va **Playfair Display**, CRM’da **DM Sans** va **Manrope**. Google Fonts yuklanmasa, tegishli sans-serif/serif fallback ishlaydi. SF Pro stack endi ishlatilmaydi.

## Economy

Website qidiruv paneli va cabin ko‘rsatilmagan qidiruvlarda **Economy** boshlang‘ich tanlov. CRM yangi/bo‘sh qidiruvi ham Economy’dan boshlanadi. Mijoz yoki agent aniq Business/First tanlagan bo‘lsa, o‘sha tanlov saqlanadi.

## O‘rnatish

Bu o‘zgarish **0005_partner_websitevisitor_websitepageview** migratsiyasini qo‘shadi. U uchta yangi jadval yaratadi; mavjud mijozlar va buyurtmalarni o‘chirmaydi.

Production uchun avval amaldagi bazani tekshirilgan usulda zaxiralang va migratsiya/deploy rejasini egasi tasdiqlasin. Mavjud `.env`, baza va media saqlanadi. Tasdiqlangan yangilashda backend virtual muhitida:

```bash
python manage.py migrate --plan
python manage.py migrate
python manage.py bootstrap_roles
python manage.py collectstatic --noinput
python manage.py check
```

So‘ng backend/Passenger’ni qayta ishga tushiring. Frontend uchun root `.env.production` API originini tekshirib `npm ci && npm run build` qiling va `dist/` ichidagi fayllarni mavjud hosting jarayoni bilan yangilang. Backend maxfiy `.env` ni frontendga yuklamang. Mavjud logotip va rasmlar uchun API domenidagi `/uploads/` mapping ishlashini tekshiring.

Mahalliy tekshiruvlar: **70 Django testi**, **27 frontend testi**, production build. Alohida test bazasida brauzer orqali logo upload/publish/order, sahifadagi joylashuv, o‘ngdan-chapga animatsiya, hover rangi, rozilik va tashriflarni deduplikatsiya qilish, CRM statistika, mobil o‘lchamlar, shrift stack’i va Economy tanlovi tekshirildi. Production’dagi tashriflar o‘lchanmadi; sinovdagi sonlar va logotiplar fixture edi.
