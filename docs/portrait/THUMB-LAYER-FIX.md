# Corrected occlusion

Version 157 placed the intact entire hand above the cards, regressing the requested occlusion. This revision restores full hands behind the card fan. Only the thumb region is composited in front using curved, atlas-relative contour clips. These are functional clipping paths, not replacement illustrations. Empty/release hands have no foreground thumb layer. The 132/64-degree fans and pointer gesture handling remain unchanged.

Browser preview checked for neutral 13-card hand, 12+1 split and 8+5 split at 390×844 and 320×568. The face of each card covers palm and rear fingers; only the thumb tip crosses the lower face. Screenshot included. Five existing portrait tests and targeted strict TypeScript pass. No physical-phone verification claimed.
