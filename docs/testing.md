# Testing

Testing a table's data can be done entirely however you want to for for you app.
But some behaviors are a non-trivial to simulate in a test environment -- for those, there are some provided helpers, dependency-free.

API Documentation available [here][api-docs]

[api-docs]: /api/modules/test_support


## Helpers

There are two available helpers, `createHelpers` (which provides some more helpers), and `requestAnimationFrameSettled`, which is like `settled` from `@ember/test-helpers`, but waits for the next available animation frame in the browser,
and then `await settled()`s. This is useful because the DOM-calculations are done based on animation-frame timing
to reduce impact on the browser as much as possible.

```js
import {
  createHelpers,
  requestAnimationFrameSettled
} from 'ember-headless-table/test-support';

```

### `createHelpers`

`createHelpers` takes custom selectors, depending on how you've implemented your table.


```js
let helpers = createHelpers({
  resizeHandle: 'your-css-selector-used-for-all-resize-handles', // optional
  // example:
  // resizeHandle: '[data-resize-handle]',
  scrollContainer: 'your-css-selector-used-for-the-scroll-container-or-wrapping-div', // optional
  // example:
  // scrollContainer: '[data-scroll-container]',
});
```


While both of these arguments are optional, the subsequent helpers will error if the needed selector is missing.

Each of these helpers, when `await`ed, will use `await requestAnimationFrameSettled()` internally.

#### dragging column widths

_requires the `resizeHandle` selector be specified_.

Individual columns may be dragged left or right, based on the column (as an element), and the number of pixels you wish to resize by

```js
await helpers.dragLeft(secondColumnElement, 20);
await helpers.dragRight(secondColumnElement, -20);
```

#### scrolling

_requires the `scrollContainer` selector be specified_.

Scrolls or swipes the container by a specified pixel amount.

```js
await helpers.swipeLeft(20);
// aliased as
await helpers.scrollRight(20);

// or
await helpers.swipeRight(20);
// aliased as
await helpers.scrollLeft(20);
```

Note that swiping and scrolling are inverses of each other.
