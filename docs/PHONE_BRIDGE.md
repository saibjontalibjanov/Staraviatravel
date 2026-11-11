# Huawei SIM → CRM call history and caller identification

## Qisqa yo‘riqnoma (UZ)

- Saytning yangi call-center raqami: **+998 90 023 57 37**. Yangi ochiq QR shu raqamga qo‘ng‘iroq qiladi, telefonni CRM bilan juftlamaydi.
- CRM endi backend domenining `/` manzilida ochiladi. `/office` eski havolalari avtomatik yo‘naltiriladi.
- Serverda bazani zaxiralab, yangi migratsiya, `bootstrap_roles` va `collectstatic` buyruqlarini bajaring.
- Backendning mavjud `.env` fayliga kuchli `PHONE_BRIDGE_TOKEN` va `PHONE_BRIDGE_LINE=+998900235737` qo‘shing; ilovani restart qiling. Kalitni chatga yoki frontendga qo‘ymang.
- Huawei telefoningizga mos MacroDroid kabi avtomatlashtirish ilovasida biznes SIM qo‘ng‘irog‘i hodisasi uchun quyidagi HTTP/JSON shartnoma asosida POST sozlang. Telefon bergan raqam/vaqt qiymatlarini ilovaning o‘z variable picker’i orqali tanlang. Ruxsatlar va fon rejimida ishlashni telefoningizda tasdiqlash kerak.
- CRM’dagi **Phone calls** bo‘limida kelgan haqiqiy hodisani tekshiring. Biz bu muhitdan telefoningizga ilova o‘rnatmadik yoki SIM’ni ulab qo‘ymadik; hozircha server qismi va test hodisalari tekshirilgan.

## What works, and what still needs your phone

The CRM receives authenticated phone events, stores call history, matches the full caller number to existing client records, and displays an incoming-call alert in an authorized visible CRM tab (polling up to every 5 seconds). The ordinary SIM stays in your Huawei phone.

**The website cannot read or connect to a physical SIM by itself. No phone has been remotely paired by this code change.** You must configure a compatible phone automation app to send events. This implementation supplies the actual event API, private history and caller-identification UI; it does not claim a carrier/SIP connection, place calls, read SMS or record audio. Telephone links open your device's configured calling app; they do not select a SIM remotely.

The user identified the phone as Huawei. Many Huawei devices use Android/EMUI or an Android-compatible HarmonyOS version, and this method does not require Google Play Services. **HarmonyOS NEXT devices without Android APK support cannot use an Android automation app.** Check Settings → About phone for your actual model/OS before installing anything. A compatible app such as MacroDroid is required; obtain it through its official distribution. Carrier, handset, app version and granted permissions affect which triggers and caller-number fields are available. No real handset installation, vendor UI or physical call was tested here; external documentation was not reachable from this execution environment.

## 1. Deploy the backend

Pull `main`, back up your actual server database, review/apply migrations and refresh the standard roles/static files:

```bash
python manage.py migrate --plan
python manage.py migrate
python manage.py bootstrap_roles
python manage.py collectstatic --noinput
```

Migration `0006_phonecall_phonecallevent` adds only call/event tables. It does not replace leads, passports, bookings or existing call-center configuration. `bootstrap_roles` grants call-history viewing to the standard Agents/Managers roles; review customized groups first. Existing `view_lead` permission is separately required to reveal matched client names/links.

The CRM now opens at the backend root: `http://localhost:8000/` locally, and `https://api.staraviatravel.com/` or `https://cms.staraviatravel.com/` on whichever backend hostname you actually configured. Old `/office` URLs redirect to root with their query string; POSTs preserve their method/body. Old login/logout routes remain compatible. The new primary logout is a CSRF-protected POST to `/logout/`. A stale `CRM_ROOT_ENABLED=False` in `.env` no longer hides the root CRM. The public React website remains separate.

## 2. Generate one private bridge token

On your trusted computer/backend virtualenv:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy that generated value into the **existing private backend `.env`**:

```env
PHONE_BRIDGE_TOKEN=YOUR_GENERATED_RANDOM_VALUE
PHONE_BRIDGE_LINE=+998900235737
PUBLIC_BACKEND_URL=https://cms.staraviatravel.com
```

