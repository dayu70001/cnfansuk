export type GalleryDirection = -1 | 1;

export function clampGalleryIndex(index: number, itemCount: number): number {
  if (itemCount <= 0 || !Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(Math.trunc(index), itemCount - 1));
}

export function getAdjacentGalleryIndex(
  index: number,
  direction: GalleryDirection,
  itemCount: number,
): number {
  return clampGalleryIndex(index + direction, itemCount);
}

export function getNearestGalleryIndex(scrollLeft: number, snapOffsets: number[]): number {
  if (!snapOffsets.length || !Number.isFinite(scrollLeft)) return 0;

  return snapOffsets.reduce((nearestIndex, offset, index) => {
    const nearestDistance = Math.abs(snapOffsets[nearestIndex] - scrollLeft);
    const distance = Math.abs(offset - scrollLeft);
    return distance < nearestDistance ? index : nearestIndex;
  }, 0);
}
