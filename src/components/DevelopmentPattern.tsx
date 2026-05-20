import type { FrustumCalc, FrustumDimensions } from "../types/frustum";

interface DevelopmentPatternProps {
  calc: FrustumCalc;
  dimensions: FrustumDimensions;
}

const toPoint = (cx: number, cy: number, radius: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

const describeAnnularSector = (
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  angleDeg: number,
) => {
  const safeAngle = Math.min(359.5, Math.max(1, angleDeg));
  const gap = 360 - safeAngle;
  const start = -90 + gap / 2;
  const end = start + safeAngle;
  const outerStart = toPoint(cx, cy, outerRadius, start);
  const outerEnd = toPoint(cx, cy, outerRadius, end);
  const innerStart = toPoint(cx, cy, innerRadius, start);
  const innerEnd = toPoint(cx, cy, innerRadius, end);
  const largeArc = safeAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
};

export default function DevelopmentPattern({
  calc,
  dimensions,
}: DevelopmentPatternProps) {
  const unit = dimensions.unit;
  const cx = 400;
  const cy = 320;
  const outerRadius = 255;
  const innerRadius = Math.max(
    44,
    (calc.innerDevelopmentRadius / calc.outerDevelopmentRadius) * outerRadius,
  );
  const angle = calc.unfoldAngleDeg;
  const sectorPath = describeAnnularSector(cx, cy, outerRadius, innerRadius, angle);
  const gap = 360 - Math.min(359.5, Math.max(1, angle));
  const start = -90 + gap / 2;
  const end = start + Math.min(359.5, Math.max(1, angle));
  const angleArcStart = toPoint(cx, cy, 120, start);
  const angleArcEnd = toPoint(cx, cy, 120, end);
  const outerLabel = toPoint(cx, cy, outerRadius + 25, 78);
  const innerLabel = toPoint(cx, cy, innerRadius + 48, 30);

  return (
    <section className="drawing-card pattern-card">
      <h2>전개도 <span>(펼친 모양)</span></h2>

      <svg viewBox="0 0 820 620" role="img" aria-label="원뿔대 전개도">
        <defs>
          <marker
            id="blueArrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#1d4ed8" />
          </marker>
          <marker
            id="redArrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#dc2626" />
          </marker>
        </defs>

        <path className="pattern-fill" d={sectorPath} />
        <circle className="construction-line" cx={cx} cy={cy} r="4" />
        <line className="construction-line" x1={cx - 285} x2={cx + 285} y1={cy} y2={cy} />
        <line className="construction-line" x1={cx} x2={cx} y1={cy - 285} y2={cy + 285} />

        <path
          className="angle-arc"
          d={`M ${angleArcStart.x} ${angleArcStart.y} A 120 120 0 ${
            angle > 180 ? 1 : 0
          } 1 ${angleArcEnd.x} ${angleArcEnd.y}`}
        />
        <text className="angle-label" x={cx} y="76">
          <tspan x={cx}>전개 각도</tspan>
          <tspan x={cx} dy="30">{angle.toFixed(0)}°</tspan>
        </text>

        <path
          className="blue-dim"
          d={`M ${cx - outerRadius - 30} ${cy + 78} A ${
            outerRadius + 28
          } ${outerRadius + 28} 0 0 0 ${cx + outerRadius - 5} ${cy + 94}`}
        />
        <text className="outer-arc-label" x={cx - 70} y={cy + outerRadius + 42}>
          바깥 호 길이
          <tspan x={cx - 70} dy="22">
            {calc.outerArcLength.toFixed(0)} {unit}
          </tspan>
        </text>

        <path
          className="red-dim"
          d={`M ${cx - innerRadius + 15} ${cy + innerRadius + 18} A ${
            innerRadius + 22
          } ${innerRadius + 22} 0 0 0 ${cx + innerRadius - 5} ${
            cy + innerRadius + 22
          }`}
        />
        <text className="inner-arc-label" x={cx - 36} y={cy + innerRadius + 72}>
          안쪽 호 길이
          <tspan x={cx - 36} dy="22">
            {calc.innerArcLength.toFixed(0)} {unit}
          </tspan>
        </text>

        <line
          className="blue-radius"
          x1={cx}
          x2={outerLabel.x}
          y1={cy}
          y2={outerLabel.y}
        />
        <text className="radius-label blue" x={outerLabel.x + 10} y={outerLabel.y - 5}>
          <tspan x={outerLabel.x + 10}>바깥 반지름</tspan>
          <tspan x={outerLabel.x + 10} dy="22">
            R = {calc.outerDevelopmentRadius.toFixed(0)}
          </tspan>
        </text>

        <line
          className="red-radius"
          x1={cx}
          x2={innerLabel.x}
          y1={cy}
          y2={innerLabel.y}
        />
        <text className="radius-label red" x={innerLabel.x + 8} y={innerLabel.y + 28}>
          <tspan x={innerLabel.x + 8}>안쪽 반지름</tspan>
          <tspan x={innerLabel.x + 8} dy="22">
            r = {calc.innerDevelopmentRadius.toFixed(0)}
          </tspan>
        </text>
      </svg>
    </section>
  );
}
