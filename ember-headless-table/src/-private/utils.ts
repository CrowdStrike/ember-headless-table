import type { Destructor, FunctionModifier } from '#interfaces';

export function composeFunctionModifiers<Args extends unknown[]>(
  modifiers: Array<FunctionModifier<Args> | undefined>,
) {
  let setup = modifiers.filter(Boolean) as FunctionModifier<Args>[];

  let composed = (element: HTMLElement, ...args: Args) => {
    let destructors = setup.map((fn) => fn(element, ...args)).filter(Boolean) as Destructor[];

    return () => {
      for (let destructor of destructors) {
        destructor();
      }
    };
  };

  return composed;
}
