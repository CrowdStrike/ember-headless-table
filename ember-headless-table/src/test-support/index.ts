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

    triggerEvent(element, 'mousedown', { clientX: startX, button: 0 });
    triggerEvent(element, 'mousemove', { clientX: targetX, button: 0 });
    triggerEvent(element, 'mouseup', { clientX: targetX, button: 0 });

    await settled();

    /**
     * This has been super finnicky... :(
     */
    await new Promise((resolve) => setTimeout(resolve, 100));
    await requestAnimationFrameSettled();
  }

  return {
    dragLeft: (column: Element, amount: number) => resize(column, -amount),
    dragRight: (column: Element, amount: number) => resize(column, amount),
  };
}

export async function requestAnimationFrameSettled() {
  await new Promise(requestAnimationFrame);
  await settled();
}
