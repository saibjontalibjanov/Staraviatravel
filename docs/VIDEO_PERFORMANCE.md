# Video va frontend yuklanishini tezlashtirish

Ushbu branch avvalgi `fix/namecheap-production-audit` branchidagi tekshirilgan tuzatishlar ustida tayyorlangan. Jonli hostingga hech qanday o‘zgartirish kiritilmadi.

## Topilgan sabablar

Repozitordagi `Cover800x312_darken_3mb.mp4` nomi hajmni noto‘g‘ri anglatgan: haqiqiy fayl **94,365,228 bayt**, 1920×1080, 60 fps, davomiyligi 168.81 soniya. Dekorativ fon ovozsiz ishlatilgan bo‘lsa ham, originalda audio trek mavjud edi. MP4 boshlanishi uchun zarur `moov` metama’lumoti faylning oxirida, 94,280,783-baytdan boshlangan. Bu sekin tarmoqlarda qo‘shimcha yuklanish/Range so‘rovlariga olib keladi.

Jonli www.staraviatravel.com fayliga HEAD so‘rovi ushbu muhitning tarmoq/proksi cheklovida to‘xtadi. Quyidagi raqamlar repozitordagi haqiqiy fayllarning o‘lchamidir; jonli saytda o‘lchangan LCP yoki tezlik ballari emas.

## Yangi fayllar

| Fayl | Hajm | Originalga nisbatan | Format |
|---|---:|---:|---|
| Original master | 94,365,228 bayt | — | 1080p, 60 fps, audio bilan |
| `hero-desktop-v1.mp4` | 12,243,093 bayt | **87.0% kichikroq** | 720p, 24 fps, ovozsiz |
| `hero-mobile-v1.mp4` | 3,960,624 bayt | **95.8% kichikroq** | 360p, 24 fps, ovozsiz |
| `hero-poster-v1.webp` | 27,538 bayt | — | Videoning o‘zidan olingan tezkor fon kadri |

Videoning to‘liq davomiyligi va sahnalar ketma-ketligi saqlangan. Ikkala yangi MP4 H.264/yuv420p va `+faststart` bilan kodlangan: metama’lumot boshida, video to‘liq yuklanmasdan ijro boshlanishi mumkin. HTTP Range qo‘llab-quvvatlashi brauzer sinovida 206 javobi bilan tekshirildi.

Original saqlash uchun `source-media/` ga ko‘chirildi; endi `public/` yoki `dist/` tarkibiga tushmaydi. Uni `public_html` ga yuklamang. Docker kontekstidan ham chiqarilgan.

## Saytdagi o‘zgarishlar

- Bosh sahifa va About sahifasi bir xil `BackgroundVideo` komponentidan foydalanadi.
- Poster tez yuklanadi; video brauzerning dastlabki renderidan keyin bo‘sh vaqtida ishga tushadi. Matn, navbar va qidiruv video tugashini kutmaydi.
- Telefonlarda kichik video tanlanadi. Past ko‘rsatilgan downlink tezligida ham kichik nusxa ishlatiladi.
- Data Saver, 2G yoki reduced-motion holatida video o‘rniga poster qoladi; ortiqcha MP4 so‘rovi yuborilmaydi.
- Video ko‘rinmay qolganda yoki tab fonda bo‘lsa, ijro pauza qilinadi. Avtomatik ijro bloklansa yoki video xatosi bo‘lsa, poster qoladi.
- Pastdagi kartochka va karusel rasmlari lazy-load/async decode ishlatadi.
- Ishlatilmayotgan tashqi flag-icons CSS so‘rovi olib tashlandi; amaldagi navbar dizayni o‘zgarmadi.
- Apache uchun matn siqish, media cache va Vite hashli JS/CSS uchun uzoq cache qoidalari qo‘shildi. HTML qayta tekshiriladi. MP4/JPEG/WebP qaytadan gzip qilinmaydi.

## Tekshiruv

- `npm test`: **24 ta test o‘tdi**, shu jumladan MP4 hajmi, `moov` ning `mdat` dan oldinligi, audio yo‘qligi va original master deployga tushmasligi.
- `npm run build`: muvaffaqiyatli; original 94 MB fayl `dist` da yo‘q.
- Brauzer: desktop 1280×720 va mobile 640×360 haqiqiy ijro, HTTP 206 Range, ko‘rinishdan tashqarida pauza/qayta ijro, reduced-motion va Data Saver uchun nol MP4 so‘rovi.
- Video so‘rovi ataylab to‘xtatib turilganda ham poster, sarlavha, til tanlash va qidiruv inputi ishlashi tekshirildi.
- Backend kodi va ma’lumotlar bazasiga o‘zgartirish kiritilmagan. Sinovdagi public API javoblari mahalliy fixture bilan berildi.

Bu natijalar jonli Namecheap serverida tekshirilmagan. Aniq sayt tezligi hosting/tarmoq/cache holatiga ham bog‘liq.

## Namecheap’ga joylash

Faqat egasi tasdiqlagan frontend deploy jarayonidan foydalaning; bu branch o‘z-o‘zidan saytni yangilamaydi.

1. Amaldagi `public_html` va `.htaccess` ni xususiy joyga zaxiralang.
2. Build mashinada root `.env.production` ichidagi ommaviy qiymatni tekshiring: `VITE_API_URL=https://api.staraviatravel.com`. Mavjud maxfiy backend `.env` ni o‘zgartirmang.
3. `npm ci`, `npm test`, `npm run build` ni bajaring. Tayyor media Git ichida bor; build yoki hosting uchun FFmpeg talab qilinmaydi.
4. `dist/` **ichidagi** fayllarni `/home/starrbrg/public_html` ga yuklang; `dist` papkasining o‘zini emas. `media/` papkasidagi uchta yangi fayl ham yuklanishi shart.
5. `dist/.htaccess` dagi yangi cache/siqish qoidalarini mavjud cPanel/SSL qoidalarini saqlagan holda birlashtiring. To‘liq `.htaccess` ni ko‘r-ko‘rona almashtirmang.
6. Oldingi hashli JS/CSS va eski video nusxasini darhol o‘chirmang: eski ochiq sahifalar hali ularga murojaat qilishi mumkin. Yangi sahifa ishlashi tasdiqlangach va eski cache muddati tugagach, alohida tasdiqlangan tozalashni bajaring.
7. Hosting/CDN HTML cache mavjud bo‘lsa, faqat tegishli sayt cache’ini yangilang va brauzerda hard refresh qiling.
8. DevTools Network’da yangi `hero-desktop-v1.mp4` yoki `hero-mobile-v1.mp4`, poster va Range/206 javoblarini tekshiring. `/about-us` da ham tekshiring. Faqat `source-media/` saqlov nusxasi productionga yuborilmaydi.

Backend, Passenger yoki migratsiyalarni ushbu frontend tezlashtirish uchun o‘zgartirish shart emas. Avvalgi audit bo‘yicha alohida backend deployment rejalashtirilgan bo‘lsa, uning runbook va tasdiqlash qoidalari saqlanadi.
