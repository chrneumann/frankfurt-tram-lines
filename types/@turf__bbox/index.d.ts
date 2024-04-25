declare module "@turf/bbox" {
  declare function bbox(geojson: any): BBox;
  export default bbox;
}

declare module "@turf/centroid" {
  declare function centroiddd<P = Properties>(
    geojson: AllGeoJSON,
    options?: {
      properties?: P;
    },
  ): Feature<Point, P>;
  export default centroiddd;
}
