# Frankfurt Tram Lines

Interactive web-map of Frankfurt's tram network. Used as example at
https://codingmobility.net/karten

The project consists of the tool `extract_transport_lines` to generate transport
line data from an OpenStreetMap PBF extract and the `TransportMap` React
component to display the data using MapLibre GL.

This is a proof of concept and reference/learning material. It's not intended
for use in production.

## Example usage

### Generate transport line data

Get an Open Street Map data file in PBF format for your region, e.g. from
https://download.geofabrik.de/

Search the relation id of your city in the [Open Street
Map](https://www.openstreetmap.org/) (you will see it in the URL, e.g.
https://www.openstreetmap.org/relation/62400 / 62400 for Frankfurt).

Extract the relation boundary with `osmium`:

> osmium getid -r -t region.osm.pbf r62400 -o boundary.osm.pbf

Create an extract for the city:

> osmium extract -p boundary.osm.pbf region.osm.pbf -o city.osm.pbf

Retrieve all relations with attribute route="tram" including referenced objects.

> osmium tags-filter -o city_trams.osm.pbf city.osm.pbf r/route=tram

Build the `extract_transport_lines` program:

> cargo build

Generate the JSON:

> cargo run --bin extract_transport_lines city_trams.osm.pbf city_trams.json

### React component to show tram lines

Build the component library:

> npm install
> npm run build:js

If using TypeScript:

> npm run build:types

Use it as component:

```tsx
import { TransportMap } from "frankfurt-tram-lines";
import "frankfurt-tram-lines/styles.css";
export default function Page() {
    return <TransportMap center={[8.683737, 50.115161]} transportDataURL="/maps/frankfurt_oepnv.json" styleURL="/maps/styles.json" />;
}
```
