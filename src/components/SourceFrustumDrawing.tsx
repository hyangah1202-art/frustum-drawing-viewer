import type { FrustumCalc, FrustumDimensions } from "../types/frustum";

interface SourceFrustumDrawingProps {
  calc: FrustumCalc;
  dimensions: FrustumDimensions;
}

export default function SourceFrustumDrawing({
  calc,
  dimensions,
}: SourceFrustumDrawingProps) {
  const unit = dimensions.unit;

  return (
    <section className="drawing-card source-card">
      <h2>원뿔대 <span>(주어진 형상)</span></h2>

      <svg viewBox="0 0 360 610" role="img" aria-label="원뿔대 정면도와 평면도">
        <defs>
          <linearGradient id="frustumFace" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dfe4ea" />
          </linearGradient>
          <marker
            id="blackArrow"
            markerHeight="7"
            markerWidth="7"
            orient="auto"
            refX="6"
            refY="3.5"
          >
            <path d="M 0 0 L 7 3.5 L 0 7 z" fill="#20242c" />
          </marker>
        </defs>

        <g transform="translate(20 40)">
          <path
            className="shape-fill"
            d="M 73 128 L 128 24 Q 160 10 192 24 L 247 128 Q 250 145 160 156 Q 70 145 73 128 Z"
          />
          <ellipse className="shape-line" cx="160" cy="24" rx="32" ry="9" />
          <ellipse className="shape-line" cx="160" cy="128" rx="90" ry="22" />
          <path className="hidden-edge" d="M 70 128 Q 160 109 250 128" />
          <line className="center-line" x1="160" x2="160" y1="16" y2="158" />

          <line className="dim-line" x1="128" x2="192" y1="-18" y2="-18" />
          <line className="guide-line" x1="128" x2="128" y1="-15" y2="18" />
          <line className="guide-line" x1="192" x2="192" y1="-15" y2="18" />
          <text className="dim-text" x="160" y="-25">Ø{calc.dTop.toFixed(0)}</text>

          <line className="dim-line" x1="70" x2="250" y1="188" y2="188" />
          <line className="guide-line" x1="70" x2="70" y1="151" y2="191" />
          <line className="guide-line" x1="250" x2="250" y1="151" y2="191" />
          <text className="dim-text" x="160" y="206">Ø{calc.dBottom.toFixed(0)}</text>

          <line className="dim-line" x1="278" x2="278" y1="24" y2="128" />
          <line className="guide-line" x1="194" x2="282" y1="24" y2="24" />
          <line className="guide-line" x1="250" x2="282" y1="128" y2="128" />
          <text className="dim-text vertical" x="296" y="80">
            {calc.height.toFixed(0)}
          </text>
        </g>

        <g transform="translate(20 350)">
          <circle className="shape-fill" cx="160" cy="110" r="90" />
          <circle className="shape-line" cx="160" cy="110" r="90" />
          <circle className="shape-line" cx="160" cy="110" r="32" />
          <line className="center-line" x1="40" x2="280" y1="110" y2="110" />
          <line className="center-line" x1="160" x2="160" y1="0" y2="220" />

          <line className="dim-line" x1="128" x2="192" y1="-16" y2="-16" />
          <line className="guide-line" x1="128" x2="128" y1="-12" y2="80" />
          <line className="guide-line" x1="192" x2="192" y1="-12" y2="80" />
          <text className="dim-text" x="160" y="-23">Ø{calc.dTop.toFixed(0)}</text>

          <line className="dim-line" x1="70" x2="250" y1="244" y2="244" />
          <line className="guide-line" x1="70" x2="70" y1="197" y2="247" />
          <line className="guide-line" x1="250" x2="250" y1="197" y2="247" />
          <text className="dim-text" x="160" y="262">Ø{calc.dBottom.toFixed(0)}</text>
        </g>
      </svg>

      <div className="check-box">
        <strong>확인</strong>
        <p>전개한 바깥 호 길이는 실제 밑면 둘레와 같아야 합니다.</p>
        <p>2πR = 2π × {calc.rBottom.toFixed(0)} = {calc.outerArcLength.toFixed(0)} {unit}</p>
        <p>전개한 안쪽 호 길이는 실제 윗면 둘레와 같아야 합니다.</p>
        <p>2πr = 2π × {calc.rTop.toFixed(0)} = {calc.innerArcLength.toFixed(0)} {unit}</p>
      </div>
    </section>
  );
}
