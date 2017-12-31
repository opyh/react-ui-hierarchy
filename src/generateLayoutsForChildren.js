// @flow

import type { Offset, Layout, Size } from './SizeTypes';


export type ElementWidthFunction =
  ((hierarchyLevel: number, count: number, containerWidth: number, elementCount: number) => number);


export const defaults = {
  minWidthForMultipleElementsFunction(containerWidth: number) {
    return Math.max(300, containerWidth / 4);
  },
  widthFunction(hierarchyLevel: number, count: number, elementCount: number, containerWidth: number) {
    if (elementCount === 2) {
      if (hierarchyLevel === 0) return containerWidth / 3;
      if (hierarchyLevel === 1) return 2 * containerWidth / 3;
    }
    return Math.floor(containerWidth / count);
  },
};


const layoutCSS = (params: {
  size: Size,
  offset: Offset,
  isVisible: boolean,
}): Layout => ({
  offset: params.offset,
  size: params.size,
  isVisible: params.isVisible,
  style: {
    width: `${params.size[0]}px`,
    height: `${params.size[1]}px`,
    opacity: params.isVisible ? '1' : '0.5',
    top: '0',
    left: '0',
    position: 'absolute',
    transform: `translate3d(${params.offset[0]}px, ${params.offset[1]}, 0)`,
  },
});


type Params = {
  elementCount: number,
  containerSize: Size,
  widthFunction?: ElementWidthFunction,
  minWidthForMultipleElementsFunction?: ((containerWidth: number) => number),
  isRecursive?: boolean,
};


export function generateLayoutsForOneVisibleChild({
  elementCount,
  containerSize,
}: {
  elementCount: number,
  containerSize: Size,
}): Layout[] {
  // Leave elements in higher hierarchy levels opaque,
  // but move them outside the viewport + stack them there.
  return Array.apply(null, Array(elementCount + 1))
    .map((el, index) => layoutCSS(Object.assign({}, {
      size: containerSize,
      offset: [index * containerSize[0], 0],
      isVisible: index === elementCount - 1,
    })));
}


export default function generateLayoutsForChildren({
  elementCount,
  containerSize,
  widthFunction = defaults.widthFunction,
  minWidthForMultipleElementsFunction = defaults.minWidthForMultipleElementsFunction,
  isRecursive = true,
}: Params): Layout[] {
  let offsetX: ?number = null;

  // The following is a bit more complex to avoid non-integer subpixel widths
  const minWidth = minWidthForMultipleElementsFunction(containerSize[0]);

  const maxElementCountOnScreen = Math.min(
    Math.max(
      1,
      Math.floor(containerSize[0] / minWidth),
    ),
  3);

  if (maxElementCountOnScreen === 1) {
    return generateLayoutsForOneVisibleChild({ elementCount, containerSize });
  }

  const visibleControllerCount = Math.min(maxElementCountOnScreen, elementCount);

  offsetX = null;

  return Array.apply(null, Array(elementCount + (isRecursive ? 1 : 0))).map((element, index) => {
    let width;

    if (index === elementCount) {
      // Popped or pushed element, outside the viewport.
      if (isRecursive) {
        const layouts = generateLayoutsForChildren({
          elementCount: elementCount + 1, containerSize, widthFunction, minWidth, isRecursive: false
        });
        width = layouts[layouts.length - 1].size[0];
      } else {
        width = Math.floor(widthFunction(index + 1, visibleControllerCount, elementCount, containerSize[0]));
      }
    } else {
      width = Math.floor(widthFunction(index, visibleControllerCount, elementCount, containerSize[0]));
    }

    if (offsetX === null) {
      offsetX = -(elementCount - visibleControllerCount) * width;
    }

    const result = layoutCSS({
      offset: [offsetX || 0, 0],
      size: [width, containerSize[1]],
      isVisible: index !== elementCount,
    });

    offsetX += width;

    return result;
  });
}
