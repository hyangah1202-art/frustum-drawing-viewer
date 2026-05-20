import type { FrustumDimensions } from "../types/frustum";

export interface ModelPoint2D {
  x: number;
  y: number;
}

export interface SvgPoint2D {
  x: number;
  y: number;
}

export interface FrontViewCoordinates {
  topY: number;
  bottomY: number;
  topLeft: ModelPoint2D;
  topRight: ModelPoint2D;
  bottomLeft: ModelPoint2D;
  bottomRight: ModelPoint2D;
  centerTop: ModelPoint2D;
  centerBottom: ModelPoint2D;
}

export interface ModelBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SvgScaleConfig {
  width: number;
  height: number;
  padding: number;
}

export interface SvgTransform2D {
  scale: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export const getFrontViewCoordinates = (
  dimensions: FrustumDimensions,
): FrontViewCoordinates => {
  const topY = dimensions.height / 2;
  const bottomY = -dimensions.height / 2;

  return {
    topY,
    bottomY,
    topLeft: { x: -dimensions.rTop, y: topY },
    topRight: { x: dimensions.rTop, y: topY },
    bottomLeft: { x: -dimensions.rBottom, y: bottomY },
    bottomRight: { x: dimensions.rBottom, y: bottomY },
    centerTop: { x: 0, y: topY },
    centerBottom: { x: 0, y: bottomY },
  };
};

export const getFrontViewBounds = (
  coordinates: FrontViewCoordinates,
): ModelBounds => ({
  minX: Math.min(
    coordinates.topLeft.x,
    coordinates.topRight.x,
    coordinates.bottomLeft.x,
    coordinates.bottomRight.x,
  ),
  maxX: Math.max(
    coordinates.topLeft.x,
    coordinates.topRight.x,
    coordinates.bottomLeft.x,
    coordinates.bottomRight.x,
  ),
  minY: Math.min(coordinates.topY, coordinates.bottomY),
  maxY: Math.max(coordinates.topY, coordinates.bottomY),
});

export const calculateSvgScale = (
  bounds: ModelBounds,
  config: SvgScaleConfig,
): SvgTransform2D => {
  const modelWidth = Math.max(1, bounds.maxX - bounds.minX);
  const modelHeight = Math.max(1, bounds.maxY - bounds.minY);
  const drawableWidth = Math.max(1, config.width - config.padding * 2);
  const drawableHeight = Math.max(1, config.height - config.padding * 2);
  const scale = Math.min(drawableWidth / modelWidth, drawableHeight / modelHeight);
  const modelCenterX = (bounds.minX + bounds.maxX) / 2;
  const modelCenterY = (bounds.minY + bounds.maxY) / 2;

  return {
    scale,
    originX: config.width / 2 - modelCenterX * scale,
    originY: config.height / 2 + modelCenterY * scale,
    width: config.width,
    height: config.height,
  };
};

export const toSvgPoint = (
  point: ModelPoint2D,
  transform: SvgTransform2D,
): SvgPoint2D => ({
  x: transform.originX + point.x * transform.scale,
  y: transform.originY - point.y * transform.scale,
});

export const offsetSvgPoint = (
  point: SvgPoint2D,
  offsetX: number,
  offsetY: number,
): SvgPoint2D => ({
  x: point.x + offsetX,
  y: point.y + offsetY,
});
