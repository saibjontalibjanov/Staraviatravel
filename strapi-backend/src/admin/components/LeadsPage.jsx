import TicketSearch from './ticket-search/TicketSearch'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useLeads, { collectionUrl } from './useLeads'
import LeadTable, { clientName } from './LeadTable'
import './leads.css'

function LeadDetail({ clientId }) {
  const { results, loading, error, refresh } = useLeads(`page=1&pageSize=1&filters[clientId][$eq]=${clientId}`)
  const lead = results[0]
  return <main className="leads-admin">
    <Link to="/plugins/leads">← All leads</Link>
    <h1>Client {clientId}</h1>
    {loading ? <p role="status">Loading application…</p> : error ? <p role="alert">{error} <button onClick={refresh}>Retry</button></p> : !lead ? <p>No application found for this client ID.</p> : <>
      <section className="leads-card" aria-label="Client application">
        <h2>{clientName(lead)}</h2>
        <dl className="leads-details">{[
          ['Client ID', lead.clientId], ['Phone', lead.phone], ['Email', lead.email], ['Status', lead.leadStatus],
          ['Application source', lead.source], ['Language', lead.language], ['Received', new Date(lead.createdAt).toLocaleString()],
          ['Website page', lead.pagePath], ['Flight route', lead.flightRoute], ['Airline', lead.airline],
          ['Departure date', lead.departureDate], ['Return date', lead.returnDate], ['Passengers', lead.passengers], ['Cabin', lead.cabin],
          ['Quoted price (USD)', lead.quotedPrice], ['Payment preference', lead.paymentMethod],
          ['Booking terms accepted', lead.termsAccepted ? 'Yes' : 'No'], ['Agent notes', lead.notes],
        ].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
        <Link className="leads-button" to={`${collectionUrl}/${lead.documentId}`}>Edit status and notes in Content Manager</Link>
      </section>
      <TicketSearch lead={lead} key={lead.documentId} />
    </>}
  </main>
}

function LeadsList() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ page: String(page), pageSize: '25', sort: 'createdAt:desc' })
  if (status) params.set('filters[leadStatus][$eq]', status)
  if (search) ['clientId', 'firstName', 'lastName', 'phone', 'email'].forEach((key, index) => params.set(`filters[$or][${index}][${key}][$containsi]`, search))
  const { results, pagination, loading, error, refresh, updatedAt } = useLeads(params.toString())
  return <main className="leads-admin">
    <h1>Leads</h1><p>Client applications from the website. Each client reference is a unique six-digit number.</p>
    <form className="leads-filters" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()) }}>
      <label>Search clients<input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="ID, name, phone or email" /></label>
      <label>Status<select value={status} onChange={event => { setPage(1); setStatus(event.target.value) }}>
        <option value="">All statuses</option>{['new', 'contacted', 'qualified', 'closed'].map(value => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <button type="submit" className="leads-button">Search</button>
      <button type="button" className="leads-button" onClick={refresh}>Refresh</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Loading leads…</p> : <section className="leads-card">
      <p className="leads-summary">{pagination.total || 0} applications{updatedAt && ` · Updated ${updatedAt.toLocaleTimeString()} · Auto-refresh every 15 seconds`}</p>
      {results.length ? <LeadTable leads={results} /> : <p>No applications match your filters.</p>}
      <nav className="leads-pagination" aria-label="Leads pagination">
        <button className="leads-button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button>
        <span>Page {page} of {Math.max(1, pagination.pageCount || 1)}</span>
        <button className="leads-button" disabled={page >= (pagination.pageCount || 1)} onClick={() => setPage(value => value + 1)}>Next</button>
      </nav>
    </section>}
  </main>
}

export default function LeadsPage() {
  const { clientReference } = useParams()
  if (!clientReference) return <LeadsList />
  const match = /^client=(\d{6})$/.exec(clientReference)
  return match ? <LeadDetail clientId={match[1]} /> : <main className="leads-admin"><h1>Page not found</h1><Link to="/plugins/leads">All leads</Link></main>
}
