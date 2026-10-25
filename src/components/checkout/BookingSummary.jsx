export default function BookingSummary({ booking, result, t, locale, money, date, cabin }) {
  const duration = (value) => `${Math.floor(value / 60)}${t.hours} ${value % 60}${t.minutes}`
  return (
    <aside className="cc-summary cc-panel" aria-label={t.booking}>
      <div className="cc-summary-heading">
        <p className="cc-eyebrow">{t.booking}</p>
        {booking.clientId && (
          <span className="cc-lead-id" aria-label={t.leadId}>
            {booking.clientId}
          </span>
        )}
      </div>
      <h2>{booking.route}</h2>
      {booking.tripType && (
        <p className="cc-trip-type">
          {
            { 'one-way': t.oneWay, 'round-trip': t.roundTrip, 'multi-city': t.multiCity }[
              booking.tripType
            ]
          }
        </p>
      )}
      {booking.journeys?.length ? (
        booking.journeys.map((journey, index) => (
          <article className="cc-flight cc-journey" key={index}>
            <div className="cc-flight-heading">
              <p>
                {booking.tripType === 'round-trip'
                  ? index === 0
                    ? t.outbound
                    : t.return
                  : booking.tripType === 'one-way'
                    ? t.outbound
                    : `${t.journey} ${index + 1}`}
              </p>
              <time dateTime={journey.legs[0].departureDate}>
                {date(journey.legs[0].departureDate)}
              </time>
            </div>
            {journey.legs.map((leg, legIndex) => (
              <div key={legIndex}>
                {legIndex > 0 && (
                  <p className="cc-layover">
                    {t.layover}: {journey.layovers[legIndex - 1]?.city} (
                    {journey.layovers[legIndex - 1]?.airport}) ·{' '}
                    {duration(journey.layovers[legIndex - 1]?.minutes || 0)}
                  </p>
                )}
                <div className="cc-flight-times">
                  <div>
                    <strong>{leg.departureTime}</strong>
                    <span>
                      {leg.from}
                      {leg.departureTerminal ? ` · ${leg.departureTerminal}` : ''}
                    </span>
                    <small>{leg.fromCity}</small>
                  </div>
                  <div className="cc-flight-line">
                    <span>{duration(leg.durationMinutes)}</span>
                    <i>✈</i>
                    <small>{leg.flightNumber}</small>
                  </div>
                  <div>
                    <strong>{leg.arrivalTime}</strong>
                    <span>
                      {leg.to}
                      {leg.arrivalTerminal ? ` · ${leg.arrivalTerminal}` : ''}
                    </span>
                    <small>{leg.toCity}</small>
                    {leg.arrivalDate !== leg.departureDate && (
                      <small>{date(leg.arrivalDate)}</small>
                    )}
                  </div>
                </div>
                <p className="cc-flight-airline">
                  {leg.airline} · {cabin(leg.cabin)}
                </p>
              </div>
            ))}
            <p className="cc-stops">
              {duration(journey.durationMinutes)} ·{' '}
              {journey.stops === 0 ? t.direct : `${t.stops}: ${journey.stops}`}
            </p>
          </article>
        ))
      ) : (
        <>
          <div className="cc-flight">
            <p>{t.outbound}</p>
            <strong>{date(booking.departureDate)}</strong>
            <span>✈ {booking.route}</span>
            {booking.airline && (
              <small>
                {booking.airline} · {cabin(booking.cabin)}
              </small>
            )}
          </div>
          {booking.returnDate && (
            <div className="cc-flight">
              <p>{t.return}</p>
              <strong>{date(booking.returnDate)}</strong>
            </div>
          )}
        </>
      )}
      <div className="cc-passenger-list">
        {booking.passengerDetails?.length ? (
          booking.passengerDetails.map((person) => (
            <p key={person.id}>
              ♙ {person.fullName} ({t[person.passengerType]})
            </p>
          ))
        ) : (
          <p>
            ♙ {booking.passengerName} · {booking.passengers}
          </p>
        )}
      </div>
      <div className="cc-baggage">
        {booking.baggage?.length
          ? booking.baggage.map((item, index) => (
              <p key={index}>
                ♧ {{ checked: t.checked, cabin: t.cabinBag, personal: t.personal }[item.type]}:{' '}
                {item.allowance} · {item.appliesTo}
              </p>
            ))
          : booking.version === 2 && <p>{t.noBaggage}</p>}
      </div>
      <div className="cc-total">
        <div>
          <p>
            {t.total} · {result.currency}
          </p>
          <small>{t.included}</small>
        </div>
        <strong>{money}</strong>
      </div>
      <p className="cc-valid">
        {t.valid}
        <br />
        <strong>{new Date(result.expiresAt).toLocaleString(locale)}</strong>
      </p>
      <p className="cc-small">♧ {t.secure}</p>
    </aside>
  )
}
