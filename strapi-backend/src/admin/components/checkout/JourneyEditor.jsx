import { emptyLeg } from './itinerary.mjs'
export default function JourneyEditor({ journeys, onChange, tripType }) {
  const edit = (journeyIndex, legIndex, key, value) =>
    onChange(
      journeys.map((journey, i) =>
        i === journeyIndex
          ? {
              ...journey,
              legs: journey.legs.map((leg, j) => (j === legIndex ? { ...leg, [key]: value } : leg)),
            }
          : journey,
      ),
    )
  const title = (index) =>
    tripType === 'round-trip' ? (index === 0 ? 'Outbound' : 'Return') : `Journey ${index + 1}`
  return (
    <div className="checkout-journeys">
      {journeys.map((journey, index) => (
        <fieldset key={index}>
          <legend>
            {title(index)} · {Math.max(0, journey.legs.length - 1)} stop(s)
          </legend>
          {journey.legs.map((leg, legIndex) => (
            <div className="checkout-admin-segment" key={legIndex}>
              <h4>Flight segment {legIndex + 1}</h4>
              <div className="checkout-admin-fields">
                {[
                  ['from', 'From airport (IATA)', 'text'],
                  ['to', 'To airport (IATA)', 'text'],
                  ['fromCity', 'From city / airport name', 'text'],
                  ['toCity', 'To city / airport name', 'text'],
                  ['departureDate', 'Flight departure date', 'date'],
                  ['arrivalDate', 'Flight arrival date', 'date'],
                  ['departureTime', 'Departure time (local)', 'time'],
                  ['arrivalTime', 'Arrival time (local)', 'time'],
                  ['departureTerminal', 'Departure terminal', 'text'],
                  ['arrivalTerminal', 'Arrival terminal', 'text'],
                  ['airline', 'Operating airline', 'text'],
                  ['flightNumber', 'Flight number', 'text'],
                  ['cabin', 'Class of seats', 'text'],
                  ['durationMinutes', 'Flight duration (minutes)', 'number'],
                ].map(([key, label, type]) => (
                  <label key={key}>
                    {label}
                    <input
                      required={!['departureTerminal', 'arrivalTerminal'].includes(key)}
                      type={type}
                      min={type === 'number' ? 1 : undefined}
                      max={type === 'number' ? 2880 : undefined}
                      maxLength={['from', 'to'].includes(key) ? 3 : 100}
                      value={leg[key]}
                      onChange={(e) =>
                        edit(
                          index,
                          legIndex,
                          key,
                          ['from', 'to'].includes(key)
                            ? e.target.value.toUpperCase()
                            : e.target.value,
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              {legIndex > 0 && (
                <p>
                  Layover at {leg.from || 'connection airport'} is calculated from the previous
                  arrival and this departure.
                </p>
              )}
              <button
                className="leads-button"
                type="button"
                disabled={journey.legs.length === 1}
                onClick={() =>
                  onChange(
                    journeys.map((item, i) =>
                      i === index
                        ? { ...item, legs: item.legs.filter((_, j) => j !== legIndex) }
                        : item,
                    ),
                  )
                }
              >
                Remove flight segment
              </button>
            </div>
          ))}
          <button
            className="leads-button"
            type="button"
            disabled={journey.legs.length >= 6}
            onClick={() =>
              onChange(
                journeys.map((item, i) =>
                  i === index
                    ? {
                        ...item,
                        legs: [
                          ...item.legs,
                          {
                            ...emptyLeg(),
                            from: item.legs.at(-1).to,
                            fromCity: item.legs.at(-1).toCity,
                            departureDate: item.legs.at(-1).arrivalDate,
                            arrivalDate: item.legs.at(-1).arrivalDate,
                          },
                        ],
                      }
                    : item,
                ),
              )
            }
          >
            Add connecting flight
          </button>
        </fieldset>
      ))}
      {tripType === 'multi-city' && (
        <div className="checkout-admin-buttons">
          <button
            className="leads-button"
            type="button"
            disabled={journeys.length >= 6}
            onClick={() => onChange([...journeys, { legs: [emptyLeg()] }])}
          >
            Add city / journey
          </button>
          <button
            className="leads-button"
            type="button"
            disabled={journeys.length <= 2}
            onClick={() => onChange(journeys.slice(0, -1))}
          >
            Remove last journey
          </button>
        </div>
      )}
    </div>
  )
}
