# Timmy anime 2.5D trial — 5 October 2026

User approved "Coba 2.5D" after rejecting the stage-6 procedural Timmy. Opened latest v151, source `844487a378cdf8fcf2332f4044b6a5a46bf1c76c`. This change is confined to the Harbor actor, asset-loading readiness and its intro label. Existing Neon, Big Two, other games, physics and course are preserved.

## Implemented

- Generated original adult-anime Timmy in cobalt/navy racing outfit with black swept hair and glasses, seated in his cobalt kart. Eight rendered directions in one transparent atlas.
- Camera-relative billboard with eight azimuth sectors and 4° hysteresis; rear/front/side mapping uses actual camera position, not ambiguous view names.
- Inspected per-view alpha bounds, with UV gutters rather than a blind equal-grid crop. Constant 2.3m image height, aspect-preserving width and ground-anchored tires. No double-rendered 3D character.
- Bounded lean/bob, grounded shadow and existing boost/existing scene drift effects; reduced motion removes lean/bob/boost plume.
- Loading must complete before starting; image failure offers the existing retry/Neon path. Late callbacks cannot revive disposed scenes. Atlas disposed with the runtime.
- Existing procedural files/art remain available for reversibility but are no longer imported by Harbor runtime.

## Asset provenance

Built-in imagegen via one asset-only agent, using prior original Timmy anime concept and `public/big-two/art/timmy-play.webp` as identity references. No commercial character or ripped model used. No Bu Cita.

Published asset: `public/racing/timmy-anime-atlas-v1.webp`, 1536×1024 RGBA, 290,710 bytes. Converted from generated PNG with Sharp, quality 92 / alpha quality 100; no artwork repainted. Source atlas has alpha-zero background and isolated silhouettes. Faint alpha-1 stray pixels are rejected by runtime alphaTest 0.5. Original first pass had touching silhouettes and was not shipped; a targeted spacing correction isolated all eight sprites. Asset is not a 3D mesh.

Original art brief requested cel-shaded anime identity, matching kart, 15° elevated turntable views rear, rear-quarter, side, front-quarter, front and opposite sides. Actual generated view positions are explicitly mapped in `anime-frames.ts` rather than relying on prompt labels. Exact final corrective edit prompt:

```text
Use case: precise-object-edit.
Input image 1 is the EDIT TARGET: existing 8-view Timmy kart sprite atlas.
Change ONLY sprite spacing and background cleanup. Preserve the exact same eight drawings, camera views, positions/order, adult anime Timmy identity, face, black swept hair, rectangular glasses, navy/cobalt racing suit, cobalt kart geometry, colors, cel-shading style, and every design detail. Do not redesign anything.
SHRINK every existing driver+kart drawing to 75% of its current size, then center each entire complete object in its own equal 384x512 cell on a 1536x1024 transparent PNG canvas: 4 columns and 2 rows. All eight objects must now be visibly smaller with broad transparent gutters. Keep wheel bottom baseline consistent within each row. Each sprite must be no wider than 300px and no taller than 300px. Every object must have at least 40px transparent space on its left and right, and at least 80px transparent space above and below. No wheel, bumper, body part, hair, outline, or other silhouette may cross any cell boundary. Do not crop anything at the edges of the canvas. Restore the complete outer edge of the bottom-right sprite if needed.
REMOVE ALL background haze and environmental glow: genuine zero-alpha transparency outside only the eight crisp sprite silhouettes. No cast shadows, no backdrop, no gradients, no checkerboard pixels, no floor. The sprites themselves remain opaque with antialiased clean edges. No extra sprites, no text, no labels, no grid. This is a production directly-sliceable 4x2 sprite sheet; separation and containment are the ONLY correction.
```

The generator did not follow equal-cell measurements exactly, so integration uses inspected per-sprite bounds. Final WebP check: no alpha>127 pixels touch any crop edge in all eight frames.

## Verification and limitations

- Scoped TypeScript compile passes.
- Real Three geometry/math checks: all eight directions, angle wrap/hysteresis, camera facing under rotated parent, ground anchoring, bounded mesh count, UV bounds and visible quad framing across seven phone/desktop aspect ratios.
- Real React + Three with mocked WebGL transport: blocks invisible-kart starts, loads atlas, handles failed texture/retry/context loss, pause/resume, held keyboard/touch sources, drift/boost/recovery and disposal/late callback cleanup. This is **not GPU QA**.
- Existing Harbor physics/drift regression tests pass unchanged.
- Actual managed browser/GPU QA unavailable because required control-browser skill is not exposed. No phone FPS, actual screenshot or human art approval claimed.

Eight still angles remain visible as discrete transitions. Hands, face and wheels do not have independent animation; steering lean is whole-actor motion. Lighting is illustrated rather than dynamically relit. This trial must be reviewed in the actual game before further cast/animation work. Do not call it Genshin-quality, a complete animated character, or completion of stage 6.
