# Capsa Banting / Big Two

User brief: four substantial stages, minimum 30 minutes per stage, high emphasis on original assets, visual detail and animation. Continue the existing TEKAD Arcade; do not rebuild. Use Timmy, Eldric, Kirana, Adelia and Dylan. No Bu Cita. Visual reference is a stylish anime RPG: strong red/black/ivory, angular composition, expressive original cast. Do not copy franchise characters or logos. Copy must stay short and natural.

## Stage 1 — foundation and bot play

Route: `/big-two`. Added to the existing Arcade card grid with the same menu treatment.

- Pure shared TypeScript rules engine: all 52 cards, 4 players, 13-card hands, opening 3♦, 1/2/3/5-card combinations, correct same-size comparison, three-pass reset, terminal winner, zero-sum scores.
- Explicit house rules in the native help dialog. Ranks 3 through 2; suits diamonds/clubs/hearts/spades. Clockwise. A2345 lowest straight, 23456 next, TJQKA highest; no wrapping. Flush suit first. Four-of-a-kind requires a fifth card. No bombs overriding other sizes.
- Three bots choose from their own hand, public table and public opponent counts. No access to opponents' card identities through the bot API.
- Five-character selector, hand sorting by rank/suit, cycling legal suggestions, selected-combination validation, play/pass, recent move history, result scoring and replay.
- Device-local saved practice round; recoverable when returning to lobby/reloading. No claim of cloud sync or human multiplayer yet.
- Bot timers pause when document is hidden or a menu is open. Duplicate action guard. Native dialog focus handling. Sound off by default; user-initiated synthesized card/combination effects.
- Seven NEW generated originals: cast cover, rooftop lounge and five individual character illustrations. Optimized WebP derivatives in `public/big-two`. Prompt provenance in `docs/big-two-art.json`.
- Card deal flight animation, individual card arrival, selected-card lift, table slam, 5-card/win cut-ins, native result dialog. Honors reduced-motion preferences.
- Mobile hand uses two rows with visible faces; smallest screens use six columns. Desktop uses overlapping cards. All rules remain deterministic and separated from UI for stage 2 reuse.

Validation: targeted strict TypeScript check, 11 engine tests including 100 complete seeded bot rounds, React DOM interaction exercise for character selection, modal controls, deal, play, save/resume and bot pause. Browser rendering QA unavailable in the current environment (control-browser skill not exposed); do not claim browser screenshots or device testing.

## Stage 2 — real multiplayer rooms

Implemented create/join six-character room codes for four human seats. Existing practice mode and seven original artwork assets are preserved.

- Illustrated four-seat lobby, unique character selection, ready controls, invitation sharing, host deal/kick controls, cumulative room scores and rematch.
- Server-authoritative secure shuffle and validation. D1 stores room state; each request receives only its own hand, public played cards and opponent counts. A random 256-bit guest seat capability is hashed on the server, saved on that device and never included in invitation links.
- Atomic compare-and-swap room revision; bounded idempotent action receipts prevent duplicate play or score changes. An uncertain network response retries the exact same request. Rate limits, bounded request bodies, origin checks, fixed 24-hour expiry and indexed cleanup.
- Adaptive visibility-aware 1.5-second polling, online/offline status, refresh/reconnect to the same hand and temporary table exit. No WebSocket, spectator mode, public matchmaking or automatic bot takeover.
- Host takeover after 60 seconds offline; host can cancel a stalled round after another player is offline for 60 seconds without changing scores. Players cannot empty a seat mid-round. Rematches require all four players ready again.
- Existing card animations, sound preferences, hand controls and result dialog shared between practice and online. Opponent UI uses unknown local placeholders for card counts, never actual hidden cards.

Stage 2 validation: targeted TypeScript check; 11 existing engine tests (100 full seeded rounds); five multiplayer API integration scenarios covering three complete four-client rounds, secrecy, duplicate and simultaneous actions, stale turns, reconnect, host transfer, cancellation, replacements, expiry and hostile inputs. Optional React/linkedom integration harness exercises create, ready after a lost response, deal, play, resume and joining an invitation with a different saved room. This is not browser/device layout QA; browser rendering remains unverified in this environment. Schema-only migration 0007 adds room and rate-limit tables without altering existing games.

Server must own shuffle, turn order, hand validation and game transitions. Never send full Game.hands to a multiplayer client. Public view exposes counts and played cards; private view exposes only authenticated seat hand. Bind a strong random seat secret to a room, never just nickname. Use secure RNG on server. State mutation needs optimistic revision checks, idempotent request identifiers, per-action authorization and atomic writes. Reconnect must restore private hand without granting another seat. Verify a concurrent stale play cannot apply twice. Reuse Sites D1 declarations and persistence guidance before database edits.

## Stage 3A — original artwork and card design

The user approved splitting stage 3 into 3A (assets) and 3B (motion/audio), each with at least 30 minutes of substantive work. Current pass extends version 133; no gameplay rules, room protocol or other Arcade games are being redesigned.

- Ten new original identity-preserving illustrations: a card-play pose and a victory pose for each of Timmy, Eldric, Kirana, Adelia and Dylan. Generated from the published cast references; no franchise characters or stock portraits. Original portraits and group cover remain available.
- Three original court illustrations: Eldric as J, Adelia as Q, Timmy as K. Reused consistently across all four suits. The actual rank/suit indices remain precise live text and are never baked into the generated art.
- Original ornamental two-way card back and oxblood felt/leather table texture. The same back is used for opponent hands, the dealing deck and flying cards; no hidden card identities are exposed.
- New selected-character composition on the existing start screen, play poses in room seat panels and existing combo cut-ins, matching victory pose on the result screen. Existing Arcade tile treatment is preserved.
- Responsive 240/480/768px portrait assets, optimized WebP with preserved transparency, clear card corners above the art. Mobile hand uses horizontal rank/suit indices to reserve the lower face for illustration; results preserve a visible character panel. The 15 new originals produce 35 optimized files totaling 4.19 MB; browsers select sizes per display slot, not all at once. Likely winners are preloaded only as their remaining hand reaches five cards.
- Generation prompts and export details are retained in `docs/big-two-stage3a-art.json`. New published assets are under `public/big-two/art/`.