Use `https://api.staraviatravel.com` instead if that is still your real backend origin. Restart the existing Python application. Do not alter your database URL, signing secret or unrelated API keys. No phone token belongs in React, `VITE_*`, Git, a public QR, URL query parameter, screenshot or message. The token authorizes call-event ingestion only, not customer-data retrieval. Rotate it if exposed and update the phone header.

The server defaults to disabled when the token is empty/invalid. In non-debug mode the webhook requires HTTPS. Keep existing trusted-proxy/HTTPS settings verified; do not disable HTTPS to make the bridge work.

## 3. Set up the Huawei phone

A compatible Android automation app such as **MacroDroid** can send an HTTP request when its phone-call trigger fires. Menu names and available “Magic Text” fields vary by installed version; use the app's variable picker rather than typing guessed variable identifiers.

1. Install the app through its official distribution and open it.
2. Grant the phone/call-number permissions required by its triggers, after reviewing them. Do not root the phone or bypass Android permission restrictions. If the OS does not provide the number, report an empty phone value; the CRM will show private/unavailable rather than inventing a client.
3. The phone needs working internet while the call event is sent (Wi-Fi or mobile data/VoLTE). If voice calling suspends its data connection, events may arrive later rather than during the ring. Huawei's App launch/battery management may stop background automation. Allow the app's normal auto-launch/background execution using your model's settings and retain its normal foreground notification if required.
4. Configure triggers **only for the business SIM**. If the phone also has a personal SIM, use an app-supported subscription/SIM filter. Do not enable indiscriminate upload of personal calls; if a reliable filter is unavailable, use a dedicated business-SIM phone.
5. Create an incoming-call macro and an HTTP POST action with the endpoint/header/body described below.
6. If supported, create separate answered/ended/missed/rejected macros. Only report a status or duration that the phone/app actually supplies. Do not send every call-ended event as “completed” if it may have been missed.

### Incoming event mapping

- `deviceId`: fixed identifier you choose, e.g. `business-huawei` (letters/digits/underscore/dot/colon/plus/hyphen, max 64).
- `callId`: unique, **stable for this call**, e.g. the call's start Unix timestamp plus caller number. Save this in an app variable at the beginning and reuse it for answered/end events.
- `eventId`: unique for this event and stable on retries, e.g. the call ID plus `ringing`.
- `phone`: the **customer's caller number** from the trigger, not the company SIM number. Prefer full international format. A 9-digit Uzbek national number is normalized to +998 when the configured business line is Uzbek.
- `direction`: `incoming`.
- `status`: `ringing`.
- `occurredAt`: actual phone event time; ISO 8601 with timezone, Unix seconds, or Unix milliseconds. Select the appropriate date/time value through the app's variable picker.

Configure the HTTP action:

```text
Method: POST
URL: https://YOUR_ACTUAL_BACKEND_HOST/api/phone-bridge/events
Header: Authorization: Bearer YOUR_GENERATED_RANDOM_VALUE
Header: Content-Type: application/json
Body: raw JSON
```

Example **format only**, with illustrative timestamps/IDs: replace these with trigger variables selected in the phone app. A stale timestamp is intentionally rejected.

```json
{
  "deviceId": "business-huawei",
  "callId": "UNIQUE_STABLE_CALL_ID_FROM_PHONE",
  "eventId": "UNIQUE_STABLE_EVENT_ID_FROM_PHONE",
  "phone": "+998901112233",
  "direction": "incoming",
  "status": "ringing",
  "occurredAt": "2026-11-11T15:30:00+05:00"
}
```

Use an app string variable to hold the complete event JSON once. If retrying after a network error, resend that exact body with the **same** eventId/occurredAt, rather than regenerating its timestamp. The API returns `{"received":true,"duplicate":false}` for a new event and `duplicate:true` for an identical retry. There is no automatic outbound phone call or SMS.

For answered/end events, reuse **callId**, change **eventId**, report the new actual **status** and **occurredAt**. Optional `durationSeconds` must be an integer (without JSON quotes), 0–86400, and only included when actually known. Supported statuses: `ringing`, `answered`, `completed`, `missed`, `rejected`. Outgoing events can use `direction: outgoing` if the phone app supports them.

