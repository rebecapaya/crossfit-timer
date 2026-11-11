# AI Notes

I built this project with Claude as a pair programmer. I had not used Next.js or Auth.js before, so I asked for code one file at a time, reviewed it, and tested everything on a real iPhone. I kept handwritten notes of what went wrong; this page summarises them.

## What I asked the AI

- **To restate the goal and the tasks** from the brief before writing any code. I wanted to check that it had understood the assignment and make it analyse the brief first.
- **A starting structure and plan:** which files to create, what each one does, what to install and in which order to work.
- **Code piece by piece** (workout model, timer logic, sound, Wake Lock, timer hook, UI, form, QR, sign-in), plus reviews of code I wrote or adapted myself.
- **Explanations of errors** from TypeScript, Next.js, Google Cloud and Vercel, and fixes for the bugs I found on the phone.

## What broke

- **Setup order.** The AI gave me the file structure before the `create-next-app` command. I created the files by hand, and then the command generated a second `crossfit-timer` folder inside the first one. I deleted it and did it the other way round.
- **Empty files.** The empty `page.tsx` and `route.ts` files made Next.js fail with "is not a module". The AI explained why, and I added placeholder content.
- **Middleware.** `middleware.ts` gave errors, so I removed it until the sign-in phase. My Next.js version expects `proxy.ts` instead, and its `@/auth` import error I fixed by hand.
- **False beep on return.** iOS freezes JavaScript in hidden tabs, so when I came back to the timer it compared the current round with a stale one and played a long beep. The AI had claimed that "at most one beep" would play on return, and that was exactly the wrong one. The fix was a silent resync when the page becomes visible.
- **Sound lost after leaving the browser.** This took two attempts. The first fix trusted the `AudioContext` state, but iOS Safari can report `running` while staying silent. The final version assumes the audio is lost whenever the page comes back, shows a warning, and rebuilds the audio on the next tap.
- **"20 / 20" cut off on the iPhone.** The AI first misread the problem as the big digits being cut off, not the round counter in the header. I fixed it myself: the title truncates and the round counter keeps its own column.
- **Sign-in setup.** `npx auth secret` still failed after the AI's suggestions, so I generated the secret by hand. The AI never explained how to fill `.env.local`, which I noticed and completed. Google also refused to publish the OAuth app without a home page and a privacy policy URL, so I added `/privacy`.

## What I changed

- **Validation.** The AI's version rejected any unknown field. I simplified it: it builds a new object field by field, so unknown values are just filtered out, and the title is handled in the shared base.
- **URL encoding.** I used `encodeURIComponent` instead of the suggested base64url, because it is simpler and works with accents and emoji.
- **Real-device testing decided what "done" meant.** Every serious bug above (beeps, sound, layout) only appeared on the iPhone, never in the desktop browser or in the AI's reasoning.
- **What I could not verify is stated, not assumed:** sign-in with a real @yaqbot.com account, and Android (see the README).

## AI conversation log

- Main conversation with Claude: [link](https://claude.ai/share/45fb4acb-8b84-42a0-beb1-00c6a30f2222)