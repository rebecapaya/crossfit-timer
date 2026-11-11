# Box Timer

A workout timer for a CrossFit box. Coaches set up the workout on a computer, and the timer opens full screen on a phone through a link or a QR code.

**Live:** https://crossfit-timer-beta.vercel.app

## How to use it

1. On the computer, open the app and sign in with a **@yaqbot.com** Google account.
2. On `/setup`, choose a mode and fill in its fields:
   - **For Time**, with a time cap
   - **AMRAP**, with a duration
   - **EMOM**, with an interval and a number of rounds
   - Optionally, you can put a title and a countdown before the start.
   - Quick presets are available for common workouts.
3. Scan the QR code with the phone (or copy the link).
4. On the phone, tap **START**. The phone does not need to sign in.

> Open `/setup` from the published URL. A QR code generated on `localhost` points to your own computer and will not open on the phone.

## Features

- Full-screen timer with large digits, readable from several metres away.
- A colour for each moment: amber during the countdown, black while working, red digits in the last 3 seconds, a red screen when finished and grey while paused.
- Beeps on 3-2-1, at the start, on every EMOM round and at the end. The start screen has a **Test sound** button to check the volume.
- The screen stays on during the workout.
- Tapping the screen shows **Pause / Resume / Reset**. Reset needs two taps, so nobody stops the class by accident.
- If the phone leaves the app and comes back, the time is still correct, and one tap brings the sound back.
- Invalid or tampered links show an error message instead of breaking the timer.

## Stack

- Next.js (App Router) with React and TypeScript
- Plain CSS (no UI framework), using container queries so the digits always fit the screen
- Auth.js v5 for Google sign-in
- `qrcode.react` for the QR code
- Browser APIs: Web Audio API for the beeps, Screen Wake Lock API to keep the screen on
- Hosted on Vercel

## Project structure

| Path | What it does |
|---|---|
| `app/page.tsx` | Sign-in page. Redirects to `/setup` if the coach is already signed in, and shows an error if the account is not allowed. |
| `app/setup/page.tsx` | Coach page (server component). Checks the session and shows the coach's email and a sign-out button. |
| `app/timer/page.tsx` | Phone timer. Reads the workout from the URL hash and shows the start screen, then the timer. Public, no sign-in. |
| `app/privacy/page.tsx` | Privacy policy, required by Google to publish the OAuth app. |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js route that handles the Google sign-in and callback. |
| `app/layout.tsx` | Root layout: font, viewport and metadata for mobile and home-screen use. |
| `app/globals.css` | All the styles. |
| `auth.ts` | Auth.js configuration: Google provider and the allowed-domain check. |
| `proxy.ts` | Protects `/setup`: requests without a session are sent to the sign-in page. |
| `components/SetupClient.tsx` | Client side of `/setup`: holds the current workout and joins the form and the QR code. |
| `components/WorkoutForm.tsx` | Workout form. Keeps a draft of all three modes, validates it and shows errors per field. |
| `components/DurationInput.tsx` | Minutes : seconds input, reused by the three modes. |
| `components/ShareQR.tsx` | QR code, workout summary, copyable link and "open timer" link. |
| `components/TimerDisplay.tsx` | Full-screen timer view and its controls. |
| `hooks/useTimer.ts` | Runs the clock (start, pause, resume, reset) and plays the beeps. |
| `hooks/useWakeLock.ts` | Keeps the screen on and requests the lock again when the page becomes visible. |
| `lib/workout.ts` | Workout types, limits, defaults, validation and URL encoding/decoding. |
| `lib/timeline.ts` | Pure functions: the timer state for a given elapsed time, which beep to play, and time formatting. |
| `lib/sound.ts` | Beeps generated with the Web Audio API, and the audio unlock needed on iOS. |

## Run locally

Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

After copying `.env.example`, fill in the values in `.env.local`:

- `AUTH_SECRET`: any long random string, for example from `openssl rand -base64 32`.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`: from a Google OAuth client (web application) with this redirect URI: `http://localhost:3000/api/auth/callback/google`
- `ALLOWED_DOMAIN`: set it to the domain of your own Google account (e.g. `gmail.com`) to test sign-in locally.

If the Google OAuth app is still in *Testing* mode, add your account as a test user in Google Cloud.

To check a production build: `npm run build && npm start`.

## Environment variables

| Variable | What it is |
|---|---|
| `AUTH_SECRET` | Secret used by Auth.js to sign and encrypt the session cookie. |
| `AUTH_GOOGLE_ID` | Client ID of the Google OAuth client. |
| `AUTH_GOOGLE_SECRET` | Client secret of the Google OAuth client. |
| `ALLOWED_DOMAIN` | Email domain allowed to sign in. Defaults to `yaqbot.com`. Production uses `yaqbot.com`; it can be changed locally to test with another account. |

On Vercel, the four variables are set in *Settings → Environment Variables*, and the production URL is added to the Google OAuth client as an authorized origin and redirect URI.

## Decisions and trade-offs

- **No database.** The workout travels inside the timer link and the QR code, in the URL hash (`/timer#…`). Nothing needs to be stored, the phone does not need to sign in, and the hash is never sent to the server.
- **`encodeURIComponent` instead of base64.** It is simpler and handles titles with accents or emoji out of the box. The trade-off is a slightly longer, readable URL, which is fine for workouts this small.
- **The same validation everywhere.** The form and the phone use the same `validateWorkout` function, so any workout the form accepts will open on the phone, and a tampered link is rejected.
- **The clock does not "count" seconds.** Every 100 ms it reads the real time, subtracts the start time and works out what to show. Even if the browser delays or skips ticks, the time stays exact. It uses `setInterval` instead of `requestAnimationFrame`, which stops completely when the page is not visible.
- **The logic is kept separate.** The functions that calculate the time and the beeps (`lib/timeline.ts`) do not depend on the browser or on React, so they are easy to test and reason about.
- **Missed beeps are not played when coming back to the app.** The iPhone freezes the page when you leave the app. When you come back, the screen catches up silently instead of playing alerts that already happened.
- **The sound is unlocked on the START tap.** iOS only allows audio that starts from a user gesture. On iOS 17 and later, the app also asks to play even when the silent switch is on.
- **The screen lock is requested again.** The browser releases the Wake Lock whenever the page is hidden, so the app requests it again every time the page becomes visible.
- **Sign-in is checked in several steps.** Google only shows @yaqbot.com accounts, but that is just a visual filter. The real check happens on the server: the email must be verified by Google and belong to the allowed domain. `/setup` is protected twice, by `proxy.ts` and by a session check in the page itself, so it does not depend on the proxy alone.
- **Limits that make sense for a box:** time cap and AMRAP from 1 to 60 min, EMOM interval from 10 s to 10 min, 1 to 60 rounds, and a countdown from 0 to 60 s.

## Known limitations

- There is no sound with the phone locked or with the app in the background. No web page can do this reliably. In practice the phone sits untouched and the screen stays on, and iOS *Guided Access* (or Android *App pinning*) keeps it inside the app.
- On the iPhone, Safari does not allow a web page to go truly full screen.
- When switching apps, the iPhone can cut off the sound. The app shows a warning, and one tap brings it back.
- I could not test sign-in with a real @yaqbot.com account. I tested the whole flow locally with another domain, and in production I checked that a Gmail account is rejected, even after removing Google's filter from the URL.
- Tested on an iPhone 17 and a MacBook. I could not test it on Android or Windows.