Call waiting and overlapping calls require a reliable per-call ID/mapping in the automation app. A single global “current call” variable is not sufficient for concurrent calls. If your phone/app cannot provide reliable correlation or final status, start with **incoming notifications only**, leaving duration unknown, or use a dedicated supported native/PBX connector. The server cannot reconstruct call identity that the handset never supplied. Events older than 7 days or over 5 minutes in the future are rejected; keep the phone clock correct.

## 4. Verify with a real, authorized test call

After deployment and phone setup, sign into the CRM and open **Phone calls**. It should show the current business line and the time of the last real received event. “Authorization configured” only means the token exists; **it does not mean a phone is connected**.

Make an authorized test call to the business SIM:

- A single matching customer number links to that lead.
- Several records with the same full number are marked ambiguous, with no arbitrary auto-selection.
- Unknown callers stay unlinked; an authorized agent may explicitly create a client with the number prefilled.
- Incoming events can show a nonblocking in-app alert with an “Open client” button. Permission checks apply; background polling never opens the fullscreen loader.
- Duration/answered/end status appears only if the phone sends it. A stale ringing report is not proof that a call is still active.

Check the HTTP action's response on the phone. 403 means authorization/HTTPS needs checking; 400 means payload/time/format validation failed; 503 means bridge configuration is missing. Do not paste the Authorization header or private customer data into support screenshots.

## Security and implementation

- Token comparison is constant-time; only a token hash of event/call identifiers and a payload fingerprint are used for deduplication, not arbitrary raw payload storage. The actual bridge credential stays in `.env` and the phone header.
- Phone metadata is trusted as device-reported, not certified by the carrier. A compromised bridge token can submit false call events; it cannot read private clients or modify tickets through this endpoint.
- Atomic ingestion, unique event/call keys, exact-retry idempotency, conflicting-replay rejection, strict size/field/time validation and rate limits protect the receiver.
- Full-number normalization is used for customer matching, never suffix-only matching. Ambiguous matches remain unlinked. Old events cannot downgrade completed/missed/rejected calls to ringing.
- Public phone ingestion uses Bearer auth, not staff cookies; staff history/polling requires Django session permissions. CRM writes/logout retain CSRF protection. Private responses are no-store/noindex.
- There is no audio recording, SMS access, remote SIM control, browser microphone capture, automatic creation of customer leads or third-party forwarding of call history.

## Verification and limitations

Backend tests use phone-event fixtures, not actual SIM calls: authorization, HTTPS, duplicate events, conflicting replay, stale/invalid timestamps, epoch formats, out-of-order events, caller normalization, ambiguous/private callers, permission redaction, cursor polling, root routes and preserved customer information. Browser checks use disposable local users/data. The existing public call-center QR contains `tel:+998900235737` only; it is **not** a phone-pairing secret.

No production deployment, real handset pairing or real call was performed. Huawei model/OS/app compatibility and actual device permissions/background delivery must be tested on your phone after setup.

## Change validation (2026-11-11)

- Full Django suite: **85 tests passed** (including phone bridge and root/legacy-route cases).
- Frontend suite: **38 tests passed**; production Vite build passed.
- New QR independently decoded as `tel:+998900235737`, both from the original PNG and a screenshot at the actual 96px popup size.
- Chromium with disposable local database/user: root login/logout, `/office/?section=calls` → `/?section=calls`, authenticated simulated phone event → caller alert → correct lead, private call history, new website phone link and QR. These are simulated events, not physical Huawei calls.
- Migration model consistency: no pending source/model changes. Migration 0006 was applied only to the known workspace-local SQLite file after a verified backup; its post-migration audit was healthy. The live/laptop database is not changed by pulling Git.
- No server deployment, handset installation, SIM pairing, outbound call or SMS occurred. Follow the setup above on your actual phone and server before expecting live call history.

Rollback: revert application/static/template code if needed, but retain new call tables/history. Do not reverse the migration over real call records or restore an older database over newer leads without a reviewed recovery plan. Emptying/replacing the bridge token disables ingestion and requires updating the phone header; it does not cancel or control real calls.
