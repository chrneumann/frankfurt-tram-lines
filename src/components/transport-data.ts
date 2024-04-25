import { useEffect, useState } from "react";
import type { Position, Geometry } from "geojson";

/**
 * Returns an id for the given transport line based on number, from and to
 * fields.
 */
export function transportLineId(line: TransportLine): string {
  return `${line.number}${line.from}${line.to}`;
}

/**
 * A tram station.
 */
export type Station = {
  id: number;
  name: string;
  // Centroid used as the station's position.
  position: Position;
};

/**
 * Represents a transport line.
 */
export type TransportLine = {
  number: number;
  // Departure location.
  from: string;
  // Destination location.
  to: string;
  // The route (as MultiLineString).
  geometry: Geometry;
  // The station ids of the stops.
  stations: number[];
};

/**
 * Transport line information received from the server.
 */
export type TransportData = {
  stations: { [nodeId: number]: Station };
  lines: TransportLine[];
};

export function useTransportData(
  transportDataURL: string,
): null | TransportData {
  const [transportData, setTransportData] = useState<null | TransportData>(
    null,
  );

  // Fetch the transport data.
  useEffect(() => {
    (async () => {
      const response = await fetch(transportDataURL);
      const json = (await response.json()) as TransportData;
      setTransportData(json);
    })();
  }, []);
  return transportData;
}
