import { assert } from '@ember/debug';

import { modifier } from 'ember-modifier';

import { meta } from '../-private/base';
import { ColumnResizing } from './plugin';

import type { Column } from '#/column';

/**
 * - why are mouse events used instead of drag events?
 * - why not use the "draggable" attribute?
 *
 * It seems drag events are more for files and/or moving images around on a page
 * dragging an image, for example, has a ghost of that image until it is dropped.
 * The same thing happens with text.
 * This prevents us from having total control of the styling of how dragging works.
 *
 *
 *
 */

/**
 * @example
 * ```hbs
 *   <div {{resizeHandle @column}}>
 * ```
 *
 * @param element the attached element
 * @param column the passed column instance
 */
export const resizeHandle = modifier(
  (element: Element, [column]: [Column]) => {
    let lastX: number | undefined;
    let raf: number | undefined;
    let columnMeta = meta.forColumn(column, ColumnResizing);
    /**
     * Because we're using requestAnimationFrame, it's possible that a
     * fast user/clicker (usually by accident) causes a second drag / mouse-move
     * event to start before the previous has finished.
     * to handle this, we want to cancel any animation frames lingering
     * from (in the very short-term history) around.
     *
     * An alternative approach would be to bundle all the state and function-handlers
     * into the handleDragStart function, so that all state was only maintained
     * "per drag start event", and totally isolated -- however, this can mess with
     * resize behavior, and cause glitchy ness due to separate, but parallel, resize
     * actions getting called in quick succession
     */

    function handleDrag(event: MouseEvent) {
      // return if (still) not left click
      if (event.button === 0) return;
      /**
       * Oofta, mousemove
       *
       * classic debounce, using request animation frame
       */
      if (raf) cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        if (columnMeta.isResizing) {
          assert('handleDrag must be called after handleDragStart', lastX);

          columnMeta.resize(event.clientX - lastX);
          lastX = event.clientX;
        }

        raf = undefined;
      });
    }

    function handleDragStop(_event: MouseEvent) {
      columnMeta.isResizing = false;
      lastX = undefined;

      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragStop);
      document.body.style.removeProperty('user-select');
    }

    function handleDragStart(event: Event) {
      assert('Wrong event binding. Expected MouseEvent', event instanceof MouseEvent);

      // return if not left click
      if (event.button !== 0) return;

      columnMeta.isResizing = true;
      lastX = event.clientX;

      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragStop);
      document.body.style.userSelect = 'none';
    }

    element.addEventListener('mousedown', handleDragStart);

    return () => {
      if (raf) cancelAnimationFrame(raf);

      columnMeta.isResizing = false;
      document.removeEventListener('mousedown', handleDragStart);
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragStop);
    };
  },
  { eager: false }
);
