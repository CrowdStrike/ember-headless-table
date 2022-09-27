import Component from '@glimmer/component';
import { scrollToElement } from 'docs-app/utils/scroll-to';
import { action } from '@ember/object';
// @ts-ignore
import { on } from '@ember/modifier';

import DocfyOutput from '@docfy/ember/components/docfy-output';

const eq = (a: string, b: string) => a === b;

interface Signature {
  Args: {
    currentHeadingId: string;
  }
}

export default class PageHeadings extends Component<Signature> {
  @action
  onClick(evt: MouseEvent): void {
    const href = (evt.target as HTMLElement).getAttribute('href');
    if (href) {
      const toElement = document.querySelector(href) as HTMLElement;

      scrollToElement(toElement);
    }
  }

  <template>
    <div
      class="overflow-y-auto sticky top-16 max-h-(screen-16) pt-12 pb-4 -mt-12 text-sm"
    >
      {{! @glint-ignore }}
      <DocfyOutput @fromCurrentURL={{true}} as |page|>
        {{#if page.headings.length}}
          <ul>
            {{#each page.headings as |heading|}}
              <li class="pb-2 border-l border-gray-400 dark:border-gray-700">
                <a
                  href="#{{heading.id}}"
                  class="block px-2 py-1 border-l-2 hover:text-green-700
                  {{
                    if
                    (eq heading.id @currentHeadingId)
                    "border-green-700 text-green-700 dark:border-green-500 dark:text-green-500"
                    "border-transparent"
                  }}"
                  {{on "click" this.onClick}}
                >
                  {{heading.title}}
                </a>

                {{#if heading.headings.length}}
                  <ul class="">
                    {{#each heading.headings as |subHeading|}}
                      <li>
                        <a
                          href="#{{subHeading.id}}"
                          class="block pl-6 py-1 border-l-2  border-l-2 hover:text-green-700
                          {{
                            if
                            (eq subHeading.id @currentHeadingId)
                            "border-green-700 text-green-700 dark:border-green-500 dark:text-green-500"
                            "border-transparent"
                          }}"
                          {{on "click" this.onClick}}
                        >
                          {{subHeading.title}}
                        </a>
                      </li>
                    {{/each}}
                  </ul>
                {{/if}}
              </li>
            {{/each}}
          </ul>
        {{/if}}
      </DocfyOutput>
    </div>
  </template>
}
