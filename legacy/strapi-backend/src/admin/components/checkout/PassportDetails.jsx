import { useEffect, useRef, useState } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'
import './checkout-admin.css'
const emptyPassenger = () => ({
  id: crypto.randomUUID(),
  firstName: '',
  lastName: '',
  passportNumber: '',
  birthDate: '',
  expiryDate: '',
  nationality: 'Uzbekistan',
  passengerType: 'adult',
})
export default function PassportDetails({ lead, onSaved }) {
  const { get, put } = useFetchClient()
  const [passengers, setPassengers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const busy = useRef(false)
  const url = `/admin/lead-checkouts/${lead.clientId}/passports`
  useEffect(() => {
    const controller = new AbortController()
    get(url, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setPassengers(
            response.data.passengers.length ? response.data.passengers : [emptyPassenger()],
          )
          onSaved(response.data.passengers)
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause.response?.data?.error?.message ||
              'Could not load passport details. Your role needs Checkout and Lead read permissions.',
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [get, url, onSaved])
  const change = (index, key, value) => {
    setPassengers((previous) =>
      previous.map((person, i) => (i === index ? { ...person, [key]: value } : person)),
    )
    setNotice('Unsaved passport changes. Save before creating a checkout.')
  }
  const save = async (event) => {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    setNotice('')
    try {
      const response = await put(url, { passengers })
      setPassengers(response.data.passengers)
      onSaved(response.data.passengers)
      setNotice('Passport details saved. Checkout passenger names will use these records.')
    } catch (cause) {
      setError(
        cause.response?.data?.error?.message || 'Passport details were not saved. Please retry.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <section className="leads-card lead-checkouts" id="passport-details">
      <h2>Passport Details</h2>
      <p>
        Enter every traveller’s name exactly as shown on their passport. Passport numbers, birth
        dates and expiry dates are available only to authorised agents; client checkout pages
        receive names and passenger types.
      </p>
      {loading ? (
        <p role="status">Loading passport details…</p>
      ) : (
        <form onSubmit={save}>
          <fieldset disabled={pending}>
            <legend>Travellers</legend>
            {passengers.map((person, index) => (
              <div className="checkout-admin-passenger" key={person.id}>
                <h3>Passenger {index + 1}</h3>
                <div className="checkout-admin-fields">
                  {[
                    ['firstName', 'Given names', 'text'],
                    ['lastName', 'Surname', 'text'],
                    ['passportNumber', 'Passport number', 'text'],
                    ['birthDate', 'Date of birth', 'date'],
                    ['expiryDate', 'Passport expiry', 'date'],
                    ['nationality', 'Nationality', 'text'],
                  ].map(([key, label, type]) => (
                    <label key={key}>
                      {label}
                      <input
                        type={type}
                        required
                        value={person[key]}
                        maxLength={key === 'passportNumber' ? 30 : 100}
                        onChange={(e) => change(index, key, e.target.value)}
                      />
                    </label>
                  ))}
                  <label>
                    Passenger type
                    <select
                      value={person.passengerType}
                      onChange={(e) => change(index, 'passengerType', e.target.value)}
                    >
                      <option value="adult">Adult</option>
                      <option value="child">Child</option>
                      <option value="infant">Infant</option>
                    </select>
                  </label>
                </div>
                <button
                  className="leads-button"
                  type="button"
                  disabled={passengers.length === 1}
                  onClick={() => {
                    setPassengers((previous) => previous.filter((_, i) => i !== index))
                    setNotice('Unsaved passenger changes.')
                  }}
                >
                  Remove passenger
                </button>
              </div>
            ))}
            <div className="checkout-admin-buttons">
              <button
                type="button"
                className="leads-button"
                disabled={passengers.length >= 9}
                onClick={() => {
                  setPassengers((previous) => [...previous, emptyPassenger()])
                  setNotice('Unsaved passenger changes.')
                }}
              >
                Add passenger
              </button>
              <button type="submit" className="leads-button">
                {pending ? 'Saving…' : 'Save passport details'}
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {error && (
        <p className="checkout-admin-error" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  )
}
