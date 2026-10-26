import useLeads from './useLeads'
import LeadTable from './LeadTable'
import './leads.css'

export default function LeadsWidget() {
  const { results, pagination, loading, error, refresh } = useLeads('page=1&pageSize=5&sort=createdAt:desc')
  return <div className="leads-widget">
    {loading ? <p role="status">Loading leads…</p> : error ? <p role="alert">{error} <button onClick={refresh}>Retry</button></p> : <>
      <p className="leads-summary"><strong>{pagination.total || 0}</strong> applications · Latest 5 · Updates every 15 seconds</p>
      {results.length ? <LeadTable leads={results} compact /> : <p>No applications yet. New website applications will appear here.</p>}
    </>}
  </div>
}
