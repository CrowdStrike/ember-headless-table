import "@glint/environment-ember-loose";
import "@glint/environment-ember-template-imports";

// Types from libraries
import type CrowdStrikeOSSDocsSupport from "@crowdstrike/ember-oss-docs/template-registry";
import type { HelperLike, ModifierLike } from "@glint/template";
// Our own types
import type FeatureCard from 'docs-app/components/feature-card';
import type ThemeSwitcher from 'docs-app/components/theme-switcher';

declare module '@ember/modifier' {
  export const on: ModifierLike<{
    Args: {
      Positional: [eventName: string, eventHandler: (event: Event) => void];
    }
  }>
}

declare module "@glint/environment-ember-loose/registry" {
  export default interface Registry extends CrowdStrikeOSSDocsSupport {
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

