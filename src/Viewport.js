// @flow

import * as React from 'react';
import type { Offset } from './SizeTypes';

type Props = {
  children: React.Node,
  offset: Offset,
  isAnimating: boolean,
  animationDuration: number,
};

export default function Viewport(props: Props) {
  let transition = null;
  if (props.isAnimating) {
    transition = `transform ${props.animationDuration}ms ease-out`;
  }

  const style = {
    transition,
    transform: `translate3d(${-props.offset[0]}px, ${-props.offset[1]}, 0)`,
    width: '100%',
    height: '100%',
  }
  return <div className="UIHierarchy-Viewport" style={style}>{props.children}</div>
}