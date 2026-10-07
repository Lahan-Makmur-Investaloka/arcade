# Compact menu and sound defaults — 2026-10-06

Removed character switching, expression preview, separate pause action, volume sliders and repeated instructions from the in-game menu. Menu itself pauses the round. Retained Resume, Sound, Music, Motion, confirmed New Round, and Lobby. Character selection lives in the lobby.

Sound/music default ON in portrait and Classic. Preferences migrate once to v2, keeping volumes and motion but enabling sound/music as requested; subsequent explicit OFF choices are respected. Portrait unlocks audio on a genuine pointer gesture; browser autoplay restrictions remain respected. Muted history is never replayed.

Validated strict TypeScript, 11 portrait/atmosphere tests, browser menu controls/defaults and production build. Browser screenshot: menu-v168.jpg.
