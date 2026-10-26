import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { apiUrl } from '../lib/api'

export default function Testimonials({ allowSubmission = false }) {
  const { t, language } = useLanguage()
  const [reviews, setReviews] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [pending, setPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    setLoadStatus('loading')
    fetch(apiUrl('/api/testimonials'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json() })
      .then(result => { setReviews(result.data); setLoadStatus('ready') })
      .catch(error => { if (error.name !== 'AbortError') setLoadStatus('error') })
    return () => controller.abort()
  }, [attempt])
  async function submit(event) {
    event.preventDefault()
    if (locked.current) return
    locked.current = true; setPending(true); setError('')
    const form = event.currentTarget
    const fields = Object.fromEntries(new FormData(form))
    try {
      const response = await fetch(apiUrl('/api/testimonials'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { ...fields, rating: Number(fields.rating), language } }) })
      if (!response.ok) throw new Error(response.status === 429 ? 'Too many requests. Please try again later.' : 'Could not send your review. Please try again.')
      setSubmitted(true); form.reset()
    } catch (cause) { setError(cause.message) }
    finally { locked.current = false; setPending(false) }
  }
  return (
    <section id="fikrlar" className="w-full bg-paper px-6 py-20 md:px-12 lg:px-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center mb-12"><span className="text-gold font-semibold tracking-wider uppercase text-sm">{t('Our Clients')}</span><h2 className="font-display text-4xl md:text-5xl font-bold text-ink mt-2">{t('What Our Clients')} <span className="italic text-gold">{t('Say')}</span></h2></div>
        {allowSubmission && <div className="mx-auto max-w-[740px] mb-14 rounded-3xl bg-white p-7 md:p-10 border border-gold/20 shadow-sm"><h3 className="font-display text-2xl text-ink">{t('Share your journey')}</h3><p className="mt-3 text-sm text-ink/60">{t('Tell us about your experience. No photo needed.')}</p>
          {submitted ? <div role="status" className="mt-6 rounded-xl bg-green-50 border border-green-100 p-5 text-green-900">{t('Thank you! Your review will appear after our team approves it.')}</div> : <form className="mt-7 space-y-5" onSubmit={submit}><div className="grid sm:grid-cols-2 gap-5"><label className="text-sm text-ink/70">{t('Your name')}<input name="name" required maxLength={100} autoComplete="name" className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-ink focus:border-gold" /></label><label className="text-sm text-ink/70">{t('Your rating')}<select name="rating" aria-label={t('Your rating')} defaultValue="5" className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-ink focus:border-gold">{[5,4,3,2,1].map(rating => <option value={rating} key={rating}>{'★'.repeat(rating)} · {rating}/5</option>)}</select></label></div><label className="block text-sm text-ink/70">{t('Your review')}<textarea name="text" required minLength={3} maxLength={2000} rows={5} className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-ink focus:border-gold" /></label><p className="text-xs text-ink/50">{t('Your name and review may be published after approval. Please do not include passport or payment details.')}</p><button type="submit" disabled={pending} className="rounded-xl bg-gold px-7 py-3 font-semibold text-white hover:bg-gold-dark disabled:opacity-50">{t(pending ? 'Sending…' : 'Send review')}</button>{error && <p role="alert" className="text-sm text-red-700">{t(error)}</p>}</form>}
        </div>}
        {loadStatus === 'loading' && <p role="status" className="text-center text-ink/60">{t('Loading reviews…')}</p>}
        {loadStatus === 'error' && <div role="status" className="text-center text-ink/60"><p>{t('Reviews could not be loaded.')}</p><button onClick={() => setAttempt(value => value + 1)} className="mt-3 text-gold underline">{t('Try again')}</button></div>}
        {loadStatus === 'ready' && !reviews.length && <p className="text-center text-ink/60">{t('Your journey could be our next story.')}</p>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{reviews.map(review => <article key={review.id} className="rounded-3xl bg-white p-7 border border-black/5 shadow-sm"><p className="text-gold tracking-wider" aria-label={`${review.rating}/5`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p><blockquote lang={review.language} className="my-5 text-ink/70 whitespace-pre-line break-words leading-relaxed">“{review.text}”</blockquote><div className="flex gap-3 items-center"><span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full bg-gold/10 text-gold grid place-items-center font-semibold">{review.name.slice(0,1)}</span><h3 className="min-w-0 break-words font-semibold text-ink">{review.name}</h3></div></article>)}</div>
      </div>
    </section>
  )
}
