export function isStacked(root: {
  body?: { classList?: { contains(name: string): boolean } };
  getElementById?(id: string): { hidden?: boolean } | null;
} | null): boolean;

export function legCamera(desk: boolean): {
  pitch: number;
  maxZoom: number;
  zoomTrim: number;
  usePadding: boolean;
};

export function controlRects(opts: {
  width: number;
  height: number;
  sheetCover?: number;
  floors?: number;
  desk?: boolean;
}): {
  zoom: { x: number; y: number; w: number; h: number };
  floors: { x: number; y: number; w: number; h: number };
  compass: { x: number; y: number; w: number; h: number };
};

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

export function strokeBoxes(
  points: { x: number; y: number }[],
  thickness?: number,
  step?: number,
): { x: number; y: number; w: number; h: number }[];

export function placeChip(
  anchor: { x: number; y: number },
  size: { w: number; h: number },
  bounds: { left: number; top: number; right: number; bottom: number },
  avoid?: { x: number; y: number; w: number; h: number }[],
): { x: number; y: number } | null;

export function firstClearChip(
  anchor: { x: number; y: number },
  sizes: { w: number; h: number }[],
  bounds: { left: number; top: number; right: number; bottom: number },
  avoid?: { x: number; y: number; w: number; h: number }[],
): { x: number; y: number; w: number; h: number } | null;

export function routeFrame(points: { x: number; y: number }[]): { x: number; y: number }[];
