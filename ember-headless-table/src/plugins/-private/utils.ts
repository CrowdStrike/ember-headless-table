import { assert } from '@ember/debug';

import type { BasePlugin } from './base';
import type { Constructor } from '[private-types]';
import type { Plugin } from '#interfaces';

export type PluginOption<P = Plugin> = P extends BasePlugin<any, any, infer Options, any>
  ? readonly [Constructor<P>, () => Options]
  : readonly [P | Constructor<P>, () => unknown];

type WithTableOptions<P = BasePlugin> = P extends BasePlugin<any, any, infer Options, any>
  ? [Constructor<P>, () => Options]
  : never;

export type Plugins = (Plugin | BasePlugin | Constructor<Plugin | BasePlugin> | WithTableOptions)[];

export function normalizePluginsConfig(plugins?: Plugins): PluginOption[] {
  if (!plugins) return [];

  let result: PluginOption[] = [];

  for (let plugin of plugins) {
    if (!Array.isArray(plugin)) {
      result.push([plugin, () => ({})]);

      continue;
    }

    if (plugin.length === 2) {
      result.push([plugin[0], plugin[1]]);

      continue;
    }

    result.push([plugin[0], () => ({})]);
  }

  assert(
    `Every entry in the plugins config must be invokable`,
    result.every((tuple) => typeof tuple[0] === 'function' && typeof tuple[1] === 'function')
  );

  return result;
}

/**
 * Creates a map of featureName => [plugins providing said feature name]
 */
function collectFeatures(plugins: PluginOption[]) {
  let result: Record<string, { name: string }[]> = {};

  for (let [plugin] of plugins) {
    if ('features' in plugin) {
      for (let feature of plugin.features || []) {
        result[feature] = [...(result[feature] || []), plugin];
      }
    }
  }

  return result;
}

/**
 * Creates a map of requirement => [plugins requesting the feature / requirement]
 */
function collectRequirements(plugins: PluginOption[]) {
  let result: Record<string, { name: string }[]> = {};

  for (let [plugin] of plugins) {
    if ('requires' in plugin) {
      for (let requirement of plugin.requires || []) {
        result[requirement] = [...(result[requirement] || []), plugin];
      }
    }
  }

  return result;
}

export function verifyPlugins(plugins: PluginOption[]) {
  let features = collectFeatures(plugins);
  let requirements = collectRequirements(plugins);
  let allFeatures = Object.keys(features);
  let errors: string[] = [];

  // Only one plugin can provide each feature
  for (let [feature, providingPlugins] of Object.entries(features)) {
    if (providingPlugins.length > 1) {
      errors.push(
        `More than one plugin is providing the feature: ${feature}. ` +
          `Please remove one of ${providingPlugins.map((p) => p.name).join(', ')}`
      );
    }
  }

  for (let [requirement, requestingPlugins] of Object.entries(requirements)) {
    if (!allFeatures.includes(requirement)) {
      errors.push(
        `Configuration is missing requirement: ${requirement}, ` +
          `And is requested by ${requestingPlugins.map((p) => p.name).join(', ')}. ` +
          `Please add a plugin with the ${requirement} feature`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

type AssignableStyles = Omit<CSSStyleDeclaration, 'length' | 'parentRule'>;

/**
 * @public
 *
 * Utility that helps safely apply styles to an element
 */
export function applyStyles(element: HTMLElement | SVGElement, styles: Partial<AssignableStyles>) {
  for (let [name, value] of Object.entries(styles)) {
    if (name in element.style) {
      assignStyle(
        element,
        name as keyof CSSStyleDeclaration,
        value as CSSStyleDeclaration[keyof CSSStyleDeclaration]
      );
    }
  }
}

type StyleDeclarationFor<MaybeStyle> = MaybeStyle extends keyof CSSStyleDeclaration
  ? MaybeStyle
  : never;

function assignStyle<StyleName>(
  element: HTMLElement | SVGElement,
  styleName: StyleDeclarationFor<StyleName>,
  value: CSSStyleDeclaration[StyleDeclarationFor<StyleName>]
) {
  element.style[styleName] = value;
}

function removeStyle(element: HTMLElement | SVGElement, styleName: string) {
  element.style.removeProperty(styleName);
}

/**
 * @public
 *
 * Utility that helps safely remove styles from an element
 */
export function removeStyles(
  element: HTMLElement | SVGElement,
  styles: Array<keyof AssignableStyles>
) {
  for (let name of styles) {
    if (typeof name !== 'string') continue;
    removeStyle(element, name);
  }
}
