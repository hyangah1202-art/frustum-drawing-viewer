import {
  formatAngle,
  formatLength,
  formatNumber,
} from "../lib/frustum";
import type { FrustumCalc, FrustumDimensions } from "../types/frustum";

interface DevelopmentSummaryProps {
  calc: FrustumCalc;
  dimensions: FrustumDimensions;
}

export default function DevelopmentSummary({
  calc,
  dimensions,
}: DevelopmentSummaryProps) {
  const unit = dimensions.unit;
  const largerRadius = Math.max(calc.rTop, calc.rBottom);
  const smallerRadius = Math.min(calc.rTop, calc.rBottom);

  return (
    <section className="summary-grid">
      <div className="summary-card">
        <h2>전개도 치수 요약</h2>
        <table>
          <tbody>
            <tr>
              <th><span className="dot blue-dot" />바깥 반지름</th>
              <td>R = {formatLength(calc.outerDevelopmentRadius, unit)}</td>
            </tr>
            <tr>
              <th><span className="dot red-dot" />안쪽 반지름</th>
              <td>r = {formatLength(calc.innerDevelopmentRadius, unit)}</td>
            </tr>
            <tr>
              <th><span className="dot blue-dot" />전개 각도</th>
              <td>θ = {formatAngle(calc.unfoldAngleDeg)}</td>
            </tr>
            <tr>
              <th><span className="dot blue-dot" />바깥 호 길이</th>
              <td>{formatLength(calc.outerArcLength, unit)}</td>
            </tr>
            <tr>
              <th><span className="dot red-dot" />안쪽 호 길이</th>
              <td>{formatLength(calc.innerArcLength, unit)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="summary-card formula-card">
        <h2>계산 과정 <span>(참고)</span></h2>
        <p>
          모선길이 l = √((R₀ - r₀)² + h²)
          = √({calc.radiusDiff.toFixed(0)}² + {calc.height.toFixed(0)}²)
          = {formatLength(calc.slantLength, unit)}
        </p>
        <p>
          전개 바깥 반지름 R = R₀ / (R₀ - r₀) × l
          = {largerRadius.toFixed(0)} / {calc.radiusDiff.toFixed(0)} ×{" "}
          {formatNumber(calc.slantLength)}
          = {formatLength(calc.outerDevelopmentRadius, unit)}
        </p>
        <p>
          전개 안쪽 반지름 r = R - l
          = {formatNumber(calc.outerDevelopmentRadius)} -{" "}
          {formatNumber(calc.slantLength)}
          = {formatLength(calc.innerDevelopmentRadius, unit)}
        </p>
        <p>
          전개 각도 θ = R₀ / R × 360°
          = {largerRadius.toFixed(0)} / {formatNumber(calc.outerDevelopmentRadius)} ×
          360° = {formatAngle(calc.unfoldAngleDeg)}
        </p>
        <p>
          호 길이 확인: 바깥 2π × {largerRadius.toFixed(0)} ={" "}
          {formatLength(calc.outerArcLength, unit)}, 안쪽 2π ×{" "}
          {smallerRadius.toFixed(0)} = {formatLength(calc.innerArcLength, unit)}
        </p>
      </div>
    </section>
  );
}
