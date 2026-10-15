export function projectFloor(corners, u, v) {
  const [tl, tr, br, bl] = corners;
  const w = (a, b, c, d) => (1 - u) * (1 - v) * a + u * (1 - v) * b + u * v * c + (1 - u) * v * d;
  return [w(tl[0], tr[0], br[0], bl[0]), w(tl[1], tr[1], br[1], bl[1])];
}

export function unprojectFloor(corners, lng, lat) {
  let u = 0.5;
  let v = 0.5;
  for (let i = 0; i < 12; i++) {
    const [x, y] = projectFloor(corners, u, v);
    const ex = lng - x;
    const ey = lat - y;
    if (Math.hypot(ex, ey) < 1e-12) break;
    const eps = 1e-6;
    const [xu, yu] = projectFloor(corners, u + eps, v);
    const [xv, yv] = projectFloor(corners, u, v + eps);
    const dxdu = (xu - x) / eps;
    const dydu = (yu - y) / eps;
    const dxdv = (xv - x) / eps;
    const dydv = (yv - y) / eps;
    const det = dxdu * dydv - dxdv * dydu;
    if (!det) break;
    u += (ex * dydv - ey * dxdv) / det;
    v += (dxdu * ey - dydu * ex) / det;
  }
  return [u, v];
}
