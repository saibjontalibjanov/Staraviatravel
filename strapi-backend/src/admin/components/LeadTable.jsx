import { Link } from 'react-router-dom'

export const clientLink = clientId => `/client=${clientId}`
export const clientName = lead => [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Callback request'

export default function LeadTable({ leads, compact = false }) {
  return (
    <div className="leads-table-scroll">
      <table className="leads-table">
        <thead><tr><th>Client ID</th><th>Client</th><th>Phone</th>{!compact && <><th>Source</th><th>Received</th></>}<th>Status</th></tr></thead>
        <tbody>{leads.map(lead => <tr key={lead.documentId}>
          <td><Link to={clientLink(lead.clientId)}>{lead.clientId}</Link></td>
          <td>{clientName(lead)}</td><td>{lead.phone}</td>
          {!compact && <><td>{lead.source}</td><td>{new Date(lead.createdAt).toLocaleString()}</td></>}
          <td><span className="leads-status">{lead.leadStatus}</span></td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}
