from django.db import migrations

ROWS = [{'position': 1,
  'published': True,
  'question_uz': 'Chiptani qanday sotib olaman?',
  'answer_uz': 'Yuqoridagi shaklni to‘ldiring va «Qidirish» tugmasini bosing. Agentlarimiz siz bilan '
               'bog‘lanib, eng yaxshi variantlarni taklif qilishadi.',
  'question_ru': 'Как купить билет?',
  'answer_ru': 'Заполните форму выше и нажмите «Поиск». Наши агенты свяжутся с вами и предложат лучшие '
               'варианты.',
  'question_en': 'How do I purchase a ticket?',
  'answer_en': 'Fill in the form above and click "Search Flights". Our agents will contact you and '
               'offer the best available options.'},
 {'position': 2,
  'published': True,
  'question_uz': 'Chiptani bekor qilsam bo‘ladimi?',
  'answer_uz': 'Ha, chiptalar aviakompaniya qoidalariga muvofiq bekor qilinadi yoki o‘zgartiriladi. '
               'Tafsilotlar uchun biz bilan bog‘laning.',
  'question_ru': 'Можно ли отменить билет?',
  'answer_ru': 'Да, билеты можно отменить или изменить по правилам авиакомпании. Свяжитесь с нами для '
               'уточнения.',
  'question_en': 'Can I cancel my ticket?',
  'answer_en': 'Yes, tickets can be cancelled or changed according to airline rules. Please contact us '
               'for more details.'},
 {'position': 3,
  'published': True,
  'question_uz': 'Qo‘shimcha bagaj uchun to‘lov bormi?',
  'answer_uz': 'Bagaj me’yorlari chipta toifasi va aviakompaniyaga bog‘liq. Agentlarimiz batafsil '
               'ma’lumot berishadi.',
  'question_ru': 'Нужно ли платить за дополнительный багаж?',
  'answer_ru': 'Нормы багажа зависят от класса билета и авиакомпании. Наши агенты предоставят подробную '
               'информацию.',
  'question_en': 'Is there a fee for extra baggage?',
  'answer_en': 'Baggage allowances vary by ticket class and airline. Our agents will provide you with '
               'detailed information.'},
 {'position': 4,
  'published': True,
  'question_uz': 'Reysni qancha oldin band qilish kerak?',
  'answer_uz': 'Eng yaxshi narxlar uchun xalqaro reyslarni 2–3 oy, ichki reyslarni 3–4 hafta oldin band '
               'qilishni tavsiya etamiz. Shoshilinch band qilishda ham yordam beramiz.',
  'question_ru': 'За сколько времени лучше бронировать рейс?',
  'answer_ru': 'Для лучших цен рекомендуем бронировать международные рейсы за 2–3 месяца, внутренние — '
               'за 3–4 недели. Мы также поможем со срочным бронированием.',
  'question_en': 'How far in advance should I book my flight?',
  'answer_en': 'For the best prices, we recommend booking 2-3 months in advance for international '
               'flights and 3-4 weeks for domestic flights. However, we can also assist with '
               'last-minute bookings.'},
 {'position': 5,
  'published': True,
  'question_uz': 'O‘rindiqni oldindan tanlasam bo‘ladimi?',
  'answer_uz': 'Ha, aksariyat aviakompaniyalarda o‘rindiq tanlash mumkin. Premium va biznes toifalarda '
               'bu ko‘pincha bepul, ekonom toifada esa qo‘shimcha to‘lov bo‘lishi mumkin.',
  'question_ru': 'Можно ли заранее выбрать место?',
  'answer_ru': 'Да, большинство авиакомпаний предлагают выбор места. В премиум- и бизнес-классе он '
               'часто бесплатный, а в экономклассе может взиматься дополнительная плата.',
  'question_en': 'Can I select my seat in advance?',
  'answer_en': 'Yes, seat selection is available for most airlines. Premium and Business Class tickets '
               'often include free seat selection, while Economy may have additional fees depending on '
               'the airline.'},
 {'position': 6,
  'published': True,
  'question_uz': 'Yashirin to‘lovlar bormi?',
  'answer_uz': 'Yashirin to‘lovlar yo‘q! Narxlar barcha soliq va yig‘imlarni o‘z ichiga oladi. Bagaj '
               'yoki o‘rindiq tanlash kabi qo‘shimcha xarajatlar haqida band qilishni tasdiqlashdan '
               'oldin xabar beramiz.',
  'question_ru': 'Есть ли скрытые комиссии?',
  'answer_ru': 'Скрытых комиссий нет! Наши цены включают все налоги и сборы. О дополнительных расходах, '
               'например за багаж или выбор места, сообщаем до подтверждения бронирования.',
  'question_en': 'Are there any hidden fees when booking?',
  'answer_en': 'No hidden fees! We provide transparent pricing that includes all taxes and fees. Any '
               'additional costs (such as baggage fees or seat selection) will be clearly communicated '
               'before you confirm your booking.'},
 {'position': 7,
  'published': True,
  'question_en': 'What documents do I need for international flights?',
  'answer_en': 'Requirements depend on your nationality, route and destination. Check passport '
               'validity, visa and transit rules with the relevant authorities before travel. Our '
               'agents can help you review the requirements.',
  'question_uz': 'Xalqaro parvozlar uchun qanday hujjatlar kerak?',
  'answer_uz': 'Talablar fuqaroligingiz, yo‘nalish va boradigan mamlakatingizga bog‘liq. Safardan oldin '
               'pasport muddati, viza va tranzit qoidalarini tegishli idoralardan tekshiring. '
               'Agentlarimiz talablarni ko‘rib chiqishda yordam beradi.',
  'question_ru': 'Какие документы нужны для международного перелёта?',
  'answer_ru': 'Требования зависят от гражданства, маршрута и страны назначения. Перед поездкой '
               'проверьте срок действия паспорта, визовые и транзитные правила у соответствующих '
               'органов. Наши агенты помогут разобраться в требованиях.'},
 {'position': 8,
  'published': True,
  'question_en': 'How do I receive my tickets?',
  'answer_en': 'After your agent confirms the booking, payment and ticket issuance, your e-ticket will '
               'be sent to your email. A checkout link is an offer and does not by itself reserve seats '
               'or issue tickets.',
  'question_uz': 'Chiptamni qanday olaman?',
  'answer_uz': 'Agentingiz buyurtma, to‘lov va chipta rasmiylashtirilganini tasdiqlagach, elektron '
               'chipta emailingizga yuboriladi. Buyurtma havolasi taklif hisoblanadi va o‘z-o‘zidan '
               'joyni band qilmaydi yoki chipta rasmiylashtirmaydi.',
  'question_ru': 'Как я получу билеты?',
  'answer_ru': 'После подтверждения агентом бронирования, оплаты и оформления билетов электронный билет '
               'придёт на вашу почту. Ссылка на заказ является предложением и сама по себе не бронирует '
               'места и не оформляет билеты.'},
 {'position': 9,
  'published': True,
  'question_en': 'How is payment arranged?',
  'answer_en': 'Your agent will confirm the available payment arrangements and the final total before '
               'you pay. Online payment is available only when an active payment provider is connected.',
  'question_uz': 'To‘lov qanday amalga oshiriladi?',
  'answer_uz': 'To‘lashdan oldin agentingiz mavjud to‘lov tartibi va yakuniy summani tasdiqlaydi. '
               'Onlayn to‘lov faqat faol to‘lov provayderi ulanganda mavjud bo‘ladi.',
  'question_ru': 'Как организована оплата?',
  'answer_ru': 'До оплаты агент подтвердит доступный порядок оплаты и итоговую сумму. Онлайн-оплата '
               'доступна только при подключённом платёжном провайдере.'}]

def seed(apps, schema_editor):
    FAQ = apps.get_model('travel', 'FAQ')
    for row in ROWS:
        FAQ.objects.using(schema_editor.connection.alias).get_or_create(question_en=row['question_en'], defaults={k:v for k,v in row.items() if k!='question_en'})

class Migration(migrations.Migration):
    dependencies = [('travel', '0003_faq_testimonial')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
