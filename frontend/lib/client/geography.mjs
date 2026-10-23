/** Construct illustrative state cells from fixed sites. Boundaries are a fictional map, not real surveyed geography. */
// Voronoi state boundaries clipped to an invented country outline.
const countryOutline = [
  [150, 35],
  [260, 17],
  [385, 40],
  [430, 75],
  [502, 105],
  [540, 175],
  [523, 265],
  [552, 310],
  [491, 385],
  [408, 410],
  [335, 428],
  [245, 409],
  [172, 378],
  [115, 310],
  [96, 230],
  [113, 125],
];
const stateSites = [
  [181, 77],
  [242, 66],
  [155, 126],
  [211, 127],
  [273, 117],
  [257, 170],
  [334, 73],
  [399, 92],
  [320, 127],
  [376, 145],
  [449, 137],
  [474, 190],
  [139, 194],
  [186, 181],
  [146, 247],
  [199, 231],
  [185, 284],
  [239, 275],
  [285, 215],
  [297, 173],
  [338, 184],
  [343, 230],
  [320, 265],
  [266, 252],
  [409, 213],
  [464, 243],
  [389, 269],
  [437, 302],
  [495, 319],
  [383, 322],
  [237, 332],
  [287, 320],
  [277, 380],
  [339, 367],
  [395, 385],
  [453, 365],
  [309, 222],
];
function clipStateCell(polygon, site, other) {
  const a = other[0] - site[0],
    b = other[1] - site[1],
    c = (other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2) / 2;
  const value = (p) => a * p[0] + b * p[1] - c;
  const output = [];
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i],
      q = polygon[(i + 1) % polygon.length],
      vp = value(p),
      vq = value(q),
      insideP = vp <= 1e-8,
      insideQ = vq <= 1e-8;
    if (insideP) output.push(p);
    if (insideP !== insideQ) {
      const t = vp / (vp - vq);
      output.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return output;
}
const stateBoundaries = stateSites.map((site, i) =>
  stateSites.reduce(
    (poly, other, j) => (j === i ? poly : clipStateCell(poly, site, other)),
    countryOutline.map((p) => [...p]),
  ),
);
export { stateBoundaries, stateSites };
