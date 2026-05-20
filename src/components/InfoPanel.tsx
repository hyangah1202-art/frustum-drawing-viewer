import { useMemo } from "react";
import { getPartInfo } from "../lib/frustum";
import type { FrustumDimensions, SelectedPart } from "../types/frustum";

interface InfoPanelProps {
  dimensions: FrustumDimensions;
  selectedPart: SelectedPart;
}

export default function InfoPanel({
  dimensions,
  selectedPart,
}: InfoPanelProps) {
  const info = useMemo(
    () => getPartInfo(selectedPart, dimensions),
    [dimensions, selectedPart],
  );

  return (
    <aside className="info-panel">
      <div className="panel-header">
        <span className="eyebrow">Dimension</span>
        <h1>{info.title}</h1>
      </div>

      <table className="dimension-table">
        <tbody>
          {info.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
