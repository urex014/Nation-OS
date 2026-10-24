/** A simple equirectangular display projection. The source remains the unmodified GeoJSON. */
export function geometryPath(geometry) {
  const project = ([longitude, latitude]) => [
    (longitude - 2.4) * 46 + 12,
    (14 - latitude) * 46 + 12,
  ];
  const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
  return polygons
    .flatMap((polygon) =>
      polygon.map(
        (ring) =>
          ring
            .map((coordinate, index) => {
              const point = project(coordinate);
              return `${index ? "L" : "M"}${point[0].toFixed(1)},${point[1].toFixed(1)}`;
            })
            .join("") + "Z",
      ),
    )
    .join("");
}
