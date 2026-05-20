import type {
  FrustumCalc,
  FrustumDimensions,
  Part,
  PartInfo,
} from "../types/frustum";

export const formatNumber = (value: number): string => value.toFixed(2);

export const calcFrustum = ({
  rTop,
  rBottom,
  height,
}: FrustumDimensions): FrustumCalc => {
  const dTop = rTop * 2;
  const dBottom = rBottom * 2;
  const radiusDiff = Math.abs(rBottom - rTop);
  const slantLength = Math.sqrt(height ** 2 + (rBottom - rTop) ** 2);
  const largerRadius = Math.max(rTop, rBottom);
  const smallerRadius = Math.min(rTop, rBottom);
  const outerDevelopmentRadius =
    radiusDiff === 0 ? 0 : (largerRadius / radiusDiff) * slantLength;
  const innerDevelopmentRadius =
    radiusDiff === 0 ? 0 : (smallerRadius / radiusDiff) * slantLength;
  const unfoldAngleDeg =
    outerDevelopmentRadius === 0
      ? 360
      : (largerRadius / outerDevelopmentRadius) * 360;
  const outerArcLength = 2 * Math.PI * largerRadius;
  const innerArcLength = 2 * Math.PI * smallerRadius;
  const topArea = Math.PI * rTop ** 2;
  const bottomArea = Math.PI * rBottom ** 2;
  const lateralArea = Math.PI * (rTop + rBottom) * slantLength;
  const totalAreaClosed = topArea + bottomArea + lateralArea;
  const volume =
    (Math.PI * height * (rTop ** 2 + rTop * rBottom + rBottom ** 2)) / 3;

  return {
    rTop,
    rBottom,
    height,
    dTop,
    dBottom,
    radiusDiff,
    slantLength,
    outerDevelopmentRadius,
    innerDevelopmentRadius,
    unfoldAngleDeg,
    outerArcLength,
    innerArcLength,
    volume,
    topArea,
    bottomArea,
    lateralArea,
    totalAreaClosed,
  };
};

export const formatLength = (value: number, unit: string): string =>
  `${formatNumber(value)} ${unit}`;

export const formatArea = (value: number, unit: string): string =>
  `${formatNumber(value)} ${unit}²`;

export const formatVolume = (value: number, unit: string): string =>
  `${formatNumber(value)} ${unit}³`;

export const formatAngle = (value: number): string => `${formatNumber(value)}°`;

const circumference = (radius: number): number => 2 * Math.PI * radius;

export const getPartInfo = (
  part: Part | null,
  dimensions: FrustumDimensions,
): PartInfo => {
  const calc = calcFrustum(dimensions);
  const unit = dimensions.unit;

  switch (part) {
    case "body":
      return {
        title: "본체 측면",
        rows: [
          { label: "옆면 면적", value: formatArea(calc.lateralArea, unit) },
          { label: "빗변 길이", value: formatLength(calc.slantLength, unit) },
          { label: "높이", value: formatLength(calc.height, unit) },
          { label: "윗반지름", value: formatLength(calc.rTop, unit) },
          { label: "아랫반지름", value: formatLength(calc.rBottom, unit) },
        ],
      };
    case "top":
      return {
        title: "윗 테두리",
        rows: [
          { label: "윗반지름", value: formatLength(calc.rTop, unit) },
          { label: "윗지름", value: formatLength(calc.dTop, unit) },
          { label: "윗면 면적", value: formatArea(calc.topArea, unit) },
          {
            label: "테두리 둘레",
            value: formatLength(circumference(calc.rTop), unit),
          },
        ],
      };
    case "bottom":
      return {
        title: "아랫 테두리",
        rows: [
          { label: "아랫반지름", value: formatLength(calc.rBottom, unit) },
          { label: "아랫지름", value: formatLength(calc.dBottom, unit) },
          { label: "아랫면 면적", value: formatArea(calc.bottomArea, unit) },
          {
            label: "테두리 둘레",
            value: formatLength(circumference(calc.rBottom), unit),
          },
        ],
      };
    case "topDiameter":
      return {
        title: "윗지름선",
        rows: [
          { label: "윗지름", value: formatLength(calc.dTop, unit) },
          { label: "윗반지름", value: formatLength(calc.rTop, unit) },
          { label: "윗면 면적", value: formatArea(calc.topArea, unit) },
        ],
      };
    case "bottomDiameter":
      return {
        title: "아랫지름선",
        rows: [
          { label: "아랫지름", value: formatLength(calc.dBottom, unit) },
          { label: "아랫반지름", value: formatLength(calc.rBottom, unit) },
          { label: "아랫면 면적", value: formatArea(calc.bottomArea, unit) },
        ],
      };
    case "height":
      return {
        title: "중심 높이선",
        rows: [
          { label: "높이", value: formatLength(calc.height, unit) },
          { label: "반지름 차이", value: formatLength(calc.radiusDiff, unit) },
          { label: "빗변 길이", value: formatLength(calc.slantLength, unit) },
        ],
      };
    case "slant":
      return {
        title: "빗변선 / 모선",
        rows: [
          { label: "빗변 길이", value: formatLength(calc.slantLength, unit) },
          { label: "높이", value: formatLength(calc.height, unit) },
          { label: "반지름 차이", value: formatLength(calc.radiusDiff, unit) },
          { label: "옆면 면적", value: formatArea(calc.lateralArea, unit) },
        ],
      };
    default:
      return {
        title: "원뿔대 전체",
        rows: [
          { label: "윗반지름", value: formatLength(calc.rTop, unit) },
          { label: "아랫반지름", value: formatLength(calc.rBottom, unit) },
          { label: "높이", value: formatLength(calc.height, unit) },
          { label: "윗지름", value: formatLength(calc.dTop, unit) },
          { label: "아랫지름", value: formatLength(calc.dBottom, unit) },
          { label: "빗변 길이", value: formatLength(calc.slantLength, unit) },
          {
            label: "전개 바깥 반지름",
            value: formatLength(calc.outerDevelopmentRadius, unit),
          },
          {
            label: "전개 안쪽 반지름",
            value: formatLength(calc.innerDevelopmentRadius, unit),
          },
          { label: "전개각", value: formatAngle(calc.unfoldAngleDeg) },
          { label: "윗면 면적", value: formatArea(calc.topArea, unit) },
          { label: "아랫면 면적", value: formatArea(calc.bottomArea, unit) },
          { label: "옆면 면적", value: formatArea(calc.lateralArea, unit) },
          { label: "닫힌 전체 면적", value: formatArea(calc.totalAreaClosed, unit) },
          { label: "부피", value: formatVolume(calc.volume, unit) },
        ],
      };
  }
};
