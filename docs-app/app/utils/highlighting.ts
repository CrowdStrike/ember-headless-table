import {
  associateDestroyableChild,
  isDestroyed,
  isDestroying,
  registerDestructor,
} from '@ember/destroyable';

import highlightCodeBlocks from './hljs';

import type ApplicationInstance from '@ember/application/instance';
import type RouterService from '@ember/routing/router-service';

export async function setupHLJS(owner: ApplicationInstance) {
  /**
   * This handles the initial Page Load, which is not imperceptible through
   * route{Did,Will}Change
   *
   */
  let highlighter = new Highlighter(owner);

  highlighter.start();
  // highlight right away, in case anything is rendered yet
  highlighter.highlight();

  let routerService = owner.lookup('service:router') as RouterService;

  associateDestroyableChild(routerService, highlighter);
}

class Highlighter {
  observer: MutationObserver;

  constructor(owner: ApplicationInstance) {
    this.observer = setupObserver(owner);

    registerDestructor(this, () => {
      this.observer.disconnect();
    });
  }

  highlight() {
    let codeElements = [...document.querySelectorAll('code')].filter((node) =>
      isUnhighlighted(node)
    );

    for (let element of codeElements) {
      highlightCodeBlocks(element as HTMLElement);
    }
  }

  start() {
    this.observer.observe(document.body, { childList: true, subtree: true });
  }
}

function setupObserver(owner: ApplicationInstance) {
  let frame: number;
  let cumulativePendingElements: HTMLElement[] = [];

  let observer = new MutationObserver((mutations) => {
    if (frame) {
      cancelAnimationFrame(frame);
    }

    let codeElements = mutations
      .map((mutation) => [mutation.target].filter((node) => isUnhighlighted(node)))
      .flat() as HTMLElement[];

    cumulativePendingElements.push(...codeElements);

    frame = requestAnimationFrame(async () => {
      if (isDestroyed(owner) || isDestroying(owner)) {
        return;
      }

      let current;

      while ((current = cumulativePendingElements.pop())) {
        // is this still a valid thing to highlight?
        if (isUnhighlighted(current)) {
          await highlightCodeBlocks(current as HTMLElement);
        }
      }
    });
  });

  return observer;
}

const languageTags = [
  'language-html',
  'language-glimmer',
  'language-javascript',
  'language-js',
  'language-typescript',
  'language-ts',
  'language-handlebars',
  'language-hbs',
  'language-go',
  'language-yaml',
];

function isAllowedInlineHighlight(className: string) {
  return languageTags.includes(className);
}

function isUnhighlighted(node: Node) {
  if (node instanceof HTMLElement) {
    // Code element, and that hasn't yet been highlighted
    let isJustText = node.tagName.toLowerCase() === 'code' && node.children.length === 0;

    // our Remark plugin will try to auto-detect languages,
    // and it's not always correct for inline-blocks
    let isUnrecognized = isJustText && ![...node.classList].some(isAllowedInlineHighlight);

    return isJustText && !isUnrecognized;
  }
}
