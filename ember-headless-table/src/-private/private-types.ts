/**
 * Private utility types
 */

export type Constructor<T, Args extends any[] = any[]> = new (...args: Args) => T;
export type Class<T> = Constructor<T>;
