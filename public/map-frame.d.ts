export function framePad(opts: {
  width: number;
  height: number;
  desk: boolean;
  stacked: boolean;
  panelRight: number;
  sheetCover: number;
}): { top: number; left: number; right: number; bottom: number; width: number; height: number };

export function freeRect(
  pad: { left: number; top: number; right: number; bottom: number },
  width: number,
  height: number,
): { left: number; top: number; right: number; bottom: number };

export function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean;

export function placeChip(
  anchor: { x: number; y: number },
  size: { w: number; h: number },
  bounds: { left: number; top: number; right: number; bottom: number },
  avoid?: { x: number; y: number; w: number; h: number }[],
): { x: number; y: number };

export function routeFrame(points: { x: number; y: number }[]): { x: number; y: number }[];
