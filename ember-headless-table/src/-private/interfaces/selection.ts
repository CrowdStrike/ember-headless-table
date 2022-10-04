/* eslint-disable @typescript-eslint/ban-types */
/**
 * Types minimally replicated here so we don't need to depend on the package that
 * actually defines these types
 *
 * This also enables a much broader variety of implementations as these interfaces
 * describe only what's needed by the headless table, and not the concrete implementation
 */
type CurrentState<T> =
  | {
      state: 'ALL' | 'NONE';
    }
  | {
      state: 'SOME';
      includeItems: T[];
    }
  | {
      state: 'ALL_EXCEPT';
      excludeItems: T[];
    };

/**
 * A table can provide a `Selection` object that matches this API
 */
export interface Selection<Item = object> {
  get selected(): Item[];
  get currentState(): CurrentState<Item>;
  get isIndeterminate(): boolean;
  get isAllSelected(): boolean;
  get numSelected(): number;
  get numTotal(): number;
  isSelected(item: Item): boolean;
  selectItem(item: Item): void;
  toggleItem(item: Item): void;
  toggleAll(): void;
  selectAll(): void;
  deselectAll(): void;
  deselectItem(item: Item): void;
}