Validation passed for all 52 card identities, asset completeness/size, character selection and each cast rotation's victory screen, plus the existing multiplayer create/ready/play/reconnect flow. A strict targeted TypeScript check also passed. Browser/device layout QA is unavailable because the managed browser skill is not exposed; do not claim screenshots or physical-device verification.

### Stage 3A correction — mobile card art and clipping

User screenshots exposed two regressions: busy full-body court art compressed into tiny mobile rectangles, and combo portraits enlarged to 240% with negative top margins that cut off faces. The correction replaces the three court illustrations with simpler identity-preserving busts, removes the overlapping TEKAD face wordmark, and contains artwork within dedicated card/banner bounds. Mobile result and selected-character framing also no longer overscale outside their containers. Existing game rules and multiplayer state are unchanged. The supplied screenshots are the visual evidence; browser/device rendering is still unavailable here.

### Original deck and playing-surface redesign

Following the user's second visual review, the lobby is preserved while the playing surface and deck are redesigned. Three newly generated two-headed court panels combine TEKAD identities with original ornamental clothing: Eldric/compass, Adelia/blossom, Timmy/crown and scepter. They use a coordinated black/crimson/gold palette and contained artwork with safe margins; rank and suit stay live UI text. Generation and refinement prompts, exports and hashes: `docs/big-two-original-deck-art.json`.

Numeric cards now have conventional body pips for every rank (2–10), with a central ace and rotated lower pips. All 52 faces are checked for correct identity and exact body-pip count. Desktop hands display the entire face of each card instead of overlapping the illustrations; mobile keeps two compact rows and a fixed action bar above the device safe area. The table is a quieter oxblood surface with inset trim; opponent panels consistently use transparent action art, and selection/giliran controls are less visually heavy. TypeScript, deck/character integration, multiplayer client flow and built-worker checks validate the changes. Browser/device visual QA remains unavailable; no claim of device verification.

### Visual polish — larger courts, aces, closeups and controls

The next user review approved the original J/Q/K drawings but requested much larger artwork, designed number/ace faces, closer combo portraits and stronger buttons. Court framing now uses 2% inset with per-illustration scaling; K receives a smaller scale increase to preserve its crown. Classic number-pip counts remain exact. Four new engraved ace emblems and five dedicated transparent closeup portraits replace the plain ace and distant full-body combo composition. The in-match command bar now has angular silhouettes, custom icons, differentiated primary/secondary actions, selected-card count and explicit keyboard/disabled states. The lobby is preserved.

The targeted art/client tests and five-character interaction audit pass. Animasi OFF now removes the new banner at render time and through CSS. A static cascade audit covers eight viewport targets; browser/device rendering remains unverified. See `BIG_TWO_VISUAL_AUDIT.md` for evidence and limits and `big-two-polish-art.json` for asset provenance. This is an incremental visual/motion correction, not completion of the whole Stage 3B scope.

## Stage 3B — motion and sound

Implemented on top of the approved version 140 art/layout. Cards travel from the acting seat or the player's measured hand positions to their actual table slots. Five-card moves use a short stagger; the impact and character cut-in follow arrival. Remaining hand cards settle into their new positions, including sorting while a table flight is still active. The three-pass reset sweeps only the previously public table cards away. Deal backs travel to all four seats; result portrait and scoreboard have short staggered entrances. No flashing or full-screen shake.

The presentation layer observes committed public moves without controlling rules or blocking the next valid action. Duplicate revisions, initial/resumed snapshots, skipped sequences, different rounds, hidden-tab moves and moves made behind an open menu do not replay. Turning off effects, resizing, scrolling, disconnecting or leaving cleans up active decoration. Reduced-motion users receive current game state and audio cues without spatial animation. Browser animation API failure falls back to static cards.

Reworked optional Web Audio effects for selection, deal, pass, card impact, five-card combinations, turn and win. Added an original eight-bar 104-BPM instrumental lounge groove with bass, soft keyboard tones, percussion and a sparse lead. It is synthesized locally without external samples or requests. Audio and music default off; an explicit user gesture is required to unlock sound. Music is separately selectable, with independent effect/music volume controls and saved device preferences. Menus pause the music; hidden tabs suspend audio; mute/zero music volume stop the scheduler; leaving disposes resources. See `BIG_TWO_STAGE3B_AUDIT.md` for validation and limits.

## Stage 4 — multiplayer reliability and mobile refinement

Implemented reliability fixes and mobile refinements after API and four-client React audits. Temporary exit now respects the one-minute grace period; result-screen host recovery, stale-response rejection, authenticated permission errors, persistent retry feedback and revision-bound room confirmations are repaired. Long names and tall results remain reachable, room touch targets are enlarged and short landscape screens retain the action bar. See `BIG_TWO_STAGE4_AUDIT.md` for exact scenarios, outcomes and limits. Direct physical-device/browser visual and audio review remains unverified because the managed browser-control skill is unavailable.

Rules reference: https://www.pagat.com/climbing/bigtwo.html (consulted 2026-10-04). TEKAD chooses the explicitly listed variant above; no claim of a single universal Capsa ruleset.
