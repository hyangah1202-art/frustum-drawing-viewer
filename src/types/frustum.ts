export type Part =
  | "body"
  | "top"
  | "bottom"
  | "topDiameter"
  | "bottomDiameter"
  | "height"
  | "slant";

export type SelectedPart = Part | null;

export type ViewMode = "3d" | "2d-section";

export type MeasurementKey =
  | "topRadius"
  | "topDiameter"
  | "bottomRadius"
  | "bottomDiameter"
  | "height"
  | "slantLength"
  | "volume"
  | "topArea"
  | "bottomArea"
  | "lateralArea"
  | "totalAreaClosed";

export type MeasurementVisibility = Record<MeasurementKey, boolean>;

export interface FrustumDimensions {
  rTop: number;
  rBottom: number;
  height: number;
  unit: string;
}

export interface FrustumCalc {
  rTop: number;
  rBottom: number;
  height: number;
  dTop: number;
  dBottom: number;
  radiusDiff: number;
  slantLength: number;
  outerDevelopmentRadius: number;
  innerDevelopmentRadius: number;
  unfoldAngleDeg: number;
  outerArcLength: number;
  innerArcLength: number;
  volume: number;
  topArea: number;
  bottomArea: number;
  lateralArea: number;
  totalAreaClosed: number;
}

export interface InfoRow {
  label: string;
  value: string;
}

export interface PartInfo {
  title: string;
  rows: InfoRow[];
}
