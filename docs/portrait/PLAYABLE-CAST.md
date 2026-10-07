# Five playable characters

Adds Timmy and Dylan opponent-expression atlases and first-person hand costume atlases for Eldric, Kirana, Adelia, and Dylan. Timmy retains the approved hands-v3 geometry and appearance.

All five identities can be selected in the portrait menu. Selection is a draft until the user presses "Mulai ronde sebagai …", which visibly starts a new round. The selected identity persists separately from the existing engine save. Existing saves without a player key retain Timmy. There are still exactly four seats: the chosen player and the next three identities in the ordered cast, without duplicates.

All five characters are available in the expression preview, independently of the current seats. The thirty previews pause the existing round. Portrait expressions follow the same live hand-count and action rules. Skills remain deferred.

Hands use character-specific atlas, grip anchors and foreground thumb masks. Rear hands and foreground thumbs remain mounted together throughout release/return, preserving the prior animation synchronization fix. Empty-hand behavior remains unchanged.

Tests: seven portrait tests passed, including all thirty previews, frozen game state, switching through the four new player identities, thirteen-card new deals, saved identity, and remount restoration as Dylan. Visual asset verification follows integration.

Visual QA: browser preview inspected all four new POV costumes, Timmy normal/anxious and Dylan normal/anxious portraits. Checked 390×844 and 320×568 layouts including scrollable character menu. Kirana, Adelia and Dylan release/return harness samples reported 0.00px difference between rear-hand and thumb-layer origins (12, 6 and 8 sampled frames respectively). This verifies layer synchronization, not anatomical segmentation; contour offsets are approximate and native-device testing remains outstanding.

Asset integration: six generated RGBA atlases converted to WebP, per-character grip/thumb offsets applied from recorded metadata. Timmy/Dylan use CSS tile-edge clipping and baseline normalization. Generation did not preserve exact sleeve silhouettes; hand geometry remains close to the approved base. Strict targeted TypeScript check and seven portrait tests passed after integration.
