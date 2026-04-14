# Vouch — Campus Dating, Built on Trust

**Live:** [vouchdating.vercel.app](https://vouchdating.vercel.app)

Vouch is an invite-only dating app for Nigerian university students. Every user is vouched for by a real member of their campus community, liveness-verified, and trivia-tested to prove they actually go to the school they claim. The result is a small, high-signal network where everyone is accountable.

---

## Why Vouch Exists

Generic dating apps have a spam and authenticity problem. Vouch trades scale for trust: you can only join if someone already on the platform vouches for you, you must prove you're a real person via liveness video, and you must pass a university-specific trivia quiz before you can interact with anyone. Every person on the app has cleared three separate gates.

---

## How It Works

### 1. Vouch Code — Invite Gate

Sign-up requires a valid vouch code issued by an existing member. Codes are single-use. The person who gave you the code is traceable — there is no anonymous entry. Each member gets a small pool of codes to share with friends they personally know.

### 2. University Verification

Users sign up with their campus email (`.edu` domain) and select their university. Email domain is validated on the server to match the declared school.

**Supported campuses:**

- University of Benin (UNIBEN) — `uniben.edu`
- University of Lagos (UNILAG) — `unilag.edu.ng`

### 3. Liveness Check — You're a Real Person

Before accessing the full app, each user records a short video clip following on-screen instructions (e.g. turn left, smile). The clip is reviewed to confirm it's a live human, not a photo or bot. Users remain in a locked state until cleared. Periodic re-checks can be triggered by admins for ongoing trust maintenance.

### 4. Culture Check — You Actually Go Here

After liveness, users complete a **Hyper-Captcha**: three timed multiple-choice questions drawn from a university-specific question bank. Questions are about campus geography, slang, events, and culture that only a real student would know. Users have 10 seconds per question and three total attempts before being locked out for 24 hours.

**Question banks:**

- UNIBEN — 30 questions
- UNILAG — 32 questions

Pass all three questions on any attempt → verified. Fail all three attempts → 24-hour lockout.

### 5. Onboarding

Once verified, users complete a multi-step profile setup:

| Step              | What happens                                                                        |
| ----------------- | ----------------------------------------------------------------------------------- |
| **Photos**        | Upload 2–4 profile photos                                                           |
| **Liveness**      | Record your verification clip                                                       |
| **Culture Check** | Pass the campus trivia quiz                                                         |
| **Interests**     | Choose 3–8 interests from 113 campus-relevant options                               |
| **Bio Wizard**    | Four-phase guided bio covering your basics, lifestyle, values, and personality hook |

The Bio Wizard collects: gender, what you're looking for, dating intent, relationship style, energy vibe, social energy, weekend activity, conflict style, deal-breakers, growth focus, relationship vision, a passion signal, a misunderstood trait, and a profile prompt (pick one of 10 prompts, write your answer).

---

## Core Features

### Discover

Browse verified student profiles one at a time. Profiles show photos, bio headline, intent badge, personality tags, and shared interests. Send a Handshake to express interest.

### Radar

See who's physically nearby on campus right now. Radar surfaces users within **0.5–1.5 km** of your current location — close enough to be on the same campus, far enough for a little mystery. Users with `Short-term` intent don't appear on radar regardless of their visibility setting. Users can toggle their radar visibility from their profile.

### Handshakes & Chat

When two users both send each other a Handshake, a conversation opens. Messages support editing and deletion. Conversations are end-to-end between the two matched users with no group threads.

### Profile

Your profile page shows your bio, interests, photos, vouch codes, verification status, and app settings. You can:

- Set or change your profile photo
- Add or remove photos (2–4 allowed)
- Edit your interests at any time (useful if you skipped this during onboarding)
- Toggle your academic level visibility on Discover
- Toggle radar visibility
- Share or toggle the privacy of your vouch codes

---

## Trust & Safety

| Layer          | Mechanism                                                          |
| -------------- | ------------------------------------------------------------------ |
| Entry          | Invite-only vouch codes — every user is accountable to someone     |
| Identity       | Liveness video reviewed before unlock                              |
| Campus proof   | Hyper-Captcha trivia, email domain validation                      |
| Ongoing        | Admins can trigger re-verification (pulse check) for any user      |
| Reporting      | Users can report others; flagged accounts receive warnings or bans |
| Accountability | Trust score per user, ban system with warning counts               |

---

## Tech Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| Framework     | Next.js 16 (App Router, Server Actions) |
| Language      | TypeScript                              |
| Database      | PostgreSQL via Neon                     |
| ORM           | Drizzle ORM                             |
| Auth          | Custom JWT sessions (HTTP-only cookies) |
| Image storage | Cloudinary                              |
| Styling       | Tailwind CSS, shadcn/ui                 |
| Deployment    | Vercel                                  |

---

## Local Development

```bash
# Install dependencies
pnpm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Push the database schema
npx drizzle-kit push

# Start the dev server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required Environment Variables

```
DATABASE_URL=           # Neon PostgreSQL connection string
JWT_SECRET=             # Secret for signing session tokens
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Adding a New University

1. Add the university config to `lib/constants/universities.ts` — include the campus email domain, GPS coordinates, and campus zones.
2. Add a trivia question bank to `lib/constants/uniben-trivia.ts` (follow the existing structure) and register it in `TRIVIA_BANKS`.
3. Vercel redeploy — no other changes needed.

---

## Project Structure

```
app/
  (auth)/          — Login and signup pages
  (onboarding)/    — Multi-step onboarding flow
  (protected)/     — Authenticated app (discover, radar, chat, profile)
components/
  onboarding/      — Bio wizard phase components
  verification/    — Liveness modal, Hyper-Captcha modal
  ui/              — shadcn/ui primitives
db/
  schema.ts        — Drizzle table definitions
lib/
  auth.ts          — JWT helpers
  constants/       — Interests, universities, trivia banks
  validations/     — Zod schemas for onboarding data
```
