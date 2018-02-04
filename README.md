# `<UIHierarchy />`, a simple responsive app navigation component for React.

**Beware, this might not be production-ready yet!**

A component that helps you to create UI navigation hierarchies. Like the ones you know from native
mobile applications, but with a twist: It creates a tablet-compatible UI from a phone-compatible UI
automatically.

This approach restricts your design, but it forces you to create minimal UI flows first, which will improve your tablet/desktop UIs automatically. It works very well for master-detail views, but not for every app – use it where applicable!

Interested? [See how it looks](https://opyh.github.io/react-ui-hierarchy-example/), or [look at the example code](https://github.com/opyh/react-ui-hierarchy-example)!

## Installation

```bash
npm i --save react-ui-hierarchy
```

## Basic Usage

```javascript
import UIHierarchy from 'react-ui-hierarchy';

// in your component:
return (<UIHierarchy>
  {/* Your children elements go here (one child element per hierarchy level) */}
</UIHierarchy>);
```

That's it.

Depending on the viewport size, the component will display only the last child element, or the last
`n` children that fit inside the viewport.

Children elements added at runtime will slide into the view with an animation. If you remove the
last element, it will slide out.

UIHierarchy will keep removed elements in the DOM and unmount them with a delay, so they stay
mounted until the slide-out animation finishes and they are not visible anymore.

## Layout and Styling

UIHierarchy renders all children elements with an enclosing `<div>` element that you have to style
yourself:

```html
<UIHierarchy className="main-view" style="…">
  {/* children go here */}
</UIHierarchy>
```

## Customizing children layout

The component tries to provide sensible defaults for most environments. If it doesn't work for your
use case, you can customize layout with these props:

- `animationDuration`: Duration of the slide animations, in milliseconds.
- `minWidthForMultipleElementsFunction(containerWidth)`: A function that returns the minimal
  container width (in pixels) at which the component will switch from phone to tablet/desktop
  layout. Default: `Math.max(300, containerWidth / 4)`
- `widthFunction(hierarchyLevel, visibleElementCount, elementCount, containerWidth)`: A function
  that returns the width (in pixels) of each child depending on

  - the displayed hierarchy level
  - the number of (visible) child elements
  - the current container width in pixels.

  If the returned values do not add up to the container width, the component will try to make sense
  of the returned values by itself. If you want to associate specific widths with specific child
  element types, you can create this function at runtime.
