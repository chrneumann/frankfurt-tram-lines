#![allow(clippy::non_canonical_partial_ord_impl)]

//! Parses an OpenStreetMap extract (in PBF file format) and returns information
//! about tram lines as JSON.
//!
//! The JSON format is documented in transport-data.ts

use anyhow::{Context, Result};
use clap::Parser;
use derivative::Derivative;
use geojson::{Geometry, LineStringType, Position, Value};
use osmpbfreader::{objects::OsmObj, NodeId, OsmId};
use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize, Derivative)]
#[derivative(Eq, PartialEq, Ord, PartialOrd)]
struct TransportLine {
    number: u8,
    from: String,
    to: String,
    #[derivative(PartialOrd = "ignore", Ord = "ignore")]
    geometry: Geometry,
    stations: Vec<NodeId>,
}

#[derive(Serialize)]
struct Station {
    id: NodeId,
    name: String,
    position: Position,
}

#[derive(Serialize)]
struct Data {
    stations: HashMap<NodeId, Station>,
    lines: Vec<TransportLine>,
}

/// Extracts transport line data from the given OpenStreetMap PBF and writes as
/// JSON to STDOUT.
pub fn extract_transport_lines(pbf_path: &str, out_path: &str) -> Result<()> {
    let pbf_file = std::fs::File::open(pbf_path).context("Could not open input file")?;
    let mut reader = osmpbfreader::OsmPbfReader::new(pbf_file);

    // Collect all transport lines and related objects from PBF.
    let objs =
        reader.get_objs_and_deps(|obj| obj.is_relation() && obj.tags().contains_key("route"))?;

    // Go through collected objects and extract information about transport
    // lines and stations.
    let mut transport_lines = Vec::new();
    let mut stations = HashMap::new();
    for (id, obj) in &objs {
        match obj {
            // Save tram stops.
            OsmObj::Node(node) => match node.tags.get("railway") {
                Some(value) if value == "tram_stop" => {
                    let node_id = id.node().unwrap();
                    stations.insert(
                        node_id,
                        Station {
                            id: node_id,
                            name: node
                                .tags
                                .get("name")
                                .context("Node without name")?
                                .to_string(),
                            position: vec![node.lon(), node.lat()],
                        },
                    );
                }
                _ => {}
            },
            // Save transport lines.
            OsmObj::Relation(relation) => {
                if !obj.tags().contains_key("route") {
                    continue;
                }
                let mut line_strings = vec![];
                let mut line_stations = vec![];
                for rel_obj in &relation.refs {
                    match rel_obj.role.as_str() {
                        // Build line strings.
                        "" => {
                            if let OsmObj::Way(way) = objs.get(&rel_obj.member).unwrap() {
                                let mut line_string: LineStringType = vec![];
                                for node_id in &way.nodes {
                                    if let OsmObj::Node(node) =
                                        objs.get(&OsmId::Node(*node_id)).unwrap()
                                    {
                                        line_string.push(vec![node.lon(), node.lat()]);
                                    }
                                }
                                line_strings.push(line_string);
                            }
                        }
                        // A stop belonging to the transport line.
                        "stop" => {
                            line_stations.push(
                                rel_obj
                                    .member
                                    .node()
                                    .context("Object with roule stop should be a node")?,
                            );
                        }
                        _ => {}
                    }
                }
                let name = relation
                    .tags
                    .get("name")
                    .context("name tag not found")?
                    .to_string();
                // Extract line number, from and to fields.
                let name_re = Regex::new(r"^Tram (.*): (.*?) =[ ]?> (?:.* => )?(.*)$").unwrap();
                match name_re.captures(&name) {
                    None => {
                        eprintln!("Unparseable line name '{name}', ignoring");
                        continue;
                    }
                    Some(caps) => {
                        transport_lines.push(TransportLine {
                            number: caps
                                .get(1)
                                .unwrap()
                                .as_str()
                                .parse::<u8>()
                                .context("Line number should be parseable as number")?,
                            from: caps.get(2).unwrap().as_str().to_string(),
                            to: caps.get(3).unwrap().as_str().to_string(),
                            geometry: Geometry::from(Value::MultiLineString(line_strings)),
                            stations: line_stations,
                        });
                    }
                };
            }
            _ => {}
        };
    }

    // Sort transport lines and output data as JSON.
    transport_lines.sort();
    std::fs::write(
        out_path,
        serde_json::to_string_pretty(&Data {
            stations,
            lines: transport_lines,
        })
        .context("Could not serialize transport data")?,
    )
    .context("Could not write output file")?;

    Ok(())
}

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct CLIArguments {
    /// PBF file path.
    pbf_path: String,
    /// Output file path.
    out_path: String,
}

pub fn main() -> anyhow::Result<()> {
    let args = CLIArguments::parse();
    extract_transport_lines(&args.pbf_path, &args.out_path)
}
