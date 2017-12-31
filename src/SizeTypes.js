// @flow

export type TwoDimensional = [number, number];
export type Offset = TwoDimensional;
export type Size = TwoDimensional;

export type Layout = {
  style: $Shape<CSSStyleDeclaration>,
  offset: Offset,
  size: Size,
  isVisible: boolean,
};


export const ZeroOffset = [0, 0];


export function add2D(a: TwoDimensional, b: TwoDimensional) {
  return [a[0] + b[0], a[1] + b[1]];
}

export function subtract2D(a: TwoDimensional, b: TwoDimensional) {
  return [a[0] - b[0], a[1] - b[1]];
}
