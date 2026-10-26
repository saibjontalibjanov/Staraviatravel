import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { apiUrl } from '../lib/api'

export default function FAQ() {
  const { t, language } = useLanguage()
  const [faqs, setFaqs] = useState([])
  const [openId, setOpenId] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading'); setOpenId(null)
    fetch(apiUrl(`/api/faqs?language=${language}`), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json() })
      .then(result => { setFaqs(result.data); setStatus('ready') })
      .catch(error => { if (error.name !== 'AbortError') setStatus('error') })
    return () => controller.abort()
  }, [language, attempt])
  return (
    <section id="faq" className="w-full bg-[#f0ebe1] px-6 py-20 md:px-12 lg:px-8">
      <div className="mx-auto max-w-[800px]">
        <div className="text-center mb-12">
          <span className="text-gold font-semibold tracking-wider uppercase text-sm">{t('FAQ')}</span>
          <h2 className="font-display text-4xl font-bold text-ink mt-2">{t('Frequently Asked')} <span className="italic text-gold">{t('Questions')}</span></h2>
        </div>
        {status === 'loading' && <p role="status" className="text-center text-ink/60">{t('Loading questions…')}</p>}
        {status === 'error' && <div role="status" className="text-center"><p>{t('Questions could not be loaded.')}</p><button className="mt-4 text-gold underline" onClick={() => setAttempt(value => value + 1)}>{t('Try again')}</button></div>}
        {status === 'ready' && !faqs.length && <p className="text-center text-ink/60">{t('Have a question? Contact our team.')}</p>}
        <div className="space-y-4">
          {status === 'ready' && faqs.map(faq => (
            <article key={faq.id} className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              <h3><button type="button" id={`faq-question-${faq.id}`} aria-expanded={openId === faq.id} aria-controls={`faq-answer-${faq.id}`} onClick={() => setOpenId(openId === faq.id ? null : faq.id)} className="w-full flex items-center justify-between gap-5 p-6 text-left font-semibold text-ink hover:text-gold transition-colors"><span>{faq.question}</span><span aria-hidden="true" className="text-gold text-xl">{openId === faq.id ? '−' : '+'}</span></button></h3>
              <div id={`faq-answer-${faq.id}`} role="region" aria-labelledby={`faq-question-${faq.id}`} hidden={openId !== faq.id}><p className="px-6 pb-6 text-ink/70 text-sm leading-relaxed whitespace-pre-line">{faq.answer}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
