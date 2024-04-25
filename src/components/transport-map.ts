import { useState, useEffect } from "react";
import { Map as LibreMap, type LngLatLike } from "maplibre-gl";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import { Protocol } from "pmtiles";
import {
  type TransportData,
  type Station,
  transportLineId,
} from "./transport-data.js";
import type { FeatureCollection, Position, Feature } from "geojson";
import turfCentroid from "@turf/centroid";
import turfBbox from "@turf/bbox";

class TransportMap {
  private map: LibreMap;
  /**
   * Initializes the map.
   *
   * @param container - The HTML element to attach to.
   * @param onLoad - Callback which is called when the map is loaded.
   */
  constructor(
    styleURL: string,
    center: LngLatLike,
    container: HTMLElement,
    onLoad: (map: TransportMap) => void,
  ) {
    const protocol = new Protocol();
    this.map = new LibreMap({
      container,
      style: styleURL,
      center,
      zoom: 13,
      cooperativeGestures: true,
      attributionControl: {
        customAttribution:
          '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap Mitwirkende</a> <a href = "https://www.maptiler.com/copyright/" target="_blank" >&copy; MapTiler</a>',
      },
    });
    maplibregl.addProtocol("pmtiles", protocol.tile);
    this.map.on("load", () => {
      this.map.addControl(new maplibregl.NavigationControl());
      onLoad(this);
    });
  }

  /**
   * Highlights the given line.
   *
   * @param selectedLine - The line to highlight.
   * @param transportData - The transport data.
   */
  setSelectedLine(selectedLine: string, transportData: TransportData): void {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    for (const line of transportData.lines) {
      if (transportLineId(line) === selectedLine) {
        collection.features.push({
          type: "Feature",
          geometry: line.geometry,
          properties: {},
        });
        const source = this.map.getSource("transport-selected");
        if (!(source instanceof GeoJSONSource)) {
          throw new Error("Could not get transport-selected source");
        }
        source.setData(collection);
        this.map.fitBounds(turfBbox(collection), {
          padding: { top: 100, bottom: 50, left: 50, right: 50 },
        });
        // this.map.setPaintProperty("transport", "line-color", 0.3);
      }
    }
  }

  /**
   * Add the transport layers to the map using the given data.
   *
   * @param data - The transport data to be used.
   */
  addTransportLayers(data: TransportData): void {
    const linesCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    for (const line of data.lines) {
      linesCollection.features.push({
        type: "Feature",
        geometry: line.geometry,
        properties: {},
      });
    }
    const stationsCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    const stationPositions = new Map<string, Position[]>();
    for (const station of Object.values(data.stations) as Station[]) {
      stationsCollection.features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: station.position,
        },
        properties: {
          name: station.name,
        },
      });
      const positions = stationPositions.get(station.name) || [];
      positions.push(station.position);
      stationPositions.set(station.name, positions);
    }
    const centroidsCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    for (const [name, positions] of stationPositions) {
      const collection: FeatureCollection = {
        type: "FeatureCollection",
        features: positions.map(
          (position): Feature => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: position,
            },
            properties: {},
          }),
        ),
      };
      const centroid = turfCentroid(collection);
      centroid.properties.name = name;
      centroidsCollection.features.push(centroid);
    }

    this.map.addSource("transport", {
      type: "geojson",
      data: linesCollection,
    });
    this.map.addSource("transport-selected", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    this.map.addSource("stations", {
      type: "geojson",
      data: stationsCollection,
    });
    this.map.addSource("station-centroids", {
      type: "geojson",
      data: centroidsCollection,
    });
    this.map.addLayer({
      id: "transport",
      type: "line",
      source: "transport",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#DBB3E6",
        "line-width": 5,
      },
    });
    this.map.addLayer({
      id: "transport-selected",
      type: "line",
      source: "transport-selected",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#836B8A",
        "line-width": 5,
      },
    });
    this.map.addLayer({
      id: "transport-station-labels",
      type: "symbol",
      source: "station-centroids",
      layout: {
        "icon-image": "railway_light",
        "text-anchor": "top",
        "text-field": "{name}",
        "text-font": ["Noto Sans Regular"],
        "text-offset": [0, 0.8],
        "text-size": 13,
      },
    });
  }

  /**
   * Cleans up the map.
   *
   * Removes the PMTiles protocol from MapLibre GL.
   */
  destruct() {
    maplibregl.removeProtocol("pmtiles");
  }
}

/**
 * React hook to initialize and update the transport map.
 *
 * @param container - The map container.
 * @param transportData - The transport data.
 * @param selectedLine - The transport line to highlight.
 */
export function useTransportMap(
  container: HTMLElement | null,
  transportData: null | TransportData,
  selectedLine: null | string,
  styleURL: string,
  center: LngLatLike,
) {
  const [map, setMap] = useState<null | TransportMap>(null);
  const [layersAdded, setLayersAdded] = useState<boolean>(false);

  // Initialize the map.
  useEffect(() => {
    if (container) {
      const theMap = new TransportMap(styleURL, center, container, setMap);
      return () => {
        theMap.destruct();
      };
    }
  }, [container]);

  // Add transport layers when data is available.
  useEffect(() => {
    if (map && transportData) {
      map.addTransportLayers(transportData);
      setLayersAdded(true);
    }
  }, [transportData, map]);

  // Highlight selected line.
  useEffect(() => {
    if (map && transportData && layersAdded && selectedLine) {
      map.setSelectedLine(selectedLine, transportData);
    }
  }, [map, layersAdded, transportData, selectedLine]);
}
