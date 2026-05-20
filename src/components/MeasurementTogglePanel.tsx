import type {
  MeasurementKey,
  MeasurementVisibility,
} from "../types/frustum";

interface MeasurementTogglePanelProps {
  visibility: MeasurementVisibility;
  onChange: (key: MeasurementKey, visible: boolean) => void;
}

const MEASUREMENT_OPTIONS: Array<{
  key: MeasurementKey;
  label: string;
  group: "길이" | "계산값";
}> = [
  { key: "topRadius", label: "윗반지름", group: "길이" },
  { key: "topDiameter", label: "윗지름", group: "길이" },
  { key: "bottomRadius", label: "아랫반지름", group: "길이" },
  { key: "bottomDiameter", label: "아랫지름", group: "길이" },
  { key: "height", label: "높이", group: "길이" },
  { key: "slantLength", label: "빗변 길이", group: "길이" },
  { key: "volume", label: "부피", group: "계산값" },
  { key: "topArea", label: "윗면 면적", group: "계산값" },
  { key: "bottomArea", label: "아랫면 면적", group: "계산값" },
  { key: "lateralArea", label: "옆면 면적", group: "계산값" },
  { key: "totalAreaClosed", label: "닫힌 전체 면적", group: "계산값" },
];

export default function MeasurementTogglePanel({
  visibility,
  onChange,
}: MeasurementTogglePanelProps) {
  const groups = ["길이", "계산값"] as const;

  return (
    <section className="toggle-panel">
      <div className="panel-header compact">
        <span className="eyebrow">2D Drawing</span>
        <h2>치수 표시</h2>
      </div>

      {groups.map((group) => (
        <div className="toggle-group" key={group}>
          <h3>{group}</h3>
          {MEASUREMENT_OPTIONS.filter((option) => option.group === group).map(
            (option) => (
              <label className="measurement-toggle" key={option.key}>
                <input
                  type="checkbox"
                  checked={visibility[option.key]}
                  onChange={(event) => onChange(option.key, event.target.checked)}
                />
                <span>{option.label}</span>
              </label>
            ),
          )}
        </div>
      ))}
    </section>
  );
}
