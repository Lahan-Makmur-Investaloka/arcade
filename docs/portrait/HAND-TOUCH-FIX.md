# Hand and touch correction

The previous polygon mask created visible diagonal cuts across both hands. Removed the artificial front/back split and now use the intact transparent illustration with a smaller scale and shallower grip. No new artwork was generated.

Main fan maximum increased from 110 to 132 degrees; selected fan from 52 to 64. Pivots adjusted to retain all card corners inside widths 320–460. The hand surface accepts press/slide/release, shows a larger card preview during the gesture and suppresses the compatibility click to avoid selecting twice. Direct index taps retain their exact target even while layout transitions are in progress. Pointer cancellation clears preview without selection.

Verified 13-card and five-selected-card views at 320×568 and 390×844. Real browser clicks across 10 diamond, 10 heart, J club, Q diamond and K spade selected the correct five. Five automated portrait tests cover geometry, nearest-index selection, pointer release/click deduplication, cancellation, play/menu and expressions. Scoped TypeScript passed. This is browser and event-handler testing; physical phone touch hardware was not tested.
