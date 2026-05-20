import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ChangeEvent, useMemo, useState } from "react";
import Drawing2D from "./components/Drawing2D";
import FrustumModel from "./components/FrustumModel";
import InfoPanel from "./components/InfoPanel";
import MeasurementTogglePanel from "./components/MeasurementTogglePanel";
import { calcFrustum } from "./lib/frustum";
import type {
  FrustumDimensions,
  MeasurementKey,
  MeasurementVisibility,
  SelectedPart,
  ViewMode,
} from "./types/frustum";

const DEFAULT_DIMENSIONS: FrustumDimensions = {
  rTop: 200,
  rBottom: 900,
  height: 600,
  unit: "mm",
};

const DEFAULT_MEASUREMENT_VISIBILITY: MeasurementVisibility = {
  topRadius: true,
  topDiameter: true,
  bottomRadius: true,
  bottomDiameter: true,
  height: true,
  slantLength: true,
  volume: true,
  topArea: true,
  bottomArea: true,
  lateralArea: true,
  totalAreaClosed: true,
};

type DimensionKey = "rTop" | "rBottom" | "height";

const DIMENSION_FIELDS: Array<{
  key: DimensionKey;
  label: string;
}> = [
  { key: "rTop", label: "윗반지름" },
  { key: "rBottom", label: "아랫반지름" },
  { key: "height", label: "높이" },
];

function normalizeDimensionValue(value: string): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return 1;
  }

  return numericValue;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [selectedPart, setSelectedPart] = useState<SelectedPart>(null);
  const [dimensions, setDimensions] =
    useState<FrustumDimensions>(DEFAULT_DIMENSIONS);
  const [measurementVisibility, setMeasurementVisibility] =
    useState<MeasurementVisibility>(DEFAULT_MEASUREMENT_VISIBILITY);
  const calc = useMemo(() => calcFrustum(dimensions), [dimensions]);
  const sceneSize = Math.max(
    dimensions.rTop * 2,
    dimensions.rBottom * 2,
    dimensions.height,
  );
  const cameraDistance = Math.max(180, sceneSize * 1.6);

  const handleDimensionChange =
    (key: DimensionKey) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = normalizeDimensionValue(event.target.value);
      setDimensions((current) => ({
        ...current,
        [key]: nextValue,
      }));
    };

  const handleMeasurementVisibilityChange = (
    key: MeasurementKey,
    visible: boolean,
  ) => {
    setMeasurementVisibility((current) => ({
      ...current,
      [key]: visible,
    }));
  };

  return (
    <main className="app-shell">
      <section className="viewer-section" aria-label="원뿔대 도면 뷰어">
        <div className="dimension-controls">
          {DIMENSION_FIELDS.map((field) => (
            <label className="dimension-input" key={field.key}>
              <span>{field.label}</span>
              <input
                aria-label={field.label}
                type="number"
                min={1}
                step={1}
                value={dimensions[field.key]}
                onChange={handleDimensionChange(field.key)}
              />
            </label>
          ))}
        </div>

        <div className="view-mode-toggle" aria-label="보기 방식">
          <button
            className={viewMode === "3d" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("3d")}
          >
            3D 보기
          </button>
          <button
            className={viewMode === "2d-section" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("2d-section")}
          >
            2D 도면 보기
          </button>
        </div>

        {viewMode === "2d-section" && (
          <div className="floating-toggle-panel">
            <MeasurementTogglePanel
              visibility={measurementVisibility}
              onChange={handleMeasurementVisibilityChange}
            />
          </div>
        )}

        <div className="viewer-canvas">
          {viewMode === "3d" ? (
            <Canvas
              camera={{
                position: [cameraDistance, cameraDistance * 0.72, cameraDistance],
                fov: 45,
                far: Math.max(2000, sceneSize * 8),
              }}
              onPointerMissed={() => setSelectedPart(null)}
            >
              <color attach="background" args={["#eef1f5"]} />
              <ambientLight intensity={0.85} />
              <directionalLight position={[120, 180, 90]} intensity={1.35} />
              <directionalLight position={[-120, 80, -120]} intensity={0.45} />
              <FrustumModel
                dimensions={dimensions}
                selectedPart={selectedPart}
                onSelectPart={setSelectedPart}
              />
              <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.08}
                minDistance={Math.max(80, sceneSize * 0.3)}
                maxDistance={Math.max(420, sceneSize * 4)}
              />
            </Canvas>
          ) : (
            <Drawing2D
              calc={calc}
              dimensions={dimensions}
              visibility={measurementVisibility}
            />
          )}
        </div>
      </section>

      <InfoPanel dimensions={dimensions} selectedPart={selectedPart} />
    </main>
  );
}
