/**
 * Private utility types
 */

export interface Constructor<T, Args extends any[] = any[]> {
  new (...args: Args): T;
}
export type Class<T> = Constructor<T>;
