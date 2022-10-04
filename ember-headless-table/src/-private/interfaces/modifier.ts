export interface Destructor {
  (): void;
}

export interface FunctionModifier<Args extends unknown[]> {
  (element: HTMLElement, ...args: Args): void | Destructor;
}
