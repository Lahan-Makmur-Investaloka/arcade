# Stage 6 — Timmy and his cobalt kart

Continues v150 (`682b78cf754f7f8e06149190b56d76225923597c`) in the existing Harbor route. Replaces the stage-2 box/capsule/cone blockout with an original procedural model. This is stylized game geometry, not a generated picture presented as a 3D model, a licensed stock character, or a claim of commercial-console art quality.

## Design and implementation

Timmy retains black hair, rectangular glasses and the blue identity seen in the existing Racing sprite. New features include a single tapered face surface, visible brown eyes, curved swept hair locks, ears/nose/mouth, tailored blue suit, gloves and seated legs. Shoulder patches were flattened and eyes narrowed after inspecting the initial model from three directions.

The kart uses a curved nose shell and matching curved UV surface, side pods, vents, alloy chassis tubes, sculpted tire profiles, five-spoke rims, matte rubber tread marks, padded seat, steering wheel, cooling fins, exhaust and rear aerofoil. Original cobalt/ivory/cyan artwork maps to the hood surface. Rear lamps and turbo exhaust still react to driving state.

Rigid geometry is batched by material within each pivot. Wheels, chassis, head, driver, arms, eyes and steering wheel remain separately addressable for stages 7–8. Hand contact during animated steering and face/reaction animation are still stage-7/8 work; the current version retains the prior driving lean and wheel animations.

The start screen uses an actual front three-quarter world camera, then returns to the established chase camera on start. Its phone panel was shortened to expose the model. It is not a rendered promotional still.

## Asset provenance

- Runtime artwork: `public/racing/timmy-livery-v1.webp`, 512 × 512, 24,746 bytes. Derived by resizing/compressing one built-in ImageGen output, with no content repainting.
- Model source: `app/tekad-racing/harbor/timmy-model.ts` and `kart-geometry.ts`; animation adapter remains `kart.ts`.
- ImageGen prompt: “Use case: stylized-concept. Asset type: ONE square game-ready diffuse/decal raster livery texture for TEKAD Racing Timmy's cobalt-blue kart front hood. Flat orthographic artwork only. Elegant motorsport graphic in deep cobalt blue with two broad ivory/light cyan racing stripes converging toward lower center, small ORIGINAL geometric shield/chevron badge centered upper-middle, a subtle dark navy panel line, crisp restrained shapes. No text, no numbers, no letters, no borrowed logos, no rendered kart, no perspective, no shading, no lights, no scene. Entire canvas artwork edge-to-edge opaque blue. It will map to a small curved 3D hood; big readable markings essential, not tiny detail. Generate exactly one image.”
- One asset-only agent generated the raster outside the checkout. The site owner inspected, converted and integrated it. No Nintendo or other game assets are used.

The livery loads independently; the cobalt fallback material remains playable if the image fails. Texture disposal and late image completion are guarded so leaving/retrying the scene cannot attach a texture to a discarded model.

## Geometry inspection

`docs/assets/timmy-model-inspection-v1.png` is a CPU projection of actual model geometry with approximate diffuse lighting and the real livery. It was inspected from front, side and rear. **It is not a WebGL screenshot**, does not reproduce production PBR/shadows, and cannot approve GPU appearance or device performance.

Visible model: 55 mesh batches, 55,840 triangles, 16 materials. The complete world-plus-kart scene is 100 mesh batches, compared with 115 before the change, excluding the unchanged separately pooled effects. Fewer batches do not imply measured FPS improvement: triangle count and initialization cost increased. Mobile performance remains a later measured gate.

## Verification

- 26 model/physics/drift/camera checks passed. New checks cover geometry budgets, finite attributes, outward hood normals, UV range, preserved animation pivots, actual livery material assignment, and ready-view framing/occlusion across eight aspect ratios.
- Existing 5,184 chase-camera pose projections and 4,000 moving observations pass with the new geometry. Worst horizontal magnitude is 0.941 statically and 0.902 while moving (viewport edge is 1). Actual boosted model/exhaust framing passes too.
- Shared collision-footprint checks pass without changing collision dimensions. Baseline simulated three-lap time remains 104.20 seconds.
- React integration, using actual Three geometry with mocked GPU/image transport, passed driving controls, drift, pause, recovery, retries, livery loading, texture cleanup and late callback rejection.
- Scoped strict TypeScript compilation passed. Production build and publication are recorded with this Sites version.

## Outstanding quality gates

The required control-browser capability remains unavailable. No real phone FPS, browser screenshot or human driving-feel approval is claimed. Stages 7–8 still need to make the actor more expressive and natural in motion. The stage-5 driving-feel gate and stage-6 real-render art review remain open; implementation completion does not close those gates.
