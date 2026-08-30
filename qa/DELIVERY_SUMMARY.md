# Ahla Shabab platform — delivery summary

**جمعية خواطر أحلى شباب** · 8–20 August 2026
Backend API · Mobile app (Android) · Admin dashboard

> Arabic version of this document: `DELIVERY_SUMMARY.ar.md`

---

## Where the platform stands

**71% of the agreed requirements are delivered and verified**, up from 57% at the start of this
remediation. Everything described below is **live on the server as of 20 August**.
Of 52 requirements: **23 complete**, **24 partially complete**, **2 not started**, **2
waiting on an external account**, 1 no longer applicable.

**Nothing is failing.** At the start of this work, three requirements were outright broken and four
had never been built. None are broken now.

The platform is **not yet ready for the Google Play store**, for reasons listed under *What is still
needed* — all of which are decisions or accounts, not engineering work.

### What "verified" means here

Every status in this summary is backed by something that was executed, not by reading the code.
Where a claim could not be tested, it is not claimed. The backend now runs **290 automated tests**
across 30 suites on every change, against a real PostgreSQL database, and refuses to accept a change
that reduces coverage.

---

## What was delivered

### The app now talks to the server

Before this work, several parts of the mobile app looked complete but never reached the server:

- **Donations were not recorded.** The app produced a receipt with an invented reference number and
  sent nothing. That is fixed: a donation is now stored, linked to the case or project it was given
  for, and appears in the dashboard for approval.
- **Login was simulated.** Any six-digit code signed you in. Real email verification now runs against
  the server.
- **Personal screens showed sample data.** Bookings, donation history, receipts, favourites and
  notifications now show the signed-in person's own records.

### The dashboard now saves what staff enter

- Content, services and categories persist to the server instead of the browser.
- Booking, donation, volunteer and consultation statuses persist, and each change is recorded against
  the administrator who made it.
- **Consultation requests are visible for the first time.** Someone could submit a consultation
  request from the app, receive a reference number, and it would land somewhere nobody at the
  foundation could open. They now appear in the inbox and can be reviewed and scheduled with a named
  provider, date and time.
- A deploy no longer overwrites content staff have written, or resets permissions an administrator has
  tightened.

### Money and records

- **Fundraising totals are now real.** A case's progress bar was a number typed by hand; approving a
  donation now credits the case it was given for.
- **Receipt references were guessable.** They were six random digits — roughly a one-in-a-million
  space with a realistic chance of two donors receiving the same reference. Anyone could have stepped
  through them and read a donor's name, and — through the booking lookup — **a beneficiary's phone,
  age, gender and national ID number**. References are now unguessable, the national ID is no longer
  returned at all, and 200,000 generated in a test produced no collision.
- Donations made by bank transfer, Fawry or Vodafone Cash correctly stay «قيد المراجعة» until a person
  confirms them. No payment is ever reported as successful by the app.

### Safety and correctness

- **Double-booking is proven impossible.** Two people booking the same slot at the same instant leave
  exactly one booking; the second is refused with a clear message. The database now enforces this in
  its own right, so a duplicate cannot arrive by any other route either — while a cancelled slot can
  still be rebooked normally.
- **Permissions are proven.** 31 tests confirm that an administrator cannot reach a module they are not
  granted, that a user cannot reach the admin area, and that one person's records never appear in
  another's.
- **Administrator accounts can now be managed** — created, disabled, and passwords reset — and the
  system refuses any change that would leave nobody able to administer it.
- Every change made in the dashboard is recorded with who made it. Bookings were the one area with no
  record at all; they are covered now, as are file uploads.

---

## What was found along the way

Six problems were found that were not in the original audit. Three are serious enough to name plainly.

### 1. The administrator password was published on the internet

The setup script contained the live administrator password in a **public** code repository, and
re-applied it to the production server on every update. That account holds every permission in the
system — donations, beneficiary records, national ID numbers.

**It was confirmed to be working on the live server.** It has since been changed by the foundation, and
verified closed: the old password is now rejected. The setup script can no longer create or reset an
account this way, and a password-change function was added, because none existed.

**One thing cannot be established from here:** whether anyone else used that password before it was
changed. The activity log records administrative actions and is worth reviewing for anything
unexpected. Server access logs, if retained, would show more.

