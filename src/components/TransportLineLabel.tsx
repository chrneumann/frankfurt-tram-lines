import React from "react";
import type { TransportLine } from "./transport-data.js";
import styles from "./TransportLineLabel.module.css";

/**
 * Label used in the transport line select.
 */
export function TransportLineLabel({ line }: { line: TransportLine }) {
  return (
    <div className={styles.root}>
      <span>{line.number}</span> {line.from} ➤ {line.to}
    </div>
  );
}
