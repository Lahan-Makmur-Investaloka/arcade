// Physical dimensions shared by the track renderer and collision resolver.
export const HARBOR_BOUNDS = Object.freeze({
  barrierOffset: 2.2,
  barrierThickness: .35,
  barrierHeight: .85,
  kartHalfWidth: 1.14,
  kartHalfLength: 1.65,
  contactMargin: .12,
});

export function kartLateralExtent(heading: number) {
  return Math.abs(Math.cos(heading)) * HARBOR_BOUNDS.kartHalfWidth
    + Math.abs(Math.sin(heading)) * HARBOR_BOUNDS.kartHalfLength;
}

export function barrierInnerEdge(width: number) {
  return width / 2 + HARBOR_BOUNDS.barrierOffset - HARBOR_BOUNDS.barrierThickness / 2;
}

export function kartCenterLimit(width: number, heading: number) {
  return barrierInnerEdge(width) - kartLateralExtent(heading) - HARBOR_BOUNDS.contactMargin;
}
