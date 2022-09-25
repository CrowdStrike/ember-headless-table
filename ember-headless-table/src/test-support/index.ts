import { assert } from '@ember/debug';
import { settled, triggerEvent } from '@ember/test-helpers';

interface Selectors {
  resizeHandle: string;
}

export function createHelpers(selectors: Selectors) {
  async function resize(parent: Element, delta: number) {
    let element = parent.querySelector(selectors.resizeHandle);

    assert(`Can't resize without a handle`, element);

    /**
     * Start the click in exactly the middle of the element.
     * "startX" is the horizontal middle of "element"
     */
    let rect = element.getBoundingClientRect();
    let startX = (rect.right + rect.left) / 2;

    let targetX = startX + delta;

    await triggerEvent(element, 'mousedown', { clientX: startX, button: 0 });
    await triggerEvent(element, 'mousemove', { clientX: targetX, button: 0 });
    await triggerEvent(element, 'mouseup', { clientX: targetX, button: 0 });

    await new Promise((resolve) => setTimeout(resolve, 10));
    await new Promise(requestAnimationFrame);
    await settled();
    await new Promise(requestAnimationFrame);
    await settled();
  }

  return {
    dragLeft: (column: Element, amount: number) => resize(column, -amount),
    dragRight: (column: Element, amount: number) => resize(column, amount),
  };
}
