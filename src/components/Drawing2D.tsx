import {
  calculateSvgScale,
  toSvgPoint,
  type ModelPoint2D,
  type SvgPoint2D,
} from "../lib/drawing2d";
import {
  formatArea,
  formatLength,
  formatVolume,
} from "../lib/frustum";
import type {
  FrustumCalc,
  FrustumDimensions,
  MeasurementVisibility,
} from "../types/frustum";
import { useState } from "react";

interface Drawing2DProps {
  dimensions: FrustumDimensions;
  calc: FrustumCalc;
  visibility: MeasurementVisibility;
}

interface CapCircle {
  center: ModelPoint2D;
  radius: number;
  label: string;
  measurementKey: "topDiameter" | "bottomDiameter";
  diameter: number;
}

type Drawing2DMode = "section" | "flat-pattern";
type MeasureTool =
  | "linear"
  | "aligned"
  | "angle"
  | "arcLength"
  | "radius"
  | "diameter";

interface MeasureToolDefinition {
  key: MeasureTool;
  label: string;
}

const SVG_WIDTH = 920;
const SVG_HEIGHT = 620;
const MODEL_WIDTH = 690;
const MODEL_HEIGHT = 560;
const MODEL_X = 20;
const MODEL_Y = 30;
const FLAT_MODEL_WIDTH = 660;
const FLAT_MODEL_HEIGHT = 560;
const ARC_STEPS = 96;
const MEASURE_TOOLS: MeasureToolDefinition[] = [
  { key: "linear", label: "선형" },
  { key: "aligned", label: "정렬" },
  { key: "angle", label: "각도" },
  { key: "arcLength", label: "호 길이" },
  { key: "radius", label: "반지름" },
  { key: "diameter", label: "지름" },
];

const lineCenter = (start: SvgPoint2D, end: SvgPoint2D): SvgPoint2D => ({
  x: (start.x + end.x) / 2,
  y: (start.y + end.y) / 2,
});

const pointList = (points: SvgPoint2D[]): string =>
  points.map((point) => `${point.x},${point.y}`).join(" ");

const circleBounds = (circle: CapCircle) => ({
  minX: circle.center.x - circle.radius,
  maxX: circle.center.x + circle.radius,
  minY: circle.center.y - circle.radius,
  maxY: circle.center.y + circle.radius,
});

const mergeBounds = (
  bounds: Array<{ minX: number; maxX: number; minY: number; maxY: number }>,
) => ({
  minX: Math.min(...bounds.map((bound) => bound.minX)),
  maxX: Math.max(...bounds.map((bound) => bound.maxX)),
  minY: Math.min(...bounds.map((bound) => bound.minY)),
  maxY: Math.max(...bounds.map((bound) => bound.maxY)),
});

const pointOnCircle = (radius: number, degrees: number): ModelPoint2D => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
};

const sampleArc = (
  radius: number,
  startDeg: number,
  endDeg: number,
): ModelPoint2D[] =>
  Array.from({ length: ARC_STEPS + 1 }, (_, index) => {
    const ratio = index / ARC_STEPS;
    return pointOnCircle(radius, startDeg + (endDeg - startDeg) * ratio);
  });

const sampleSvgCircleArc = (
  center: SvgPoint2D,
  radius: number,
  startDeg: number,
  endDeg: number,
  steps = 48,
): SvgPoint2D[] =>
  Array.from({ length: steps + 1 }, (_, index) => {
    const ratio = index / steps;
    const radians = ((startDeg + (endDeg - startDeg) * ratio) * Math.PI) / 180;
    return {
      x: center.x + Math.cos(radians) * radius,
      y: center.y + Math.sin(radians) * radius,
    };
  });

const linePath = (points: SvgPoint2D[]): string =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

const rotateText = (angle: number, point: SvgPoint2D) =>
  `rotate(${angle} ${point.x} ${point.y})`;

const dimensionLabel = (
  key: string,
  text: string,
  x: number,
  y: number,
  className = "dimension-text",
) => (
  <text className={className} data-measurement-key={key} x={x} y={y}>
    {text}
  </text>
);

const extensionLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  key: string,
) => (
  <line
    className="extension-line"
    data-measurement-key={key}
    x1={x1}
    x2={x2}
    y1={y1}
    y2={y2}
  />
);

const measureCallout = (
  text: string,
  x: number,
  y: number,
  width = 238,
) => (
  <g className="measure-callout" transform={`translate(${x} ${y})`}>
    <rect width={width} height="34" rx="7" />
    <text x="12" y="22">
      {text}
    </text>
  </g>
);

