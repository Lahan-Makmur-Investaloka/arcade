# Grip and card readability revision

User screenshot showed rank/suit occlusion and hands apparently pinching below the cards. The prior corner-containment test did not test readable indices or physical contact.

- Broader 110-degree main fan and 52-degree selected fan, with slightly larger cards and balanced left/right pivots.
- Each rank/suit index is an independent accessible selection button above the stacked faces. Clicking an exposed index selects that exact card rather than the overlapping front card. Whole visible card faces remain clickable.
- Both hands are composited behind the cards, with thumb/palm portions in front. Grip anchors penetrate the lower 17% of the card rather than touching only its bottom edge.
- Existing artwork, engine, resting moods and action behavior preserved.

Rendered browser checks: full 13-card hand, 12+1 split and 8+5 split, at 390×844 and 320×568. Specifically verified selection of A clubs and 10 hearts from the middle of the stack. Four portrait tests and scoped strict TypeScript check pass. Physical touch-device testing is not claimed.
