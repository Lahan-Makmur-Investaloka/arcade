import type { IcePlatform } from './frost-world';

// Normal jump peaks below 112px; Eldric clears 150px even at 30fps.
export function highHeroSection(start: number, floor: number, astral: boolean) {
  const style = astral ? { biome: 'astral' as const } : { ice: 'solid' as const };
  const platforms: IcePlatform[] = [
    { x: start, y: floor, w: 320, h: 570-floor, ...style },
    { x: start+360, y: floor-150, w: 360, h: 720-floor, ...style },
    { x: start+760, y: floor, w: 360, h: 570-floor, ...style },
  ];
  return { platforms, end: start+1120, floor };
}

export function kiranaBossSteps(left: number, floor: number) {
  // Two little upper routes, reachable from each arena's existing steps.
  return [350, 480, 850, 980].map((offset, i) => ({
    x: left+offset, y: floor-(i%2 ? 290 : 235), w: 86, h: 16,
    require: 'kirana' as const,
  }));
}
