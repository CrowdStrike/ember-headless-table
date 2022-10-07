import "@glint/environment-ember-loose";
import "@glint/environment-ember-template-imports";

// Types from libraries
import "@crowdstrike/ember-oss-docs/glint";

// Our own types
import type ThemeSwitcher from 'docs-app/components/theme-switcher';
import type FeatureCard from 'docs-app/components/feature-card';

import type { HelperLike, ModifierLike } from "@glint/template";

declare module '@ember/modifier' {
  export const on: ModifierLike<{
    Args: {
      Positional: [eventName: string, eventHandler: (event: Event) => void];
    }
  }>
}

declare module "@glint/environment-ember-loose/registry" {
  export default interface Registry {
    ThemeSwitcher: typeof ThemeSwitcher;
    FeatureCard: typeof FeatureCard;

    // ember-page-title does not provide its own types
    'page-title': HelperLike<{
      Args: {
        Positional: [string];
      };
      Return: string;
    }>
  }
}

