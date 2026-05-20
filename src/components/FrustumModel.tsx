import { Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { DoubleSide, Quaternion, Vector3 } from "three";
import type {
  FrustumDimensions,
  Part,
  SelectedPart,
} from "../types/frustum";

type Point3 = [number, number, number];

interface FrustumModelProps {
  dimensions: FrustumDimensions;
  selectedPart: SelectedPart;
  onSelectPart: (part: Part) => void;
}

interface MeasurementLineProps {
  from: Point3;
  to: Point3;
  part: Part;
  selectedPart: SelectedPart;
  onSelectPart: (part: Part) => void;
  color: string;
  hitRadius?: number;
}

interface RingProps {
  radius: number;
  y: number;
  part: Part;
  selectedPart: SelectedPart;
  onSelectPart: (part: Part) => void;
  hitTubeRadius: number;
  tubeRadius: number;
}

const HIGHLIGHT_COLOR = "#f97316";
const BODY_COLOR = "#8fb3d9";
const BODY_SELECTED_COLOR = "#ff7a3d";
const LINE_COLOR = "#1f6feb";
const CENTER_LINE_COLOR = "#138a72";
const RING_COLOR = "#344256";

const toVector = (point: Point3): Vector3 => new Vector3(...point);

function stopAndSelect(
  event: ThreeEvent<MouseEvent>,
  part: Part,
  onSelectPart: (part: Part) => void,
) {
  event.stopPropagation();
  onSelectPart(part);
}

function MeasurementLine({
  from,
  to,
  part,
  selectedPart,
  onSelectPart,
  color,
  hitRadius = 4,
}: MeasurementLineProps) {
  const isSelected = selectedPart === part;
  const { midpoint, quaternion, length } = useMemo(() => {
    const start = toVector(from);
    const end = toVector(to);
    const direction = end.clone().sub(start);
    const segmentLength = direction.length();
    const segmentMidpoint = start.clone().add(end).multiplyScalar(0.5);
    const segmentQuaternion = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      direction.clone().normalize(),
    );

    return {
      midpoint: segmentMidpoint,
      quaternion: segmentQuaternion,
      length: segmentLength,
    };
  }, [from, to]);

  return (
    <group>
      <Line
        points={[from, to]}
        color={isSelected ? HIGHLIGHT_COLOR : color}
        lineWidth={isSelected ? 5 : 3}
      />
      <mesh
        position={midpoint}
        quaternion={quaternion}
        onClick={(event) => stopAndSelect(event, part, onSelectPart)}
      >
        <cylinderGeometry args={[hitRadius, hitRadius, length, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SelectableRing({
  radius,
  y,
  part,
  selectedPart,
  onSelectPart,
  hitTubeRadius,
  tubeRadius,
}: RingProps) {
  const isSelected = selectedPart === part;

  return (
    <group position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh onClick={(event) => stopAndSelect(event, part, onSelectPart)}>
        <torusGeometry args={[radius, isSelected ? tubeRadius * 1.55 : tubeRadius, 18, 160]} />
        <meshStandardMaterial
          color={isSelected ? HIGHLIGHT_COLOR : RING_COLOR}
          roughness={0.35}
        />
      </mesh>
      <mesh onClick={(event) => stopAndSelect(event, part, onSelectPart)}>
        <torusGeometry args={[radius, hitTubeRadius, 12, 160]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function FrustumModel({
  dimensions,
  selectedPart,
  onSelectPart,
}: FrustumModelProps) {
  const { rTop, rBottom, height } = dimensions;
  const topY = height / 2;
  const bottomY = -height / 2;
  const maxSize = Math.max(rTop * 2, rBottom * 2, height);
  const diameterOffset = Math.max(4, maxSize * 0.035);
  const slantOffset = Math.max(3, maxSize * 0.03);
  const gridSize = Math.max(220, maxSize * 1.35);
  const gridDivisions = Math.max(16, Math.min(44, Math.round(gridSize / 70)));
  const ringTubeRadius = Math.max(1.35, maxSize * 0.005);
  const ringHitTubeRadius = Math.max(6, maxSize * 0.014);
  const lineHitRadius = Math.max(4, maxSize * 0.012);
  const isBodySelected = selectedPart === "body";

  return (
    <group>
      <gridHelper
        args={[gridSize, gridDivisions, "#b7c0ca", "#d9dee6"]}
        position={[0, bottomY - 1, 0]}
      />

      <mesh onClick={() => onSelectPart("body")}>
        <cylinderGeometry args={[rTop, rBottom, height, 128, 1, false]} />
        <meshStandardMaterial
          color={isBodySelected ? BODY_SELECTED_COLOR : BODY_COLOR}
          transparent
          opacity={isBodySelected ? 0.62 : 0.42}
          roughness={0.4}
          metalness={0.04}
          side={DoubleSide}
        />
      </mesh>

      <SelectableRing
        radius={rTop}
        y={topY}
        part="top"
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        hitTubeRadius={ringHitTubeRadius}
        tubeRadius={ringTubeRadius}
      />
      <SelectableRing
        radius={rBottom}
        y={bottomY}
        part="bottom"
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        hitTubeRadius={ringHitTubeRadius}
        tubeRadius={ringTubeRadius}
      />

      <MeasurementLine
        from={[-rTop, topY + diameterOffset, 0]}
        to={[rTop, topY + diameterOffset, 0]}
        part="topDiameter"
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        color={LINE_COLOR}
        hitRadius={lineHitRadius}
      />
      <MeasurementLine
        from={[-rBottom, bottomY + diameterOffset, 0]}
        to={[rBottom, bottomY + diameterOffset, 0]}
        part="bottomDiameter"
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        color={LINE_COLOR}
        hitRadius={lineHitRadius}
      />
      <MeasurementLine
        from={[0, bottomY, 0]}
        to={[0, topY, 0]}
        part="height"
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        color={CENTER_LINE_COLOR}
        hitRadius={lineHitRadius}
      />
      <MeasurementLine
        from={[rBottom + slantOffset, bottomY, 0]}
        to={[rTop + slantOffset, topY, 0]}
        part="slant"
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        color="#ad4e00"
        hitRadius={lineHitRadius}
      />
    </group>
  );
}
