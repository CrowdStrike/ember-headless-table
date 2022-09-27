import { registerDestructor } from '@ember/destroyable';

import Modifier from 'ember-modifier';

import { meta } from '../-private/base';
import { ColumnResizing } from './plugin';

import type { ColumnMeta } from './plugin';
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

class ResizeHandle extends Modifier<{ Args: { Positional: [Column] } }> {
  declare dragHandle: HTMLElement;
  declare column: Column;
  declare meta: ColumnMeta;

  // Pointer
  pointerStartX = 0;
  pointerStartY = 0;
  pointerX = 0;
  pointerY = 0;
  declare dragFrame: number;

  // Keyboard
  keyDistance = 0;
  declare keyFrame: number; // ha
  declare lastKey: number;

  isSetup = false;
  modify(element: Element, [column]: [Column]) {
    this.column = column;
    this.meta = meta.forColumn(column, ColumnResizing);
    this.dragHandle = element as HTMLElement;

    if (!this.isSetup) {
      this.isSetup = true;
      this.setup();
    }
  }

  setup = () => {
    this.dragHandle.addEventListener('touchstart', this.dragStartHandler);
    this.dragHandle.addEventListener('mousedown', this.dragStartHandler);
    this.dragHandle.addEventListener('keydown', this.keyHandler);

    registerDestructor(this, () => {
      this.meta.isResizing = false;

      this.dragHandle.removeEventListener('touchstart', this.dragStartHandler);
      this.dragHandle.removeEventListener('mousedown', this.dragStartHandler);
      window.removeEventListener('touchmove', this.dragMove);
      window.removeEventListener('touchend', this.dragEndHandler);
      window.removeEventListener('mousemove', this.dragMove);
      window.removeEventListener('mouseup', this.dragEndHandler);
      this.dragHandle.removeEventListener('keydown', this.keyHandler);
    });
  };

  setPosition = (event: Event) => {
    if (!(event instanceof PointerEvent || event instanceof MouseEvent)) return;

    if ('TouchEvent' in window && event instanceof TouchEvent) {
      let firstTouch = event.touches[0];

      if (!firstTouch) return;

      this.pointerX = firstTouch.clientX;
      this.pointerY = firstTouch.clientY;
    } else {
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
    }
  };

  setStartPosition = (event: Event) => {
    if (!(event instanceof PointerEvent || event instanceof MouseEvent)) return;

    if ('TouchEvent' in window && event instanceof TouchEvent) {
      let firstTouch = event.touches[0];

      if (!firstTouch) return;

      this.pointerStartX = firstTouch.clientX;
      this.pointerStartY = firstTouch.clientY;
    } else {
      this.pointerStartX = event.clientX;
      this.pointerStartY = event.clientY;
    }
  };

  queueUpdate = () => {
    cancelAnimationFrame(this.dragFrame);
    this.dragFrame = requestAnimationFrame(() => {
      this.meta.resize(this.pointerX - this.pointerStartX);
      this.pointerStartX = this.pointerX;
    });
  };

  dragEndHandler = () => {
    this.meta.isResizing = false;
    this.queueUpdate();

    /**
     * No need to listen if we aren't dragging
     */
    window.removeEventListener('touchmove', this.dragMove);
    window.removeEventListener('touchend', this.dragEndHandler);
    window.removeEventListener('mousemove', this.dragMove);
    window.removeEventListener('mouseup', this.dragEndHandler);
  };

  dragMove = (event: Event) => {
    if (!this.meta.isResizing) return;
    this.setPosition(event);
    this.queueUpdate();
  };

  dragStartHandler = (event: Event) => {
    if (!(event instanceof PointerEvent || event instanceof MouseEvent)) return;

    this.meta.isResizing = true;
    if (event.target !== this.dragHandle) return;

    this.setPosition(event);
    this.setStartPosition(event);

    window.addEventListener('touchend', this.dragEndHandler);
    window.addEventListener('touchmove', this.dragMove);
    window.addEventListener('mousemove', this.dragMove);
    window.addEventListener('mouseup', this.dragEndHandler);
  };

  keyHandler = (event: KeyboardEvent) => {
    let deltaT = new Date().getTime() - this.lastKey;
    let isRapid = deltaT < 50;

    if (event.code === 'ArrowDown' || event.code === 'ArrowRight') {
      this.keyDistance += isRapid ? 8 : 1;
      this.lastKey = new Date().getTime();
    }

    if (event.code === 'ArrowUp' || event.code === 'ArrowLeft') {
      this.keyDistance -= isRapid ? 8 : 1;
      this.lastKey = new Date().getTime();
    }

    cancelAnimationFrame(this.keyFrame);
    this.keyFrame = requestAnimationFrame(() => {
      this.meta.resize(this.keyDistance);

      this.keyDistance = 0;
    });
  };
}

/**
 * Modifier to attach to the column resize handles.
 * This provides both keyboard and mouse support for resizing columns.
 * (provided the resize handle element is focusable -- so consider using
 * a button for the resize element)
 *
 * @example
 * ```js
 * import Component from '@glimmer/component';
 * import { meta } from 'ember-headless-table/plugins';
 * import { resizeHandle, ColumnResizing } from 'ember-headless-table/plugins/column-resizing';
 *
 * export default class TableHead extends Component {
 *   /* ✂️  *\/
 *
 *   <template>
 *     <thead>
 *       <tr>
 *         {{#each this.columns as |column|}}
 *           <th>
 *             <span>{{column.name}}</span>
 *             <button {{resizeHandle column}}></button>
 *           </th>
 *         {{/each}}
 *       </tr>
 *     </thead>
 *   </template>
 * }
 * ```
 *
 * Width and isResizing state is maintained on the "meta"
 * class so that the users may choose per-column stylings for
 * isResizing and dragging behaviors.
 *
 * For example, while dragging, the user may add a class based on the
 * isDragging property.
 *
 * @example
 * ```js
 * import Component from '@glimmer/component';
 * import { meta } from 'ember-headless-table/plugins';
 * import { resizeHandle, ColumnResizing } from 'ember-headless-table/plugins/column-resizing';
 *
 * export default class TableHead extends Component {
 *   /* ✂️  *\/
 *
 *   isDragging = (column) => {
 *     return meta.forColumn(column, ColumnResizing).isDragging;
 *   }
 *
 *   <template>
 *     <thead>
 *       <tr>
 *         {{#each this.columns as |column|}}
 *           <th class="header {{if (this.isDragging column) 'blue'}}">
 *             <span>{{column.name}}</span>
 *             <button {{resizeHandle column}}></button>
 *           </th>
 *         {{/each}}
 *       </tr>
 *     </thead>
 *   </template>
 * }
 * ```
 *
 *
 * @note
 * The logic here is copied from the drag slider in
 * https://limber.glimdown.com/
 * See: "resize-handle" on Limber's GitHub
 */
export const resizeHandle = ResizeHandle;
