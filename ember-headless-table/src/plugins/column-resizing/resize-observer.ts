import { isDestroyed, isDestroying } from '@ember/destroyable';

/**
 * @private
 * included in the same file as the plugin due to circular dependency
 *
 * This goes on the containing element
 *
 * @example
 * ```hbs
 *  <div {{resizeObserver @table}}>
 *    <table>
 * ```
 */
export function resizeObserver(element: HTMLElement, table: any) {
  let observer = getObserver(element, table);

  observer.observe(element);

  return () => {
    observer.unobserve(element);
  };
}

let CACHE = new WeakMap<HTMLElement, ResizeObserver>();

/**
 * This is technically "inefficient" as you don't want too many resize
 * observers on a page, but tables are so big, that I don't see too many use cases
 * where you'd have 10+ tables on a page
 */
function getObserver(element: HTMLElement, table: any): ResizeObserver {
  let existing = CACHE.get(element);

  if (existing) return existing;

  existing = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    if (isDestroyed(table) || isDestroying(table)) {
      return;
    }

    for (let entry of entries) {
      table.handleScrollContainerResize(entry);
    }
  });

  return existing;
}