export default function Drawing2D({
  dimensions,
  calc,
  visibility,
}: Drawing2DProps) {
  const [drawingMode, setDrawingMode] = useState<Drawing2DMode>("section");
  const [activeMeasureTool, setActiveMeasureTool] =
    useState<MeasureTool | null>(null);
  const unit = dimensions.unit;
  const topY = dimensions.height / 2;
  const bottomY = -dimensions.height / 2;
  const sectionCenterX = -dimensions.rBottom * 1.05;
  const bottomCapCenterX = dimensions.rBottom * 1.25;
  const bottomCapCenterY = 0;
  const topCapCenterY = dimensions.rBottom + dimensions.rTop + 360;

  const sectionPoints = {
    topLeft: { x: sectionCenterX - dimensions.rTop, y: topY },
    topRight: { x: sectionCenterX + dimensions.rTop, y: topY },
    bottomLeft: { x: sectionCenterX - dimensions.rBottom, y: bottomY },
    bottomRight: { x: sectionCenterX + dimensions.rBottom, y: bottomY },
    centerTop: { x: sectionCenterX, y: topY },
    centerBottom: { x: sectionCenterX, y: bottomY },
  };
  const topCap: CapCircle = {
    center: { x: bottomCapCenterX, y: topCapCenterY },
    radius: dimensions.rTop,
    label: "윗반지름",
    measurementKey: "topDiameter",
    diameter: calc.dTop,
  };
  const bottomCap: CapCircle = {
    center: { x: bottomCapCenterX, y: bottomCapCenterY },
    radius: dimensions.rBottom,
    label: "아랫뚜껑",
    measurementKey: "bottomDiameter",
    diameter: calc.dBottom,
  };
  const modelBounds = mergeBounds([
    {
      minX: Math.min(sectionPoints.topLeft.x, sectionPoints.bottomLeft.x),
      maxX: Math.max(sectionPoints.topRight.x, sectionPoints.bottomRight.x),
      minY: bottomY,
      maxY: topY,
    },
    circleBounds(topCap),
    circleBounds(bottomCap),
  ]);
  const transform = calculateSvgScale(modelBounds, {
    width: MODEL_WIDTH,
    height: MODEL_HEIGHT,
    padding: 62,
  });

  const topLeft = toSvgPoint(sectionPoints.topLeft, transform);
  const topRight = toSvgPoint(sectionPoints.topRight, transform);
  const bottomLeft = toSvgPoint(sectionPoints.bottomLeft, transform);
  const bottomRight = toSvgPoint(sectionPoints.bottomRight, transform);
  const centerTop = toSvgPoint(sectionPoints.centerTop, transform);
  const centerBottom = toSvgPoint(sectionPoints.centerBottom, transform);
  const sectionTopCenter = lineCenter(topLeft, topRight);
  const sectionBottomCenter = lineCenter(bottomLeft, bottomRight);
  const shapePoints = [topLeft, topRight, bottomRight, bottomLeft];

  const topRadiusY = topLeft.y - 108;
  const topDiameterY = topLeft.y - 64;
  const bottomDiameterY = bottomLeft.y + 58;
  const bottomRadiusY = bottomLeft.y + 104;
  const heightX = bottomRight.x + 44;
  const slantStart = { x: bottomLeft.x - 56, y: bottomLeft.y + 28 };
  const slantEnd = { x: topLeft.x - 56, y: topLeft.y - 28 };
  const slantMid = lineCenter(slantStart, slantEnd);
  const slantLabelX = Math.max(72, slantMid.x - 90);

  const capCircles = [bottomCap, topCap].map((cap) => ({
    ...cap,
    svgCenter: toSvgPoint(cap.center, transform),
    svgRadius: cap.radius * transform.scale,
  }));
  const bottomCapSvg = capCircles[0];
  const topCapSvg = capCircles[1];
  const sectionBottomCapArc = sampleSvgCircleArc(
    bottomCapSvg.svgCenter,
    bottomCapSvg.svgRadius,
    206,
    322,
  );
  const sectionSlantAngleDeg =
    (Math.atan2(calc.height, Math.max(calc.radiusDiff, 0.0001)) * 180) /
    Math.PI;
  const sectionAngleRadius = 64;
  const sectionAngleEnd = {
    x:
      bottomLeft.x +
      Math.cos((-sectionSlantAngleDeg * Math.PI) / 180) * sectionAngleRadius,
    y:
      bottomLeft.y +
      Math.sin((-sectionSlantAngleDeg * Math.PI) / 180) * sectionAngleRadius,
  };
  const sectionAnglePath = `M ${bottomLeft.x + sectionAngleRadius} ${bottomLeft.y} A ${sectionAngleRadius} ${sectionAngleRadius} 0 0 0 ${sectionAngleEnd.x} ${sectionAngleEnd.y}`;

  const supplementalRows = [
    visibility.volume && ["부피", formatVolume(calc.volume, unit)],
    visibility.topArea && ["윗면 면적", formatArea(calc.topArea, unit)],
    visibility.bottomArea && ["아랫면 면적", formatArea(calc.bottomArea, unit)],
    visibility.lateralArea && ["옆면 면적", formatArea(calc.lateralArea, unit)],
    visibility.totalAreaClosed && [
      "닫힌 전체 면적",
      formatArea(calc.totalAreaClosed, unit),
    ],
  ].filter((row): row is string[] => Boolean(row));

  const flatOuterRadius = calc.outerDevelopmentRadius;
  const flatInnerRadius = calc.innerDevelopmentRadius;
  const flatGapAngle = 360 - calc.unfoldAngleDeg;
  const flatStartDeg = -90 + flatGapAngle / 2;
  const flatEndDeg = flatStartDeg + calc.unfoldAngleDeg;
  const flatTopAttachAngle = 90;
  const flatTopCapCenterRadius = Math.max(0, flatInnerRadius - dimensions.rTop);
  const flatTopCapCenter = pointOnCircle(
    flatTopCapCenterRadius,
    flatTopAttachAngle,
  );
  const flatBottomCap: CapCircle = {
    center: { x: 0, y: flatOuterRadius + dimensions.rBottom },
    radius: dimensions.rBottom,
    label: "아랫뚜껑",
    measurementKey: "bottomDiameter",
    diameter: calc.dBottom,
  };
  const flatTopCap: CapCircle = {
    center: flatTopCapCenter,
    radius: dimensions.rTop,
    label: "윗반지름",
    measurementKey: "topDiameter",
    diameter: calc.dTop,
  };
  const flatBounds = mergeBounds([
    {
      minX: -flatOuterRadius,
      maxX: flatOuterRadius,
      minY: -flatOuterRadius,
      maxY: flatOuterRadius,
    },
    circleBounds(flatBottomCap),
    circleBounds(flatTopCap),
  ]);
  const flatTransform = calculateSvgScale(flatBounds, {
    width: FLAT_MODEL_WIDTH,
    height: FLAT_MODEL_HEIGHT,
    padding: 58,
  });
  const flatOuterArc = sampleArc(flatOuterRadius, flatStartDeg, flatEndDeg).map(
    (point) => toSvgPoint(point, flatTransform),
  );
  const flatInnerArc = sampleArc(flatInnerRadius, flatStartDeg, flatEndDeg).map(
    (point) => toSvgPoint(point, flatTransform),
  );
  const flatSidePath = `${linePath([
    ...flatOuterArc,
    ...flatInnerArc.slice().reverse(),
  ])} Z`;
  const flatOuterStart = flatOuterArc[0];
  const flatOuterEnd = flatOuterArc[flatOuterArc.length - 1];
  const flatInnerStart = flatInnerArc[0];
  const flatInnerEnd = flatInnerArc[flatInnerArc.length - 1];
  const flatBottomCenter = toSvgPoint(flatBottomCap.center, flatTransform);
  const flatTopCenter = toSvgPoint(flatTopCap.center, flatTransform);
  const flatBottomRadius = flatBottomCap.radius * flatTransform.scale;
  const flatTopRadius = flatTopCap.radius * flatTransform.scale;
  const flatSideCenter = toSvgPoint({ x: 0, y: 0 }, flatTransform);
  const flatTopAttachPoint = toSvgPoint(
    pointOnCircle(flatInnerRadius, flatTopAttachAngle),
    flatTransform,
  );
  const flatBottomDiaStart = {
    x: flatBottomCenter.x - flatBottomRadius * 0.98,
    y: flatBottomCenter.y - flatBottomRadius * 0.55,
  };
  const flatBottomDiaEnd = {
    x: flatBottomCenter.x + flatBottomRadius * 0.98,
    y: flatBottomCenter.y + flatBottomRadius * 0.55,
  };
  const flatBottomDiaLabel = {
    x: flatBottomDiaStart.x + 70,
    y: flatBottomDiaStart.y - 6,
  };
  const flatBottomCircLabel = {
    x: Math.min(FLAT_MODEL_WIDTH - 118, flatBottomCenter.x + flatBottomRadius + 54),
    y: flatBottomCenter.y - 64,
  };
  const flatBottomCircTarget = {
    x: flatBottomCenter.x + flatBottomRadius,
    y: flatBottomCenter.y,
  };
  const flatTopDiameterY = flatTopCenter.y - flatTopRadius - 42;
  const flatTopRadiusX = flatTopCenter.x + flatTopRadius + 92;
  const flatSlantTopY = flatTopAttachPoint.y;
  const flatSlantBottomY = flatSlantTopY + calc.slantLength * flatTransform.scale;
  const flatSlantLeftX = Math.max(
    24,
    flatSideCenter.x - flatOuterRadius * flatTransform.scale - 38,
  );
  const flatSlantRightX = Math.min(
    FLAT_MODEL_WIDTH - 28,
    flatSideCenter.x + flatOuterRadius * flatTransform.scale + 38,
  );
  const flatTopCircLabel = {
    x: Math.max(96, flatTopCenter.x - flatTopRadius - 112),
    y: flatTopAttachPoint.y + 52,
  };
  const flatTopCircTarget = {
    x: flatTopAttachPoint.x,
    y: flatTopAttachPoint.y,
  };
  const flatBottomRadiusEnd = {
    x: flatBottomCenter.x + flatBottomRadius,
    y: flatBottomCenter.y,
  };
  const flatSlantLineMid = lineCenter(flatInnerEnd, flatOuterEnd);
  const flatSlantLabel = {
    x: Math.max(68, flatSlantLineMid.x - 92),
    y: flatSlantLineMid.y + 18,
  };
  const flatAngleArc = sampleArc(
    flatOuterRadius * 0.42,
    flatStartDeg,
    flatEndDeg,
  ).map((point) => toSvgPoint(point, flatTransform));
  const flatRadiusEnd = toSvgPoint(pointOnCircle(flatOuterRadius, 0), flatTransform);

  const sectionMeasureOverlay = (
    <g className="measure-overlay" data-measure-tool={activeMeasureTool}>
      {activeMeasureTool === "linear" && (
        <g>
          <line
            className="measure-extension"
            x1={topRight.x}
            x2={heightX + 66}
            y1={topRight.y}
            y2={topRight.y}
          />
          <line
            className="measure-extension"
            x1={bottomRight.x}
            x2={heightX + 66}
            y1={bottomRight.y}
            y2={bottomRight.y}
          />
          <line
            className="measure-line"
            x1={heightX + 54}
            x2={heightX + 54}
            y1={topRight.y}
            y2={bottomRight.y}
          />
          {measureCallout(
            `선형 높이 ${formatLength(calc.height, unit)}`,
            Math.min(heightX + 74, MODEL_WIDTH - 242),
            (topRight.y + bottomRight.y) / 2 - 18,
          )}
        </g>
      )}

      {activeMeasureTool === "aligned" && (
        <g>
          <line
            className="measure-line"
            x1={slantStart.x}
            x2={slantEnd.x}
            y1={slantStart.y}
            y2={slantEnd.y}
          />
          {measureCallout(
            `정렬 빗변 ${formatLength(calc.slantLength, unit)}`,
            slantLabelX,
            slantMid.y + 18,
          )}
        </g>
      )}

      {activeMeasureTool === "angle" && (
        <g>
          <line
            className="measure-extension"
            x1={bottomLeft.x}
            x2={bottomLeft.x + 92}
            y1={bottomLeft.y}
            y2={bottomLeft.y}
          />
          <line
            className="measure-extension"
            x1={bottomLeft.x}
            x2={topLeft.x}
            y1={bottomLeft.y}
            y2={topLeft.y}
          />
          <path className="measure-arc" d={sectionAnglePath} />
          {measureCallout(
            `각도 ${sectionSlantAngleDeg.toFixed(2)}°`,
            bottomLeft.x + 72,
            bottomLeft.y - 94,
            156,
          )}
        </g>
      )}

      {activeMeasureTool === "arcLength" && (
        <g>
          <path className="measure-arc" d={linePath(sectionBottomCapArc)} />
          {measureCallout(
            `호 길이 ${formatLength(calc.outerArcLength, unit)}`,
            bottomCapSvg.svgCenter.x - 104,
            bottomCapSvg.svgCenter.y + bottomCapSvg.svgRadius + 18,
          )}
        </g>
      )}

      {activeMeasureTool === "radius" && (
        <g>
          <line
            className="measure-line"
            x1={bottomCapSvg.svgCenter.x}
            x2={bottomCapSvg.svgCenter.x + bottomCapSvg.svgRadius}
            y1={bottomCapSvg.svgCenter.y}
            y2={bottomCapSvg.svgCenter.y}
          />
          {measureCallout(
            `반지름 ${formatLength(calc.rBottom, unit)}`,
            bottomCapSvg.svgCenter.x + 24,
            bottomCapSvg.svgCenter.y - 42,
            186,
          )}
        </g>
      )}

      {activeMeasureTool === "diameter" && (
        <g>
          <line
            className="measure-line"
            x1={bottomCapSvg.svgCenter.x - bottomCapSvg.svgRadius}
            x2={bottomCapSvg.svgCenter.x + bottomCapSvg.svgRadius}
            y1={bottomCapSvg.svgCenter.y}
            y2={bottomCapSvg.svgCenter.y}
          />
          {measureCallout(
            `지름 ${formatLength(calc.dBottom, unit)}`,
            bottomCapSvg.svgCenter.x - 104,
            bottomCapSvg.svgCenter.y + bottomCapSvg.svgRadius + 18,
            196,
          )}
        </g>
      )}
    </g>
  );

  const flatMeasureOverlay = (
    <g className="measure-overlay" data-measure-tool={activeMeasureTool}>
      {activeMeasureTool === "linear" && (
        <g>
          <line
            className="measure-line"
            x1={flatBottomCenter.x - flatBottomRadius}
            x2={flatBottomCenter.x + flatBottomRadius}
            y1={flatBottomCenter.y}
            y2={flatBottomCenter.y}
          />
          {measureCallout(
            `선형 지름 ${formatLength(calc.dBottom, unit)}`,
            flatBottomCenter.x - 108,
            flatBottomCenter.y + flatBottomRadius + 18,
            210,
          )}
        </g>
      )}

      {activeMeasureTool === "aligned" && (
        <g>
          <line
            className="measure-line"
            x1={flatInnerEnd.x}
            x2={flatOuterEnd.x}
            y1={flatInnerEnd.y}
            y2={flatOuterEnd.y}
          />
          {measureCallout(
            `정렬 빗변 ${formatLength(calc.slantLength, unit)}`,
            flatSlantLabel.x,
            flatSlantLabel.y + 14,
          )}
        </g>
      )}

      {activeMeasureTool === "angle" && (
        <g>
          <line
            className="measure-extension"
            x1={flatSideCenter.x}
            x2={flatInnerStart.x}
            y1={flatSideCenter.y}
            y2={flatInnerStart.y}
          />
          <line
            className="measure-extension"
            x1={flatSideCenter.x}
            x2={flatInnerEnd.x}
            y1={flatSideCenter.y}
            y2={flatInnerEnd.y}
          />
          <path className="measure-arc" d={linePath(flatAngleArc)} />
          {measureCallout(
            `각도 ${calc.unfoldAngleDeg.toFixed(2)}°`,
            Math.max(42, flatSideCenter.x - 92),
            Math.max(42, flatSideCenter.y - flatOuterRadius * flatTransform.scale * 0.38),
            166,
          )}
        </g>
      )}

      {activeMeasureTool === "arcLength" && (
        <g>
          <path className="measure-arc" d={linePath(flatOuterArc)} />
          {measureCallout(
            `호 길이 ${formatLength(calc.outerArcLength, unit)}`,
            Math.max(132, flatBottomCenter.x - 118),
            flatBottomCenter.y + flatBottomRadius + 26,
          )}
        </g>
      )}

      {activeMeasureTool === "radius" && (
        <g>
          <line
            className="measure-line"
            x1={flatSideCenter.x}
            x2={flatRadiusEnd.x}
            y1={flatSideCenter.y}
            y2={flatRadiusEnd.y}
          />
          {measureCallout(
            `반지름 ${formatLength(calc.outerDevelopmentRadius, unit)}`,
            Math.min(flatRadiusEnd.x - 214, FLAT_MODEL_WIDTH - 242),
            flatRadiusEnd.y - 44,
          )}
        </g>
      )}

      {activeMeasureTool === "diameter" && (
        <g>
          <line
            className="measure-line"
            x1={flatBottomCenter.x - flatBottomRadius}
            x2={flatBottomCenter.x + flatBottomRadius}
            y1={flatBottomCenter.y}
            y2={flatBottomCenter.y}
          />
          {measureCallout(
            `지름 ${formatLength(calc.dBottom, unit)}`,
            flatBottomCenter.x - 96,
            flatBottomCenter.y - 44,
            190,
          )}
        </g>
      )}
    </g>
  );

  const sectionDrawing = (
    <svg
      className="drawing2d-svg"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      role="img"
      aria-label="뚜껑을 포함한 원뿔대 2D 도면"
    >
      <defs>
        <marker
          id="dimensionArrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="4"
          refY="4"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#1d4ed8" />
        </marker>
        <marker
          id="measureArrow"
          markerHeight="9"
          markerWidth="9"
          orient="auto"
          refX="4.5"
          refY="4.5"
        >
          <path d="M 0 0 L 9 4.5 L 0 9 z" fill="#f97316" />
        </marker>
        <linearGradient id="sectionFill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>

      <rect className="drawing-bg" x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} />

      <g transform={`translate(${MODEL_X} ${MODEL_Y})`}>
        <g className="model-elements" data-export-layer="model">
          <g className="section-elements" data-export-layer="section">
            <polygon className="section-shape" points={pointList(shapePoints)} />
            <line
              className="center-line"
              x1={centerTop.x}
              x2={centerBottom.x}
              y1={centerTop.y - 16}
              y2={centerBottom.y + 16}
            />
            <line
              className="reference-line"
              x1={bottomLeft.x - 18}
              x2={bottomRight.x + 18}
              y1={bottomLeft.y}
              y2={bottomRight.y}
            />
          </g>

          <g className="cap-elements" data-export-layer="caps">
            {capCircles.map((cap) => (
              <g key={cap.label}>
                <circle
                  className="cap-circle"
                  cx={cap.svgCenter.x}
                  cy={cap.svgCenter.y}
                  r={cap.svgRadius}
                />
                <line
                  className="center-line cap-center-line"
                  x1={cap.svgCenter.x - cap.svgRadius - 12}
                  x2={cap.svgCenter.x + cap.svgRadius + 12}
                  y1={cap.svgCenter.y}
                  y2={cap.svgCenter.y}
                />
                <line
                  className="center-line cap-center-line"
                  x1={cap.svgCenter.x}
                  x2={cap.svgCenter.x}
                  y1={cap.svgCenter.y - cap.svgRadius - 12}
                  y2={cap.svgCenter.y + cap.svgRadius + 12}
                />
                <text
                  className="cap-label"
                  x={cap.svgCenter.x}
                  y={
                    cap.measurementKey === "topDiameter"
                      ? cap.svgCenter.y - cap.svgRadius - 30
                      : cap.svgCenter.y + cap.svgRadius + 46
                  }
                >
                  {cap.label}
                </text>
              </g>
            ))}
          </g>
        </g>

        <g className="measurement-elements" data-export-layer="measurements">
          {visibility.topRadius && (
            <g data-measurement-key="topRadius">
              {extensionLine(sectionTopCenter.x, sectionTopCenter.y, sectionTopCenter.x, topRadiusY, "topRadius")}
              {extensionLine(topRight.x, topRight.y, topRight.x, topRadiusY, "topRadius")}
              <line
                className="dimension-line"
                x1={sectionTopCenter.x}
                x2={topRight.x}
                y1={topRadiusY}
                y2={topRadiusY}
              />
              {dimensionLabel(
                "topRadius",
                `윗반지름 ${formatLength(calc.rTop, unit)}`,
                (sectionTopCenter.x + topRight.x) / 2,
                topRadiusY - 10,
              )}
            </g>
          )}

          {visibility.topDiameter && (
            <g data-measurement-key="topDiameter">
              {extensionLine(topLeft.x, topLeft.y, topLeft.x, topDiameterY, "topDiameter")}
              {extensionLine(topRight.x, topRight.y, topRight.x, topDiameterY, "topDiameter")}
              <line
                className="dimension-line"
                x1={topLeft.x}
                x2={topRight.x}
                y1={topDiameterY}
                y2={topDiameterY}
              />
              {dimensionLabel(
                "topDiameter",
                `윗지름 ${formatLength(calc.dTop, unit)}`,
                sectionTopCenter.x,
                topDiameterY - 10,
              )}
            </g>
          )}

          {visibility.bottomDiameter && (
            <g data-measurement-key="bottomDiameter">
              {extensionLine(
                bottomLeft.x,
                bottomLeft.y,
                bottomLeft.x,
                bottomDiameterY,
                "bottomDiameter",
              )}
              {extensionLine(
                bottomRight.x,
                bottomRight.y,
                bottomRight.x,
                bottomDiameterY,
                "bottomDiameter",
              )}
              <line
                className="dimension-line"
                x1={bottomLeft.x}
                x2={bottomRight.x}
                y1={bottomDiameterY}
                y2={bottomDiameterY}
              />
              {dimensionLabel(
                "bottomDiameter",
                `아랫지름 ${formatLength(calc.dBottom, unit)}`,
                sectionBottomCenter.x,
                bottomDiameterY + 24,
              )}
            </g>
          )}

          {visibility.bottomRadius && (
            <g data-measurement-key="bottomRadius">
              {extensionLine(
                sectionBottomCenter.x,
                sectionBottomCenter.y,
                sectionBottomCenter.x,
                bottomRadiusY,
                "bottomRadius",
              )}
              {extensionLine(
                bottomRight.x,
                bottomRight.y,
                bottomRight.x,
                bottomRadiusY,
                "bottomRadius",
              )}
              <line
                className="dimension-line"
                x1={sectionBottomCenter.x}
                x2={bottomRight.x}
                y1={bottomRadiusY}
                y2={bottomRadiusY}
              />
              {dimensionLabel(
                "bottomRadius",
                `아랫반지름 ${formatLength(calc.rBottom, unit)}`,
                (sectionBottomCenter.x + bottomRight.x) / 2,
                bottomRadiusY + 24,
              )}
            </g>
          )}

          {visibility.height && (
            <g data-measurement-key="height">
              {extensionLine(topRight.x, topRight.y, heightX, topRight.y, "height")}
              {extensionLine(bottomRight.x, bottomRight.y, heightX, bottomRight.y, "height")}
              <line
                className="dimension-line"
                x1={heightX}
                x2={heightX}
                y1={topRight.y}
                y2={bottomRight.y}
              />
              <text
                className="dimension-text vertical-text"
                x={heightX - 32}
                y={(topRight.y + bottomRight.y) / 2}
              >
                높이 {formatLength(calc.height, unit)}
              </text>
            </g>
          )}

          {visibility.slantLength && (
            <g data-measurement-key="slantLength">
              <line
                className="dimension-line slant-dimension"
                x1={slantStart.x}
                x2={slantEnd.x}
                y1={slantStart.y}
                y2={slantEnd.y}
              />
              {dimensionLabel(
                "slantLength",
                `빗변 ${formatLength(calc.slantLength, unit)}`,
                slantLabelX,
                slantMid.y,
                "dimension-text slant-label",
              )}
            </g>
          )}

          {capCircles.map((cap) =>
            visibility[cap.measurementKey] ? (
              <g key={cap.label} data-measurement-key={cap.measurementKey}>
                <line
                  className="dimension-line cap-diameter-line"
                  x1={cap.svgCenter.x - cap.svgRadius}
                  x2={cap.svgCenter.x + cap.svgRadius}
                  y1={cap.svgCenter.y}
                  y2={cap.svgCenter.y}
                />
                {dimensionLabel(
                  cap.measurementKey,
                  `${cap.label} Ø${cap.diameter.toFixed(0)}`,
                  cap.svgCenter.x,
                  cap.measurementKey === "topDiameter"
                    ? cap.svgCenter.y + cap.svgRadius + 40
                    : cap.svgCenter.y + cap.svgRadius + 70,
                  "dimension-text cap-dimension-text",
                )}
              </g>
            ) : null,
          )}
        </g>

        {sectionMeasureOverlay}
      </g>

      <g
        className="supplemental-info"
        data-export-layer="supplemental-info"
        transform="translate(718 96)"
      >
        <rect className="supplemental-box" x="0" y="0" width="178" height="304" />
        <text className="supplemental-title" x="16" y="32">
          보조 정보
        </text>
        {supplementalRows.length === 0 ? (
          <text className="supplemental-empty" x="16" y="72">
            표시할 계산값 없음
          </text>
        ) : (
          supplementalRows.map(([label, value], index) => (
            <g key={label} transform={`translate(16 ${68 + index * 42})`}>
              <text className="supplemental-label" x="0" y="0">
                {label}
              </text>
              <text className="supplemental-value" x="0" y="20">
                {value}
              </text>
            </g>
          ))
        )}
      </g>

    </svg>
  );

  const flatPatternDrawing = (
    <svg
      className="drawing2d-svg flat-pattern-drawing"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      role="img"
      aria-label="원뿔대 전개 배치도"
    >
      <defs>
        <pattern id="cadGrid" width="62" height="62" patternUnits="userSpaceOnUse">
          <path d="M 62 0 H 0 V 62" className="cad-grid-major" />
          <path d="M 31 0 V 62 M 0 31 H 62" className="cad-grid-minor" />
        </pattern>
        <marker
          id="cadArrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#1d4ed8" />
        </marker>
        <marker
          id="measureArrow"
          markerHeight="9"
          markerWidth="9"
          orient="auto"
          refX="4.5"
          refY="4.5"
        >
          <path d="M 0 0 L 9 4.5 L 0 9 z" fill="#f97316" />
        </marker>
      </defs>

      <rect className="drawing-bg" x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} />

      <g className="model-elements" data-export-layer="model">
        <g className="cap-elements" data-export-layer="caps">
          <circle
            className="flat-cap-circle"
            cx={flatBottomCenter.x}
            cy={flatBottomCenter.y}
            r={flatBottomRadius}
          />
          <circle
            className="flat-cap-circle attached-cap"
            cx={flatTopCenter.x}
            cy={flatTopCenter.y}
            r={flatTopRadius}
          />
          <circle
            className="flat-attachment-point"
            cx={flatTopAttachPoint.x}
            cy={flatTopAttachPoint.y}
            r="3"
          />
        </g>

        <g className="side-pattern-elements" data-export-layer="side-pattern">
          <path className="flat-side-shape" d={flatSidePath} />
          <path className="cad-outline" d={linePath(flatOuterArc)} />
          <path className="cad-outline" d={linePath(flatInnerArc)} />
          <line
            className="cad-outline"
            x1={flatOuterStart.x}
            x2={flatInnerStart.x}
            y1={flatOuterStart.y}
            y2={flatInnerStart.y}
          />
          <line
            className="cad-outline"
            x1={flatOuterEnd.x}
            x2={flatInnerEnd.x}
            y1={flatOuterEnd.y}
            y2={flatInnerEnd.y}
          />
        </g>
      </g>

      <g className="measurement-elements cad-measurements" data-export-layer="measurements">
        {visibility.bottomDiameter && (
          <g data-measurement-key="bottomDiameter">
            <line
              className="cad-dimension"
              x1={flatBottomDiaStart.x}
              x2={flatBottomDiaEnd.x}
              y1={flatBottomDiaStart.y}
              y2={flatBottomDiaEnd.y}
            />
            <text
              className="cad-dimension-text cad-large-text"
              transform={rotateText(20, flatBottomDiaLabel)}
              x={flatBottomDiaLabel.x}
              y={flatBottomDiaLabel.y}
            >
              Ø{calc.dBottom.toFixed(0)}
            </text>
            <line
              className="cad-dimension"
              x1={flatBottomCircLabel.x - 22}
              x2={flatBottomCircTarget.x}
              y1={flatBottomCircLabel.y + 36}
              y2={flatBottomCircTarget.y}
            />
            <text
              className="cad-dimension-text"
              x={flatBottomCircLabel.x}
              y={flatBottomCircLabel.y}
            >
              <tspan x={flatBottomCircLabel.x}>둘레</tspan>
              <tspan x={flatBottomCircLabel.x} dy="32">
                {formatLength(calc.outerArcLength, unit)}
              </tspan>
            </text>
          </g>
        )}

        {visibility.topDiameter && (
          <g data-measurement-key="topDiameter">
            <line
              className="cad-extension"
              x1={flatTopCenter.x - flatTopRadius}
              x2={flatTopCenter.x - flatTopRadius}
              y1={flatTopCenter.y - flatTopRadius - 5}
              y2={flatTopDiameterY + 22}
            />
            <line
              className="cad-extension"
              x1={flatTopCenter.x + flatTopRadius}
              x2={flatTopCenter.x + flatTopRadius}
              y1={flatTopCenter.y - flatTopRadius - 5}
              y2={flatTopDiameterY + 22}
            />
            <line
              className="cad-dimension"
              x1={flatTopCenter.x - flatTopRadius}
              x2={flatTopCenter.x + flatTopRadius}
              y1={flatTopDiameterY}
              y2={flatTopDiameterY}
            />
            <text className="cad-dimension-text" x={flatTopCenter.x} y={flatTopDiameterY - 10}>
              윗반지름 Ø{calc.dTop.toFixed(0)}
            </text>
            <line
              className="cad-dimension"
              x1={flatTopCircLabel.x + 64}
              x2={flatTopCircTarget.x}
              y1={flatTopCircLabel.y - 18}
              y2={flatTopCircTarget.y}
            />
            <text className="cad-dimension-text" x={flatTopCircLabel.x} y={flatTopCircLabel.y}>
              둘레 {formatLength(calc.innerArcLength, unit)}
            </text>
          </g>
        )}

        {visibility.slantLength && (
          <g data-measurement-key="slantLength">
            <line
              className="cad-dimension"
              x1={flatInnerEnd.x}
              x2={flatOuterEnd.x}
              y1={flatInnerEnd.y}
              y2={flatOuterEnd.y}
            />
            <text
              className="cad-dimension-text slant-label"
              x={flatSlantLabel.x}
              y={flatSlantLabel.y}
            >
              빗변 {formatLength(calc.slantLength, unit)}
            </text>
          </g>
        )}
      </g>

      {flatMeasureOverlay}
    </svg>
  );

  return (
    <div className="drawing2d-shell">
      <div className="measure-toolbox" aria-label="2D 측정 도구">
        <span className="measure-toolbox-title">측정</span>
        {MEASURE_TOOLS.map((tool) => (
          <button
            aria-pressed={activeMeasureTool === tool.key}
            className={activeMeasureTool === tool.key ? "active" : ""}
            key={tool.key}
            type="button"
            onClick={() =>
              setActiveMeasureTool((current) =>
                current === tool.key ? null : tool.key,
              )
            }
          >
            <span
              aria-hidden="true"
              className={`measure-tool-icon measure-tool-icon-${tool.key}`}
            />
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="drawing-mode-toggle" aria-label="2D 도면 형태">
        <button
          className={drawingMode === "section" ? "active" : ""}
          type="button"
          onClick={() => setDrawingMode("section")}
        >
          정면도
        </button>
        <button
          className={drawingMode === "flat-pattern" ? "active" : ""}
          type="button"
          onClick={() => setDrawingMode("flat-pattern")}
        >
          전개 배치도
        </button>
      </div>
      {drawingMode === "section" ? sectionDrawing : flatPatternDrawing}
    </div>
  );
}
