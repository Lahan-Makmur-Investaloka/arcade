# Opponent expressions

Extend the portrait table's six-pose system from Eldric to the two existing opponent seats: Kirana and Adelia. Timmy remains the first-person player. Dylan is not added to the four-player table in this change.

Each opponent uses a 3×2 transparent atlas with normal, choose, play, anxious, smug, pass in row-major order. The same pose priority and hand-count rules govern all three. All three atlases preload before gameplay begins; the existing retry UI handles asset errors.

The expression preview now has a character selector and six pose buttons. It pauses the game while inspecting any of the 18 character/pose combinations and resumes the existing round on exit. Opening preview starts with the current focused opponent.

Kirana and Adelia costumes and facial identities reference their existing card-game artwork. Adelia keeps her lavender hijab. Eldric artwork and the player-hand layers are preserved. Prompt provenance is recorded beside this document.

Automated verification: all six portrait tests pass, including all 18 opponent previews, stable game sequence during previews, and one bot action after resume. Targeted strict TypeScript check passes.

Browser QA: all six Adelia poses inspected at 390×844; all six Kirana poses inspected across 390×844 and 320×568. Preview character/pose controls remain usable on the compact screen. Per-character CSS scale and row offsets align torso baselines to the table; a narrow tile clip contains hair at cell boundaries. Generated atlas alpha is retained in WebP exports (Kirana 610,294 bytes; Adelia 370,542 bytes). The frame sampler and previous hand geometry remain unchanged. Physical Safari/iPhone testing was not performed.

Screenshots: kirana-expressions-browser.jpg and adelia-expressions-browser.jpg.
