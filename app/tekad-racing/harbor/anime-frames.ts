// Inspected alpha bounds, with a 2px gutter. Atlas artwork isn't a uniform grid.
// Order is CAMERA position in kart space (forward is +Z): rear, -X rear,
// -X side, -X front, front, +X front, +X side, +X rear.
// A camera on -X sees the nose pointing screen-right, not screen-left.
export const ANIME_ATLAS_SIZE=[1536,1024] as const;
export const ANIME_FRAMES=[
  [26,158,312,298],
  [371,158,368,310],
  [781,602,361,294],
  [397,591,374,316],
  [22,594,344,304],
  [1165,159,352,316],
  [759,169,389,289],
  [1168,597,350,305],
] as const;
