# Google Play — Data Safety declaration (draft)

**جمعية خواطر أحلى شباب** · `tech.saasfarm.ahlashabab` · drafted 20 August 2026

> **This is a legal declaration, not marketing copy.** Google enforces it: an app whose Data Safety
> answers do not match its behaviour can be removed from Play, and the account penalised. Every answer
> below is traceable to a column in `prisma/schema.prisma` or a DTO — the evidence is named so you can
> check rather than trust. **Someone at the foundation must review and own this before it is submitted.**
>
> It also goes stale the moment a new field is added. Treat it as part of the code.

---

## 1. Data collected

Play's question per type: *collected? · shared? · processed ephemerally? · required or optional? · purpose*

**"Shared" has a specific meaning in Play's terms:** transferred to a third party. Data handled by a
service provider **on the foundation's behalf** — hosting, Firebase delivering a notification — is
explicitly **not** "sharing". Every row below is therefore **Not shared**.

### Personal info

| Play data type | Collected | Required | Purpose | Where it comes from |
|---|---|---|---|---|
| **Name** | Yes | Required for the action | App functionality | `User.name`, `Booking.applicantName`, `ConsultationRequest.name`, `Donation.donorName`, `VolunteerApplication.name`, `ContactMessage.name` |
| **Email address** | Yes | Required | App functionality · Account management | `User.email` (it *is* the login), `ConsultationRequest.email`, `OtpCode.email` |
| **Phone number** | Yes | Required for the action | App functionality | `User.phone`, `Booking.phone`, `ConsultationRequest.phone` + `whatsapp`, `VolunteerApplication.phone`, `ContactMessage.phone` |
| **Address** | Yes — **governorate only** | Optional | App functionality | `User.governorateId`, `Booking.governorateId` + `city`. No street address is ever collected; the portfolio deliberately stores «بدون عنوان تفصيلي — خصوصية المستفيد» |
| **Other info** | **Yes — see below** | Mixed | App functionality | age, gender, **national ID**, free-text descriptions |

**"Other info" is the row that matters.** It carries three things Play has no dedicated category for:

- **Age and gender** — `Booking.age`, `Booking.gender`, `ConsultationRequest.age`, `VolunteerApplication.age`
- **National ID number** — `Booking.nationalId`. **Optional**, labelled «الرقم القومي … اختياري» on the
  form, never returned by the public reference lookup.
- **A person's written description of their own circumstances** — `ConsultationRequest.summary`.
  This is the most sensitive text the platform holds.

### App activity

| Play data type | Collected | Required | Purpose | Where it comes from |
|---|---|---|---|---|
| **Other user-generated content** | Yes | Required for the action | App functionality | `ConsultationRequest.summary`, `Booking.notes`, `ContactMessage.message`, `VolunteerApplication` interests and availability |

### Financial info

| Play data type | Collected | Notes |
|---|---|---|
| **Payment info** | **No** | There is no payment gateway in the app. Card details are never seen, transmitted or stored. Transfers happen outside the app by bank, Fawry or Vodafone Cash. |
| **Purchase history / other financial info** | **Yes — judgement call** | `Donation.amount`, `Donation.method`, `Donation.reference`. A donation is not a purchase, and no transaction is processed in-app. **Declaring it is the safer answer** — under-declaring is what gets enforced against. |

### Device or other IDs

| Play data type | Collected | Required | Purpose | Where it comes from |
|---|---|---|---|---|
| **Device or other IDs** | Yes | Optional | App functionality (notifications) | `DeviceToken.token` — the FCM registration token, collected only if the user grants notification permission. It identifies a device installation, not a person. |

---

## 2. Data explicitly NOT collected

Say no to all of these, and each answer is verifiable:

- **Location** — no GPS, no location permission. Governorate is typed by the user, not sensed.
- **Photos and videos · Audio · Files and documents** — users upload nothing. Media upload
  (`/admin/uploads`) is staff-only, from the dashboard, not the app.
- **Contacts · Calendar · SMS** — never requested.
- **Web browsing history** — none.
- **Health and fitness** — none. *(Note: a consultation summary may describe a health situation in
  free text. It is declared under "Other info" and "user-generated content"; it is not health data
  the app collects as such. Worth a second opinion if the foundation adds structured health fields.)*
- **App info and performance / crash logs** — no analytics or crash SDK in the app. Error logging is
  server-side only and covers staff actions.
- **Advertising** — no ads, no ad IDs, no ad SDKs, no tracking for advertising.

---

## 3. Security practices — the questions Play asks

| Question | Answer | Basis |
|---|---|---|
| Is data encrypted in transit? | **Yes** | HTTPS end to end, HSTS enabled |
| Can users request data deletion? | **Yes** | Policy commits to deletion within 30 days on request |
| Committed to the Play Families Policy? | **No** | The app is not directed at children |
| Independent security review? | **No** | Do not claim one; none has been done |

---

## 4. ⚠️ One requirement not yet met

Play requires apps that let people **create an account** to offer account deletion **in the app**, and
to provide a **web URL** where deletion can be requested. Today deletion is by email only, described in
the policy.

- There is **no in-app "delete my account"** control.
- There is **no `DELETE /me` endpoint** — only `DELETE /me/favorites`.

**This can fail review.** It is roughly a day's work: an endpoint that deletes the account and its
records, a confirmation screen in the app, and a simple web form at a public URL. Worth doing before
submission rather than after a rejection.

---

## 5. What to re-check before every submission

1. Has any new personal field been added to the schema? If yes, this document is out of date.
2. Has an analytics or crash-reporting SDK been added? That changes several answers.
3. Does the privacy policy at `/api/v1/privacy` still say the same things as this form? Play compares
   them, and so will anyone who reads both.
