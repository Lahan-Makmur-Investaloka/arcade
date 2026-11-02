# SEJUTA POIN

Single-player quiz, 15 levels, original TEKAD presentation. 300 questions (100 per difficulty), with primary-source links for factual questions and worked explanations for original reasoning questions. Canonical answer is options[0] in the server-only bank. Never import the bank or engine from a client component.

## Rules

- Five questions each at easy / medium / hard, randomly selected without repeats in a run.
- Deadlines: 15 / 20 / 25 seconds. Server opens the question and establishes the deadline; network transit counts toward that deadline. Client displays server time against a monotonic local clock.
- Review screens have no deadline; the next question opens only when requested.
- Point ladder ends at 1,000,000. Correct levels 5 and 10 secure 1,000 and 32,000. Wrong or timeout returns the secured amount; voluntary exit banks the current amount.
- Each helper is single-use per run and grants +5 seconds on successful activation (not on opening the helper details). Adelia grants a fresh base duration plus 5 seconds. Timmy removes up to two remaining wrong options; Eldric reveals a authored clue; Kirana produces explicitly simulated, potentially wrong percentages; Adelia replaces with an unseen same-tier question, clears current effects and resets its deadline; Dylan arms one extra attempt, preserving the deadline.
- Server accumulates time spent on all attempted questions, including replacements and failed questions. Idle review time does not count.
- Leaderboard uses each device identity's best finished score, then furthest opened question, then shortest elapsed answering time. Reached question counts distinct original deck IDs in seen; helper replacements do not increase it. This derives progress for existing sessions too. Names are display labels, not reserved accounts. This is a casual arcade identity, not employee authentication.

## Persistence and security

`quiz_sessions` is isolated from other game tables. A partial unique index permits only one unfinished run per device identity. Device secret is generated with Web Crypto and stored locally; only its SHA-256 hash is stored in D1. Losing browser storage loses access to that identity. Keys are never returned in responses.

Every mutation uses a revision compare-and-swap. Requests from stale tabs return the latest public state. Retrying start resumes an unfinished game. Resuming an expired question applies its timeout. Only the server calculates scores. Client state is presentation only; answers, deck, and future questions are excluded from active responses. Refresh, tab switch, or disconnect never resets the timer. A lost response is recoverable with sync.

Timed play discourages searching but cannot guarantee prevention of external assistance. The answer bank is not shipped to the browser.

## Verification

Run `node --test tests/quiz.test.mjs` for bank invariants and game rules. Run `node --experimental-strip-types --test tests/quiz-api.test.mjs` on a recent Node supporting node:sqlite for real SQL / route integration, including concurrent duplicate answers. No browser QA was performed for this change.

Migration `0006_quiz_sessions.sql` is schema-only; old migrations are unchanged. Snapshot and SQL were authored to match schema because drizzle-kit was unavailable locally. SQLite schema and constraints were exercised in integration tests.

Question expansion 2 appends IDs qw-151 through qw-300: 90 sourced factual questions and 60 original reasoning questions. Existing question IDs and content are retained for persisted sessions.

SEJUTA POIN is served at /sejuta-poin; /tangga-wawasan redirects for existing links. Device/session storage keys remain unchanged. The generated stage background is public/quiz/stage.webp. Helper entrance feedback appears only when a successful response adds a used helper; it never changes server deadlines. CSS supports reduced-motion preferences.
