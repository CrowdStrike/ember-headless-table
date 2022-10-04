import "@glint/environment-ember-loose";
import "@glint/environment-ember-template-imports";

// Types from libraries
import "ember-page-title/glint";
import "@crowdstrike/ember-oss-docs/glint";

import type { PageMetadata } from '@docfy/core/lib/types';

// Gotta TS-ignore because ember-cli-typescript is currently required
// for embroider.
// And I haven't figured out how to disable tsserver in glint projects.
// (since glint projects use the glint-language-server instead)
//
// @ts-ignore
import type ThemeSwitcher from 'docs-app/components/theme-switcher';
// @ts-ignore
import type PageHeadings from 'docs-app/components/page-headings';
// @ts-ignore
import type FeatureCard from 'docs-app/components/feature-card';


import type { ComponentLike, ModifierLike } from "@glint/template";

declare module "@glint/environment-ember-loose/registry" {
  export default interface Registry {
    // Examples
    // state: HelperLike<{ Args: {}, Return: State }>;
    // attachShadow: ModifierLike<{ Args: { Positional: [State['update']]}}>;
    // welcome: typeof Welcome;
    ThemeSwitcher: typeof ThemeSwitcher;
    PageHeadings: typeof PageHeadings;
    FeatureCard: typeof FeatureCard;
    DocfyLink: ComponentLike<{
      Element: HTMLAnchorElement;
      Args: {
        to: string;
        anchor?: string;
      };
      Blocks: {
        default: []
      }
    }>;
    DocfyOutput: ComponentLike<{
      Args: {
        fromCurrentURL?: boolean;
        scope?: string;
      }
      Blocks: {
        default: [PageMetadata]
      }
    }>;
    DocfyPreviousAndNextPage: ComponentLike<{
      Blocks: {
        default: [PageMetadata, PageMetadata]
      }
    }>;

    'intersect-headings': ModifierLike<{
      Args: {
        Positional: [(id: string | undefined) => void];
        Named: {
          headings: unknown[];
        }
      }
    }>;

  }
}