### 2. Five wrong password guesses could lock out the entire foundation

The system's rate limits were counting every visitor as the same person, because it was not reading
the real visitor address from behind Cloudflare. In practice: five failed login attempts from anyone on
the internet would have locked **every** administrator out of the dashboard for ten minutes,
repeatable indefinitely; and the whole platform shared a single budget of 100 requests per minute.

Fixed. The setting was applied on the server on 20 August and confirmed live, so the limits now
apply per visitor.

### 3. Password reset emails reported success when nothing was sent

The login code request always answered "we have sent your code", whether or not any email left the
server. With no email service configured — which has been the case throughout — that was every
request. Users were told to check an inbox nothing was coming to, and no error appeared anywhere. The
system now reports the failure honestly.

### Also found and fixed

- Every app version released so far, including v1.6.0, was signed with a **test certificate** Google
  Play rejects. Signing now uses a real certificate and a release build **fails** rather than quietly
  producing something unpublishable.
- **Push notifications were never built.** The requirement was recorded as waiting for a Google
  credential; in fact there was no code to send a notification and no code to register a phone, and the
  credential being waited for had been discontinued by Google in June 2024. Both halves are now built.
- The system health check **always reported healthy** — it checked nothing. Any monitoring pointed at
  it would have reported the platform fine right through an outage.
- Changes were being deployed to the live database with a command that can silently drop columns, with
  no record of what changed.

---

## What is still needed

None of the following is engineering work. Each is a decision, an account, or a five-minute task on the
server.

### Immediate — blocking

**Nothing.** The proxy configuration was set on the server on 20 August and is confirmed live
(`TRUST_PROXY=2`), so rate limits now apply per visitor rather than to everyone at once.

### Before the app can be published

| | What | Who | Effort |
|---|---|---|---|
| 1 | **Create a signing certificate for the app** and store it somewhere it cannot be lost. If it is lost, the app can never be updated on Google Play again — there is no recovery. | Foundation | 15 minutes |
| 2 | **A Firebase account** (service file for the server, configuration file for the app). Without both, notifications reach the app's own inbox but never a phone. | Foundation | 30 minutes |
| 3 | **An email service** so login codes actually arrive. | Foundation | Provider-dependent |

### Decisions

| | What | Who |
|---|---|---|
| 4 | **Five questions on the consultant portal**, in `CONSULTANT_PORTAL_SCOPE.md`. The one that matters most: a consultation request contains a person's phone, age, location and their own written account of their circumstances. Should a consultant see all of that before accepting the case, and should they see requests assigned to colleagues? This should be decided deliberately. | Foundation |
| 5 | Confirm the Vodafone Cash code `#237*9*` is correct as written. | Foundation |
| 6 | Whether deployments should be blocked when tests fail. | Foundation / team |

### Remaining engineering, once decisions are made

| | What | Effort |
|---|---|---|
| 7 | Consultant portal — the consultant-facing part (items 1 and 2 of it are already built) | ~3 days |
| 8 | iOS build — requires an Apple Developer account | ~1 day after the account |
| 9 | A first real donation, made deliberately and followed end to end. The live system has never processed one. | 1 hour |

---

## A note on the percentage

**71% is the least useful number in this document**, and it should not be read as "71% of the work is
done".

Several of the most serious problems found — the published password, the platform-wide lockout, the
health check that could not fail — **did not move the score at all**, because the requirement they sat
under was already counted as complete. Three requirements were moved *down* during this work, not
because anything regressed, but because they had been scored on the wrong evidence:

- "An Android release was produced" — a file existed; it was signed with a test certificate.
- "Push notifications: waiting on a credential" — nothing had been built to use one.
- "Consultation requests are handled" — the screen to handle them did not exist.

The pattern is consistent: **a requirement counted as met because the code existed, rather than because
a person could use it.** Where the remaining estimates are concerned, the same caution applies — they
describe what is known, and areas nobody has examined directly should be treated as unknown rather than
as fine.

The platform is in materially better shape than it was, and the specific things standing between it and
a launch are listed above and are short. But the number understates both what was wrong and what was
fixed.
