import type { HLJSApi } from 'highlight.js';

interface Options {
  /**
   * Optionally, provide the code to highlight with at the target element
   */
  code?: string;
}

export default async function highlightCodeBlocks(element: HTMLElement, options?: Options) {
  if (options?.code) {
    return highlightWith(element, options.code);
  }

  let elements: HTMLElement[] = [];

  if (element.tagName.toLowerCase() === 'code') {
    elements.push(element);
  } else {
    elements = [...element.querySelectorAll('pre > code')] as HTMLElement[];
  }

  for (let element of elements) {
    let hljs = await getHighlighter();

    hljs.highlightElement(element);
  }
}

async function highlightWith(element: HTMLElement, code: string) {
  let target = element.querySelector('code');

  if (!target) return;

  let [hljs, purify] = await Promise.all([getHighlighter(), getPurifier()]);

  let { value } = hljs.highlight(code, { language: target.classList[0] });

  target.innerHTML = purify.sanitize(value);
}

/**
 * Browsers cache imports, but this is an easy way to
 * let us only do the glimmer part below once
 */
let HIGHLIGHT: HLJSApi;

export async function getHighlighter(): Promise<HLJSApi> {
  if (HIGHLIGHT) return HIGHLIGHT;

  HIGHLIGHT = (await import('highlight.js')).default;

  // highlightjs-glimmer does not have type declarations (yet?)
  let { setup } = await import('highlightjs-glimmer');

  setup(HIGHLIGHT);

  HIGHLIGHT.registerAliases('gjs', { languageName: 'javascript' });

  return HIGHLIGHT;
}

async function getPurifier() {
  return (await import('dompurify')).default;
}
