import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFetchClient } from '@strapi/strapi/admin'
import '../leads.css'
import './telegram.css'

const errorText = cause => cause.response?.status === 403 ? 'Your admin role does not have permission for this Telegram action.' : cause.response?.data?.error?.message || 'Telegram could not be loaded. Please retry.'
const statusText = status => ({ received: 'Received', pending: 'Queued', sending: 'Sending', sent: 'Sent', failed: 'Failed', unknown: 'Delivery unconfirmed' })[status] || status

export default function TelegramPage() {
  const { get, post, put } = useFetchClient()
  const [params] = useSearchParams()
  const [searchInput, setSearchInput] = useState(params.get('clientId') || '')
  const [search, setSearch] = useState(params.get('clientId') || '')
  const [page, setPage] = useState(1)
  const [chats, setChats] = useState({ chats: [], pageCount: 1, total: 0 })
  const [status, setStatus] = useState(null)
  const [selected, setSelected] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [older, setOlder] = useState([])
  const [hasOlder, setHasOlder] = useState(false)
  const [text, setText] = useState('')
  const [clientId, setClientId] = useState('')
  const [error, setError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [retrying, setRetrying] = useState(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const draftRequestId = useRef(null)
  const sendLock = useRef(false)
  const end = useRef(null)
  const pagingStarted = useRef(false)

  const loadChats = useCallback(async signal => {
    try {
      const response = await get(`/admin/telegram/chats?${new URLSearchParams({ page: String(page), q: search })}`, { signal })
      if (!signal?.aborted) { setChats(response.data); setError('') }
    } catch (cause) { if (!signal?.aborted) setError(errorText(cause)) }
  }, [get, page, search])

  const loadStatus = useCallback(async signal => {
    try { const response = await get('/admin/telegram/status', { signal }); if (!signal?.aborted) setStatus(response.data) }
    catch (cause) { if (!signal?.aborted) setError(errorText(cause)) }
  }, [get])

  useEffect(() => {
    const controller = new AbortController()
    loadChats(controller.signal); loadStatus(controller.signal)
    const timer = setInterval(() => { if (!document.hidden) { loadChats(controller.signal); loadStatus(controller.signal) } }, 5000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [loadChats, loadStatus])

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    setConversation(null); setOlder([]); setHasOlder(false); setText(''); setMessageError(''); setLoadError(''); draftRequestId.current = null; pagingStarted.current = false
    const load = async () => {
      try {
        const response = await get(`/admin/telegram/chats/${encodeURIComponent(selected)}/messages`, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setConversation(current => current?.chat.chatId === response.data.chat.chatId ? {
            ...response.data,
            messages: [...new Map([...current.messages, ...response.data.messages].map(message => [message.id, message])).values()].sort((a, b) => a.id - b.id).slice(-500),
          } : response.data)
          if (!pagingStarted.current) setHasOlder(response.data.hasMore)
          setLoadError('')
        }
      } catch (cause) { if (!controller.signal.aborted) setLoadError(errorText(cause)) }
    }
    load()
    const timer = setInterval(() => { if (!document.hidden) load() }, 3000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [get, selected])

  useEffect(() => {
    if (conversation?.chat.chatId) setClientId(conversation.chat.clientId || '')
  }, [conversation?.chat.chatId, conversation?.chat.clientId])

  const lastId = conversation?.messages.at(-1)?.id
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [lastId, selected])

  const send = async event => {
    event.preventDefault()
    if (sendLock.current || !selected || !text.trim()) return
    sendLock.current = true; setSending(true); setMessageError('')
    draftRequestId.current ||= crypto.randomUUID()
    try {
      const response = await post(`/admin/telegram/chats/${encodeURIComponent(selected)}/messages`, { text: text.trim(), requestId: draftRequestId.current })
      setConversation(current => current ? { ...current, messages: [...current.messages.filter(message => message.id !== response.data.message.id), response.data.message] } : current)
      setText(''); draftRequestId.current = null; loadChats()
    } catch (cause) { setMessageError(errorText(cause)) }
    finally { sendLock.current = false; setSending(false) }
  }

  const connect = async () => {
    setBusy(true); setNotice(''); setError('')
    try { await post('/admin/telegram/connect', {}); setNotice('Webhook registered. Send a message to your bot in Telegram to verify incoming delivery.'); await loadStatus() }
    catch (cause) { setError(errorText(cause)) } finally { setBusy(false) }
  }

  const checkWebhook = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await get('/admin/telegram/webhook')
      setNotice(`${response.data.configuredForThisServer ? 'Webhook points to this server.' : 'Webhook is not connected to this server.'} Pending updates: ${response.data.pendingUpdates}.${response.data.lastError ? ' Telegram reports a delivery error; check the public HTTPS endpoint.' : ''}`)
    } catch (cause) { setError(errorText(cause)) } finally { setBusy(false) }
  }

  const linkLead = async event => {
    event.preventDefault(); setBusy(true); setMessageError('')
    try { await put(`/admin/telegram/chats/${encodeURIComponent(selected)}/lead`, { clientId: clientId.trim() || null }); setConversation(current => ({ ...current, chat: { ...current.chat, clientId: clientId.trim() || null } })); loadChats() }
    catch (cause) { setMessageError(errorText(cause)) } finally { setBusy(false) }
  }

  const loadOlder = async () => {
    const oldest = older[0] || conversation?.messages[0]
    if (!oldest) return
    setLoadingOlder(true); pagingStarted.current = true
    try {
      const response = await get(`/admin/telegram/chats/${encodeURIComponent(selected)}/messages?before=${oldest.id}`)
      setOlder(current => [...response.data.messages, ...current]); setHasOlder(response.data.hasMore)
    } catch (cause) { setMessageError(errorText(cause)) } finally { setLoadingOlder(false) }
  }

  const retry = async message => {
    const uncertain = message.deliveryStatus === 'unknown'
    if (uncertain && !window.confirm('This message may already be in Telegram. Check the chat first. Send it again?')) return
    setRetrying(message.id); setMessageError('')
    try {
      await post(`/admin/telegram/messages/${message.id}/retry`, { confirmUncertain: uncertain })
      setConversation(current => ({ ...current, messages: current.messages.map(item => item.id === message.id ? { ...item, deliveryStatus: 'pending', lastError: null } : item) }))
    } catch (cause) { setMessageError(errorText(cause)) } finally { setRetrying(null) }
  }

  const messages = [...new Map([...older, ...(conversation?.messages || [])].map(message => [message.id, message])).values()].sort((a, b) => a.id - b.id)

  return <main className="leads-admin telegram-admin">
    <h1>Telegram</h1>
    <p>Shared bot inbox and website lead notifications. Clients must message the bot first; personal Telegram account history is not imported.</p>
    <section className="leads-card telegram-configuration" aria-label="Telegram connection">
      <h2>Connection</h2>
      {!status ? <p>Loading configuration…</p> : <>
        <ul><li>Bot token: {status.botConfigured ? 'configured' : 'missing TELEGRAM_BOT_TOKEN'}</li><li>Lead notifications: {status.notificationsConfigured ? 'enabled for the configured chat' : 'requires bot token and TELEGRAM_LEADS_CHAT_ID'}</li><li>Webhook secret: {status.webhookSecretConfigured ? 'configured' : 'missing or invalid TELEGRAM_WEBHOOK_SECRET'}</li><li>Public HTTPS URL: {status.publicUrlConfigured ? 'configured' : 'missing PUBLIC_STRAPI_URL'}</li></ul>
        {status.webhookUrl && <p className="telegram-endpoint">Webhook: {status.webhookUrl}</p>}
        {status.failedDeliveries > 0 && <p role="status">{status.failedDeliveries} outgoing message(s) failed or have unconfirmed delivery. Open their conversation to review.</p>}
        {status.canConfigure && <div className="telegram-connect"><p>Connecting sets this bot’s webhook to this Strapi server.</p><button className="leads-button" disabled={busy || !status.botConfigured || !status.webhookSecretConfigured || !status.publicUrlConfigured} onClick={connect}>Connect webhook</button><button className="leads-button" disabled={busy || !status.botConfigured} onClick={checkWebhook}>Check webhook</button></div>}
      </>}
      {notice && <p role="status" className="telegram-notice">{notice}</p>}
    </section>
    {error && <p role="alert" className="telegram-error">{error}</p>}
    <div className="telegram-layout">
      <section className="leads-card telegram-sidebar" aria-label="Telegram conversations">
        <h2>Conversations</h2>
        <form className="telegram-search" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()) }}><input aria-label="Search conversations" placeholder="Name, username or client ID" value={searchInput} onChange={event => setSearchInput(event.target.value)} /><button className="leads-button" type="submit">Search</button></form>
        {!chats.chats.length && <p>No conversations found. Connect the webhook and send a message to your bot.</p>}
        <div className="telegram-chat-list">{chats.chats.map(chat => <button key={chat.chatId} className={`telegram-chat ${selected === chat.chatId ? 'is-selected' : ''}`} disabled={sending || busy || loadingOlder || retrying !== null} onClick={() => setSelected(chat.chatId)} aria-pressed={selected === chat.chatId}>
          <strong>{chat.unread && <span aria-label="Unread" className="telegram-unread" />}{chat.displayName}</strong><span>{chat.username ? `@${chat.username}` : chat.chatId}{chat.clientId ? ` · Client ${chat.clientId}` : ''}</span><span className="telegram-preview">{chat.preview || 'No messages'}</span>
        </button>)}</div>
        <nav className="leads-pagination" aria-label="Conversation pages"><button className="leads-button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>{page} / {chats.pageCount}</span><button className="leads-button" disabled={page >= chats.pageCount} onClick={() => setPage(value => value + 1)}>Next</button></nav>
      </section>
      <section className="leads-card telegram-conversation" aria-label="Selected conversation">
        {!selected ? <p>Select a conversation to read and reply.</p> : !conversation ? <p>Loading messages…</p> : <>
          <h2>{conversation.chat.displayName}</h2><p>{conversation.chat.chatType} · {conversation.chat.chatId}</p>
          {conversation.chat.clientId && <Link to={`/client=${conversation.chat.clientId}`}>Open client #{conversation.chat.clientId}</Link>}
          {status?.canLinkLead && <form onSubmit={linkLead} className="telegram-link"><label>Verified client ID<input value={clientId} onChange={event => setClientId(event.target.value)} maxLength={6} pattern="[1-9][0-9]{5}" placeholder="123456" /></label><button className="leads-button" disabled={busy}>Save lead link</button><p>Verify the client’s identity before linking a conversation. Clear the ID to unlink.</p></form>}
          <div className="telegram-messages" role="log" aria-label="Telegram messages" aria-live="polite">
            {hasOlder && <button className="leads-button" disabled={loadingOlder} onClick={loadOlder}>Load older messages</button>}
            {messages.map(message => <article key={message.id} className={`telegram-message ${message.direction}`}>
              <header><strong>{message.senderName || (message.direction === 'outgoing' ? 'Agent' : 'Client')}</strong><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></header>
              <p>{message.text}</p><small>{statusText(message.deliveryStatus)}</small>
              {message.lastError && <p className="telegram-error">{message.lastError}</p>}
              {message.clientId && <Link to={`/client=${message.clientId}`}>Open lead #{message.clientId}</Link>}
              {status?.canReply && ['failed', 'unknown'].includes(message.deliveryStatus) && <button className="leads-button" disabled={retrying !== null} onClick={() => retry(message)}>Retry delivery</button>}
            </article>)}<div ref={end} />
          </div>
          <form onSubmit={send} className="telegram-reply"><label htmlFor="telegram-reply">Reply via bot</label><textarea id="telegram-reply" value={text} maxLength={4096} disabled={sending || !status?.canReply || !status?.botConfigured} onChange={event => { setText(event.target.value); draftRequestId.current = null }} placeholder="Write a message…" /><button className="leads-button" type="submit" disabled={sending || !text.trim() || !status?.canReply || !status?.botConfigured}>{sending ? 'Queueing…' : 'Send message'}</button>{!status?.canReply && <p>Your role has read-only access.</p>}</form>
          <p className="telegram-footnote">Text replies are supported. Attachments are shown as a description/caption; files are not downloaded. “Queued” means saved for delivery, not yet sent.</p>
        </>}
        {(messageError || loadError) && <p role="alert" className="telegram-error">{messageError || loadError}</p>}
      </section>
    </div>
  </main>
}
