// @flow

import * as React from 'react';
import debounce from 'lodash.debounce';
import generateLayoutsForChildren from './generateLayoutsForChildren';
import type { ElementWidthFunction } from './generateLayoutsForChildren';
import type { Offset, Layout, Size } from './SizeTypes';
import { ZeroOffset, add2D, subtract2D } from './SizeTypes';
import Viewport from './Viewport';


export type Props = {
  children: React.ChildrenArray<React.Element<any>>,
  className?: string,
  style?: CSSStyleDeclaration,
  animationDuration: number,
  elementWidthFunction?: ElementWidthFunction,
};


export type State = {
  isAnimating: boolean,
  containerSize: ?Size,
  viewportOffset: Offset,
  cachedChildren: ?React.ChildrenArray<React.Element<any>>,
  renderedElementCount: number,
};


export default class UIHierarchy<O: Props> extends React.Component<O, State> {
  state = {
    isAnimating: false,
    containerSize: null,
    viewportOffset: [0, 0],
    cachedChildren: null,
    renderedElementCount: 0,
  };

  static defaultProps = {
    animationDuration: 2000,
  };

  containerElement: ?HTMLDivElement;
  animationTimeout: ?number;
  childrenDebounceTimeout: ?number;

  stopAnimationAndUpdateContainerSize = debounce((() => {
    this.clearAnimationTimeout();
    this.setState({
      isAnimating: false,
      containerSize: this.containerSize(),
    });
  }), 20);


  componentDidMount() {
    window.addEventListener('resize', this.stopAnimationAndUpdateContainerSize);
    this.setState({
      renderedElementCount: React.Children.count(this.props.children),
      containerSize: this.containerSize(),
    });
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.stopAnimationAndUpdateContainerSize);
    // Ensure no setState is called after unmounting
    this.clearAnimationTimeout();
  }


  componentWillReceiveProps(nextProps: O) {
    const previousCount = React.Children.count(this.props.children);
    const nextCount = React.Children.count(nextProps.children);

    if (previousCount === nextCount) {
      return;
    }

    if (previousCount > nextCount) {
      // Ensure a removed child stays visible until it is completely outside the viewport
      this.setState({ cachedChildren: this.props.children });
      if (this.childrenDebounceTimeout) clearTimeout(this.childrenDebounceTimeout);
      this.childrenDebounceTimeout = setTimeout(() => {
        this.setState({ cachedChildren: null });
        clearTimeout(this.childrenDebounceTimeout);
      }, this.props.animationDuration);
    }

    // This means every change in element counts is rendered twice:
    // Once with the old element count, once with the new element count. Without this, added
    // children would not slide in, but the component would directly render them in their final
    // position.
    setTimeout(() => {
      this.setState({ renderedElementCount: nextCount });
    }, 0);

    this.triggerAnimation();
  }


  render() {
    const elementCount = this.state.renderedElementCount;
    const { containerSize } = this.state;

    let childrenLayouts = null;
    let currentChildLayout = null;
    let viewportOffset = ZeroOffset;

    if (containerSize && elementCount) {
      childrenLayouts = generateLayoutsForChildren({ elementCount, containerSize });
      currentChildLayout = childrenLayouts[elementCount - 1];
      viewportOffset = subtract2D(
        add2D(currentChildLayout.offset, currentChildLayout.size),
        containerSize
      );
    }

    const ref = (div) => {
      this.containerElement = div;
      if (typeof this.props.ref === 'function') this.props.ref(div);
    };
    const className = [this.props.className, 'UIHierarchy'].filter(Boolean).join(' ');
    const style = Object.assign({}, { overflow: 'hidden' }, this.props.style);
    const changedProps = { style, ref, className };
    const divProps = Object.assign({}, this.props, changedProps);

    return (<div {...divProps} data-animated={this.state.isAnimating} data-count={elementCount}>
      <Viewport
        offset={viewportOffset}
        isAnimating={this.state.isAnimating}
        animationDuration={this.props.animationDuration}
      >
        {childrenLayouts ? this.renderChildren(childrenLayouts) : null}
      </Viewport>
    </div>);
  }


  // Renders cached or current children with merged style attributes for their layout.
  renderChildren(childrenLayouts: Layout[]) {
    return React.Children.map(
      this.state.cachedChildren || this.props.children,
      (child, index) => React.cloneElement(child, {
        ariaHidden: !childrenLayouts[index].isVisible,
        style: Object.assign(
          {},
          child.props.style,
          childrenLayouts[index].style,
          this.animationStyle(),
        ),
      }));
  }


  animationStyle(): $Shape<CSSStyleDeclaration> {
    const transition = ['transform', 'opacity', 'width', 'height']
      .map(a => `${a} ${this.props.animationDuration}ms ease-out`)
      .join(', ');

    return this.state.isAnimating ? {
      transition,
      pointerEvents: 'none',
    } : {};
  }


  triggerAnimation() {
    this.clearAnimationTimeout();

    this.setState({ isAnimating: true });

    this.animationTimeout = setTimeout(() => {
      this.clearAnimationTimeout();
      this.setState({ isAnimating: false });
    }, this.props.animationDuration);
  }


  clearAnimationTimeout() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
  }


  containerSize(): ?Size {
    const containerElement = this.containerElement;
    if (!containerElement) return null;
    return [containerElement.offsetWidth, containerElement.offsetHeight];
  }
}
