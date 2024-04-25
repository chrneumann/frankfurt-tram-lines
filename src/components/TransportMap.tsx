import React, { useState, useRef } from "react";
import { MantineProvider } from "@mantine/core";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LngLatLike } from "maplibre-gl";

import { Combobox } from "./Combobox.js";
import { TransportLineLabel } from "./TransportLineLabel.js";
import { transportLineId, useTransportData } from "./transport-data.js";
import { useTransportMap } from "./transport-map.js";

import styles from "./TransportMap.module.css";

type Props = {
  // URL of the transport data JSON file.
  transportDataURL: string;
  // URL of the MapLibre style.
  styleURL: string;
  // Initial center point.
  center: LngLatLike;
};

export function TransportMap({
  transportDataURL,
  styleURL,
  center,
}: Props): React.JSX.Element {
  // The currently selected transport line.
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const mapContainer = useRef(null);
  // Transport data as received from server.
  const transportData = useTransportData(transportDataURL);
  useTransportMap(
    mapContainer.current,
    transportData,
    selectedLine,
    styleURL,
    center,
  );
  return (
    <MantineProvider>
      <div className={styles.root}>
        <div className={styles.map} ref={mapContainer} />
        {transportData && (
          <Combobox
            className={styles.controls}
            onSelect={setSelectedLine}
            value={selectedLine}
            options={transportData.lines.map((line) => ({
              value: transportLineId(line),
              label: <TransportLineLabel line={line} />,
            }))}
          />
        )}
      </div>
    </MantineProvider>
  );
}
